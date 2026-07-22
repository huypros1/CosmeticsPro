<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Mail\OrderStatusMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Exception;

class OrderController extends Controller
{
    // Luồng trạng thái hợp lệ (tuần tự, chỉ tiến không lùi)
    private const STATUS_ORDER = [
        'pending'    => 0,
        'confirmed'  => 1,
        'processing' => 2,
        'shipped'    => 3,
        'delivered'  => 4,
    ];

    public function index(Request $request)
    {
        $query = Order::with(['user'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhere('recipient_name', 'like', "%{$search}%")
                  ->orWhere('recipient_phone', 'like', "%{$search}%");
            });
        }

        return $query->paginate(15);
    }

    public function show($id)
    {
        return Order::with(['user', 'voucher', 'order_items.variant.product', 'order_items.variant.capacity'])
            ->findOrFail($id);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::with(['user', 'order_items.variant.product', 'order_items.variant.capacity'])
            ->findOrFail($id);

        $validated = $request->validate([
            'status'         => 'nullable|in:pending,confirmed,processing,shipped,delivered,cancelled',
            // Giá trị hợp lệ theo DB: unpaid, paid, refunded
            'payment_status' => 'nullable|in:unpaid,paid,refunded',
        ], [
            'status.in'         => 'Trạng thái đơn hàng không hợp lệ.',
            'payment_status.in' => 'Trạng thái thanh toán không hợp lệ. Các giá trị cho phép: unpaid, paid, refunded.',
        ]);

        $statusChanged  = false;
        $oldStatus      = $order->status;
        $newStatus      = $validated['status'] ?? null;

        // ─── Validate chuyển trạng thái đơn hàng ───────────────────────────
        if ($newStatus && $newStatus !== $oldStatus) {

            // Đơn đã hủy: không cho thay đổi gì thêm
            if ($oldStatus === 'cancelled') {
                return response()->json([
                    'message' => 'Đơn hàng đã hủy, không thể thay đổi trạng thái.',
                ], 422);
            }

            // Đơn đã giao: chỉ cho phép chuyển sang cancelled nếu chưa thanh toán
            if ($oldStatus === 'delivered' && $newStatus !== 'delivered') {
                return response()->json([
                    'message' => 'Đơn hàng đã giao không thể thay đổi trạng thái.',
                ], 422);
            }

            // Hủy đơn: chỉ khi chưa bắt đầu giao
            if ($newStatus === 'cancelled') {
                if (in_array($oldStatus, ['shipped', 'delivered'])) {
                    return response()->json([
                        'message' => 'Không thể hủy đơn hàng đang vận chuyển hoặc đã giao.',
                    ], 422);
                }
            } else {
                // Không cho lùi trạng thái (trừ khi hủy)
                $oldRank = self::STATUS_ORDER[$oldStatus] ?? -1;
                $newRank = self::STATUS_ORDER[$newStatus] ?? -1;

                if ($newRank !== -1 && $oldRank !== -1 && $newRank < $oldRank) {
                    return response()->json([
                        'message' => "Không thể lùi trạng thái từ \"{$oldStatus}\" về \"{$newStatus}\".",
                    ], 422);
                }
            }

            $order->status = $newStatus;
            $statusChanged = true;
        }

        // ─── Validate thay đổi payment_status ──────────────────────────────
        if (isset($validated['payment_status'])) {
            $newPaymentStatus = $validated['payment_status'];

            // Không cho đổi payment_status trên đơn đã hủy
            if ($order->status === 'cancelled' && $newPaymentStatus === 'paid') {
                return response()->json([
                    'message' => 'Không thể đánh dấu đã thanh toán cho đơn hàng đã hủy.',
                ], 422);
            }

            $order->payment_status = $newPaymentStatus;
        }

        // ─── Auto: đơn delivered + COD → tự động paid ─────────────────────
        if ($statusChanged && $order->status === 'delivered' && $order->payment_method === 'cod') {
            $order->payment_status = 'paid';
        }

        // ─── Auto: đơn bị hủy + đã thanh toán → gợi ý refunded ───────────
        // (Không tự động refunded vì cần thao tác thủ công từ admin)

        $order->save();

        // ─── Gửi email thông báo ────────────────────────────────────────────
        if ($statusChanged && in_array($order->status, ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])) {
            $emailMessages = [
                'confirmed'  => [
                    'title'   => 'Đơn hàng đã được xác nhận',
                    'message' => 'Đơn hàng của bạn đã được cửa hàng xác nhận và đang trong quá trình chuẩn bị.',
                ],
                'processing' => [
                    'title'   => 'Đơn hàng đang được đóng gói',
                    'message' => 'Đơn hàng của bạn đang được chuẩn bị và đóng gói, sẽ sớm được giao cho đơn vị vận chuyển.',
                ],
                'shipped'    => [
                    'title'   => 'Đơn hàng đang được vận chuyển',
                    'message' => 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển. Vui lòng chú ý điện thoại để nhận hàng.',
                ],
                'delivered'  => [
                    'title'   => 'Giao hàng thành công 🎉',
                    'message' => 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm tại HQCosmetics! Bạn có thể đánh giá sản phẩm trên trang chi tiết đơn hàng.',
                ],
                'cancelled'  => [
                    'title'   => 'Đơn hàng đã bị hủy',
                    'message' => ($order->payment_method === 'vietqr' && $order->payment_status === 'paid')
                        ? 'Rất tiếc, đơn hàng của bạn đã bị hủy. Do bạn đã thanh toán qua VietQR, vui lòng phản hồi email này kèm Số tài khoản và Ngân hàng để chúng tôi hoàn tiền.'
                        : 'Rất tiếc, đơn hàng của bạn đã bị hủy. Vui lòng liên hệ nếu có thắc mắc.',
                ],
            ];

            if (isset($emailMessages[$order->status])) {
                $em = $emailMessages[$order->status];
                try {
                    Mail::to($order->user->email)->send(new OrderStatusMail($order, $em['title'], $em['message']));
                } catch (Exception $e) {
                    Log::warning('Không thể gửi email cập nhật đơn hàng: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Cập nhật đơn hàng thành công',
            'order'   => $order->fresh(),
        ]);
    }
}
