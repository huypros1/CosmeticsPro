<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt hàng thành công</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f5f1; color: #333; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        .header { background: linear-gradient(135deg, #C9956A 0%, #a67652 100%); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; font-size: 28px; font-weight: 700; margin-bottom: 6px; }
        .header p { color: rgba(255,255,255,.85); font-size: 15px; }
        .check-icon { width: 64px; height: 64px; background: rgba(255,255,255,.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
        .check-icon svg { width: 32px; height: 32px; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; margin-bottom: 24px; color: #555; }
        .order-box { background: #faf7f4; border: 1px solid #ede8e3; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
        .order-box h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #C9956A; margin-bottom: 16px; }
        .order-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .meta-item label { font-size: 12px; color: #888; display: block; margin-bottom: 2px; }
        .meta-item span { font-size: 15px; font-weight: 600; color: #333; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #888; padding: 8px 0; border-bottom: 1px solid #ede8e3; }
        .items-table td { padding: 12px 0; border-bottom: 1px solid #f0ebe6; font-size: 14px; vertical-align: top; }
        .items-table tr:last-child td { border-bottom: none; }
        .total-row { font-size: 16px; font-weight: 700; color: #C9956A; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #fef3e8; color: #C9956A; }
        .payment-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .payment-paid { background: #d1fae5; color: #065f46; }
        .payment-unpaid { background: #fee2e2; color: #991b1b; }
        .shipping-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
        .shipping-box h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #0369a1; margin-bottom: 10px; }
        .cta { text-align: center; margin: 28px 0; }
        .cta a { display: inline-block; background: linear-gradient(135deg, #C9956A, #a67652); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 600; letter-spacing: .3px; }
        .footer { background: #faf7f4; padding: 24px 32px; text-align: center; border-top: 1px solid #ede8e3; }
        .footer p { font-size: 13px; color: #888; line-height: 1.6; }
        .footer strong { color: #C9956A; }
    </style>
</head>
<body>
<div class="wrapper">
    <!-- Header -->
    <div class="header">
        <div class="check-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <h1>Đặt hàng thành công!</h1>
        <p>Cảm ơn bạn đã tin tưởng HQCosmetic 🌸</p>
    </div>

    <!-- Body -->
    <div class="body">
        <p class="greeting">
            Xin chào <strong>{{ $order->user->name ?? 'Khách hàng' }}</strong>, 
            đơn hàng của bạn đã được xác nhận và đang được xử lý.
        </p>

        <!-- Order Info -->
        <div class="order-box">
            <h2>Thông tin đơn hàng</h2>
            <div class="order-meta">
                <div class="meta-item">
                    <label>Mã đơn hàng</label>
                    <span>#{{ $order->id }}</span>
                </div>
                <div class="meta-item">
                    <label>Ngày đặt</label>
                    <span>{{ $order->created_at->format('d/m/Y H:i') }}</span>
                </div>
                <div class="meta-item">
                    <label>Trạng thái</label>
                    <span class="status-badge">Chờ xác nhận</span>
                </div>
                <div class="meta-item">
                    <label>Thanh toán</label>
                    @if($order->payment_status === 'paid')
                        <span class="payment-badge payment-paid">✓ Đã thanh toán</span>
                    @else
                        <span class="payment-badge payment-unpaid">⏳ Chờ thanh toán</span>
                    @endif
                </div>
                <div class="meta-item">
                    <label>Phương thức thanh toán</label>
                    <span>{{ strtoupper($order->payment_method) }}</span>
                </div>
            </div>
        </div>

        <!-- Items -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th style="text-align:center">SL</th>
                    <th style="text-align:right">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->order_items ?? [] as $item)
                <tr>
                    <td>
                        <strong>{{ $item->variant->product->name ?? 'Sản phẩm' }}</strong>
                        @if($item->variant->capacity)
                        <br><small style="color:#888">{{ $item->variant->capacity->value }}{{ $item->variant->capacity->unit }}</small>
                        @endif
                    </td>
                    <td style="text-align:center">{{ $item->quantity }}</td>
                    <td style="text-align:right; font-weight:600">
                        {{ number_format($item->price * $item->quantity, 0, ',', '.') }}đ
                    </td>
                </tr>
                @endforeach
                @if($order->shipping_fee > 0)
                <tr>
                    <td colspan="2" style="color:#888">Phí vận chuyển</td>
                    <td style="text-align:right">{{ number_format($order->shipping_fee, 0, ',', '.') }}đ</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td colspan="2">Tổng cộng</td>
                    <td style="text-align:right">{{ number_format($order->total_amount, 0, ',', '.') }}đ</td>
                </tr>
            </tbody>
        </table>

        <!-- Shipping Address -->
        @if($order->shipping_address)
        <div class="shipping-box">
            <h2>📍 Địa chỉ giao hàng</h2>
            <p>{{ $order->shipping_address->address_line }}</p>
            <p style="margin-top:4px; color:#555">SĐT: {{ $order->shipping_address->phone }}</p>
        </div>
        @endif

        <!-- CTA Button -->
        <div class="cta">
            <a href="{{ config('app.url') === 'http://localhost:8000' ? 'http://localhost:5174' : config('app.url') }}/orders/{{ $order->id }}">
                Xem chi tiết đơn hàng →
            </a>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Bạn nhận được email này vì đã đặt hàng tại <strong>HQCosmetic</strong>.</p>
        <p style="margin-top:8px">Nếu có thắc mắc, vui lòng liên hệ: <strong>support@hqcosmetic.vn</strong></p>
    </div>
</div>
</body>
</html>
