<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Cấu hình tài khoản ngân hàng nhận tiền của cửa hàng.
     * ⚠️ Thay thông tin thật của bạn vào đây.
     */
    private $bankConfig = [
        'bank_bin'       => '970422',           // 970436 = Vietcombank | 970415 = VietinBank | 970418 = BIDV
        'account_number' => '0337904157',        // Số tài khoản của bạn
        'account_name'   => 'NGUYEN DINH DU HUY',      // Tên chủ tài khoản (VIET HOA KHONG DAU)
        'bank_name'      => 'MBBank',
    ];

    /**
     * Tạo URL ảnh QR VietQR để thanh toán.
     * POST /api/payment/vietqr
     */
    public function generateVietQR(Request $request)
    {
        $request->validate([
            'amount'   => 'required|numeric|min:1000',
            'order_id' => 'required',
        ]);

        $amount   = (int) $request->amount;
        $orderId  = $request->order_id;
        $memo     = $request->memo ?? "HQCosmetic DH{$orderId}";

        $cfg    = $this->bankConfig;
        $bin    = $cfg['bank_bin'];
        $accNum = $cfg['account_number'];

        // Tạo URL ảnh QR từ img.vietqr.io (hoàn toàn miễn phí, không cần API key)
        // Template: compact2 (có logo ngân hàng + thông tin)
        $encodedMemo = urlencode($memo);
        $qrImageUrl  = "https://img.vietqr.io/image/{$bin}-{$accNum}-compact2.png"
            . "?amount={$amount}"
            . "&addInfo={$encodedMemo}"
            . "&accountName=" . urlencode($cfg['account_name']);

        return response()->json([
            'success'        => true,
            'qr_image_url'   => $qrImageUrl,
            'bank_name'      => $cfg['bank_name'],
            'account_number' => $cfg['account_number'],
            'account_name'   => $cfg['account_name'],
            'amount'         => $amount,
            'memo'           => $memo,
        ]);
    }

    /**
     * Kiểm tra trạng thái thanh toán của đơn hàng (frontend polling).
     * GET /api/payment/status/{orderId}
     */
    public function checkStatus(Request $request, $orderId)
    {
        $order = \App\Models\Order::where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'order_id'       => $order->id,
            'payment_status' => $order->payment_status,
            'status'         => $order->status,
            'is_paid'        => $order->payment_status === 'paid',
        ]);
    }

    /**
     * Admin xác nhận đã nhận thanh toán (cập nhật payment_status = paid).
     * POST /api/admin/payment/{orderId}/confirm
     */
    public function adminConfirmPayment($orderId)
    {
        $order = \App\Models\Order::findOrFail($orderId);

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Đơn hàng đã được xác nhận thanh toán trước đó.'], 422);
        }

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Không thể xác nhận thanh toán cho đơn hàng đã hủy.'], 422);
        }

        $updateData = ['payment_status' => 'paid'];

        // Chỉ chuyển sang confirmed nếu đơn vẫn còn ở pending (chưa admin xử lý)
        if ($order->status === 'pending') {
            $updateData['status'] = 'confirmed';
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Xác nhận thanh toán thành công',
            'order'   => [
                'id'             => $order->id,
                'payment_status' => $order->payment_status,
                'status'         => $order->status,
            ],
        ]);
    }
}
