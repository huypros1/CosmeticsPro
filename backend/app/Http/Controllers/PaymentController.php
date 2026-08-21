<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Transaction;

class PaymentController extends Controller
{
    private string $merchantId  = '';
    private string $secretKey   = '';
    private string $env         = 'sandbox';

    public function __construct()
    {
        $this->merchantId = config('services.sepay.merchant_id', env('SEPAY_MERCHANT_ID', ''));
        $this->secretKey  = config('services.sepay.secret_key',  env('SEPAY_SECRET_KEY', ''));
        $this->env        = config('services.sepay.env',          env('SEPAY_ENV', 'sandbox'));
    }

    /**
     * Tạo SePay checkout form fields (ký bằng HMAC trên server).
     * POST /api/payment/sepay/create-checkout  (auth required)
     */
    public function sePayCreateCheckout(Request $request)
    {
        $request->validate([
            'order_id'    => 'required|integer',
            'amount'      => 'required|numeric|min:1000',
            'success_url' => 'required|string',
            'error_url'   => 'required|string',
            'cancel_url'  => 'required|string',
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $invoiceNumber = 'HQ-' . $order->id;
        $amount        = (int) $request->amount;
        $currency      = 'VND';
        $description   = "Thanh toan don hang {$invoiceNumber}";

        // Checkout URL theo env
        $checkoutURL = $this->env === 'sandbox'
            ? 'https://pay-sandbox.sepay.vn/v1/checkout/init'
            : 'https://pay.sepay.vn/v1/checkout/init';

        // Build payload
        $payload = [
            'merchant'             => $this->merchantId,
            'order_invoice_number' => $invoiceNumber,
            'order_amount'         => $amount,
            'currency'             => $currency,
            'order_description'    => $description,
            'operation'            => 'PURCHASE',
            'payment_method'       => 'BANK_TRANSFER',
            'success_url'          => $request->success_url,
            'error_url'            => $request->error_url,
            'cancel_url'           => $request->cancel_url,
        ];

        // Tạo chữ ký HMAC-SHA256 theo chuẩn của SePay SDK mới nhất
        $signed = [];
        foreach ($payload as $field => $val) {
            $signed[] = $field . "=" . $val;
        }
        
        $dataString = implode(',', $signed);
        $signature  = base64_encode(hash_hmac('sha256', $dataString, $this->secretKey, true));
        $payload['signature'] = $signature;

        return response()->json([
            'checkout_url' => $checkoutURL,
            'fields'       => $payload,
        ]);
    }


    /**
     * SePay IPN (Instant Payment Notification) webhook.
     * SePay gọi endpoint này sau khi giao dịch thành công.
     * POST /api/payment/sepay/ipn  (public, không cần auth)
     */
    public function sePayIPN(Request $request)
    {
        \Log::info('SePay IPN received', $request->all());

        $orderInvoiceNumber = $request->input('order_invoice_number') ?? $request->input('transaction_id');
        $status             = $request->input('status');

        if (!$orderInvoiceNumber) {
            return response()->json(['message' => 'Missing order_invoice_number'], 400);
        }

        // order_invoice_number được gửi từ frontend dạng "HQ-{orderId}"
        $orderId = ltrim(str_replace('HQ-', '', $orderInvoiceNumber), '0');
        $order   = Order::find($orderId);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        if (strtoupper($status) === 'SUCCESS') {
            $updateData = ['payment_status' => 'paid'];
            if ($order->status === 'pending') {
                $updateData['status'] = 'processing';
            }
            $order->update($updateData);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Frontend callback sau khi SePay redirect về (success case).
     * POST /api/payment/sepay/callback  (auth required)
     */
    public function sePayCallback(Request $request)
    {
        $request->validate(['order_id' => 'required']);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->payment_status !== 'paid') {
            $updateData = ['payment_status' => 'paid'];
            if ($order->status === 'pending') {
                $updateData['status'] = 'processing';
            }
            $order->update($updateData);
        }

        return response()->json(['success' => true, 'order_id' => $order->id]);
    }

    /**
     * Kiểm tra trạng thái thanh toán của đơn hàng (frontend polling).
     * GET /api/payment/status/{orderId}
     */
    public function checkStatus(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
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
        $order = Order::findOrFail($orderId);

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Đơn hàng đã được xác nhận thanh toán trước đó.'], 422);
        }

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Không thể xác nhận thanh toán cho đơn hàng đã hủy.'], 422);
        }

        $updateData = ['payment_status' => 'paid'];

        if ($order->status === 'pending') {
            $updateData['status'] = 'processing';
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

    /**
     * Webhook từ SePay khi có giao dịch ngân hàng (dựa trên sample)
     * POST /api/payment/order_success
     */
    public function sepayWebhook(Request $request)
    {
        // Token API Key để xác thực webhook
        $webhookToken = env('SEPAY_WEBHOOK_TOKEN', 'YOUR_SECRET_API_KEY_HERE');
        
        $authorization = $request->header('Authorization');
        
        // Kiểm tra xem header có chứa Bearer token không
        if (!$authorization || !str_starts_with($authorization, 'Bearer ') || substr($authorization, 7) !== $webhookToken) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $payload = $request->getContent();
        $data = json_decode($payload);

        if (!is_object($data)) {
            return response()->json(['success' => false, 'message' => 'No data'], 400);
        }

        $amount_in = 0;
        $amount_out = 0;

        if ($data->transferType == "in") {
            $amount_in = $data->transferAmount;
        } else if ($data->transferType == "out") {
            $amount_out = $data->transferAmount;
        }

        // Lưu log giao dịch vào CSDL
        Transaction::create([
            'gateway'             => $data->gateway,
            'transaction_date'    => $data->transactionDate,
            'account_number'      => $data->accountNumber,
            'sub_account'         => $data->subAccount,
            'amount_in'           => $amount_in,
            'amount_out'          => $amount_out,
            'accumulated'         => $data->accumulated,
            'code'                => $data->code,
            'transaction_content' => $data->content,
            'reference_number'    => $data->referenceCode,
            'body'                => $data->description,
        ]);

        // Tách mã đơn hàng từ nội dung chuyển khoản
        $regex = '/HQ-(\d+)/i'; // Hỗ trợ HQ- (không phân biệt hoa thường)
        if (!preg_match($regex, $data->content, $matches)) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy mã đơn hàng']);
        }

        $pay_order_id = $matches[1];

        // Tìm đơn hàng chưa thanh toán và có số tiền bằng đúng số tiền nhận được
        $order = Order::where('id', $pay_order_id)
            ->where('total_amount', $amount_in)
            ->where('payment_status', 'unpaid')
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found or already paid. Order_id ' . $pay_order_id]);
        }

        // Cập nhật trạng thái thanh toán
        $updateData = ['payment_status' => 'paid'];
        if ($order->status === 'pending') {
            $updateData['status'] = 'processing'; // Chuyển sang đang xử lý nếu trước đó là pending
        }
        $order->update($updateData);

        return response()->json(['success' => true]);
    }
}
