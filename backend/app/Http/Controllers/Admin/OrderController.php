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
                  });
            });
        }

        return $query->paginate(15);
    }

    public function show($id)
    {
        return Order::with(['user', 'shipping_address', 'voucher', 'order_items.variant.product', 'order_items.variant.capacity'])
            ->findOrFail($id);
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::with(['user', 'shipping_address', 'order_items.variant.product', 'order_items.variant.capacity'])->findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'nullable|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'payment_status' => 'nullable|in:pending,paid,failed,refunded'
        ]);

        $statusChanged = false;
        $oldStatus = $order->status;
        $newStatus = $validated['status'] ?? null;

        if ($newStatus && $newStatus !== $oldStatus) {
            // Rules for state machine
            $statusOrder = ['pending' => 0, 'confirmed' => 1, 'processing' => 2, 'shipped' => 3, 'delivered' => 4];
            
            // 1. Prevent changing out of cancelled
            if ($oldStatus === 'cancelled') {
                return response()->json(['message' => 'Đơn hàng đã hủy không thể thay đổi trạng thái.'], 400);
            }
            
            // 2. Cancelation rules
            if ($newStatus === 'cancelled') {
                if (in_array($oldStatus, ['shipped', 'delivered'])) {
                    return response()->json(['message' => 'Không thể hủy đơn hàng đang giao hoặc đã giao.'], 400);
                }
            } else {
                // 3. Prevent backward changes
                if (isset($statusOrder[$oldStatus]) && isset($statusOrder[$newStatus])) {
                    if ($statusOrder[$newStatus] < $statusOrder[$oldStatus]) {
                        return response()->json(['message' => 'Không thể lùi trạng thái đơn hàng.'], 400);
                    }
                }
            }

            $order->status = $newStatus;
            $statusChanged = true;
        }
        
        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
        }

        $order->save();
        
        // Gửi email nếu có đổi trạng thái
        if ($statusChanged && in_array($order->status, ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])) {
            $title = '';
            $message = '';
            
            switch ($order->status) {
                case 'confirmed':
                case 'processing':
                    $title = 'Đơn hàng đã được xác nhận';
                    $message = 'Đơn hàng của bạn đã được cửa hàng xác nhận và đang trong quá trình chuẩn bị.';
                    break;
                case 'shipped':
                    $title = 'Đơn hàng đang được vận chuyển';
                    $message = 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển. Bạn vui lòng chú ý điện thoại để nhận hàng nhé.';
                    break;
                case 'delivered':
                    $title = 'Giao hàng thành công';
                    $message = 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm tại HQCosmetics! Bạn có thể đánh giá trải nghiệm của mình trên trang chi tiết đơn hàng.';
                    break;
                case 'cancelled':
                    $title = 'Đơn hàng đã bị hủy';
                    if ($order->payment_method === 'vietqr' && $order->payment_status === 'paid') {
                        $message = 'Rất tiếc, đơn hàng của bạn đã bị hủy. Do bạn đã thanh toán qua VietQR, vui lòng phản hồi lại email này kèm thông tin Số tài khoản và Tên ngân hàng để chúng tôi tiến hành hoàn tiền cho bạn.';
                    } else {
                        $message = 'Rất tiếc, đơn hàng của bạn đã bị hủy. Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ thắc mắc nào.';
                    }
                    break;
            }
            
            try {
                Mail::to($order->user->email)->send(new OrderStatusMail($order, $title, $message));
            } catch (Exception $e) {
                Log::warning('Không thể gửi email cập nhật trạng thái đơn hàng: ' . $e->getMessage());
            }
        }

        return response()->json($order);
    }
}
