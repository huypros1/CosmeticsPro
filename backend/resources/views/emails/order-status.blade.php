<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $statusTitle }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; }
        .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; color: #111; letter-spacing: 1px; }
        .logo span { font-weight: 300; color: #C9956A; }
        h2 { color: #333333; font-size: 20px; margin-bottom: 10px; }
        .status-badge { display: inline-block; padding: 6px 12px; background: #C9956A15; color: #C9956A; border-radius: 4px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
        p { color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 15px; }
        
        .order-info { background: #fafafa; border: 1px solid #eeeeee; padding: 20px; border-radius: 6px; margin: 25px 0; }
        .order-info h3 { margin-top: 0; font-size: 16px; color: #333; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #555; }
        .item-name { font-weight: 500; color: #333; }
        .item-meta { font-size: 13px; color: #888; }
        
        .total-row { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-weight: bold; color: #111; font-size: 16px; }
        
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 12px 28px; background-color: #111111; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px; }
        
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; color: #999999; font-size: 13px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
            HQ<span>Cosmetics</span>
        </div>
        
        <h2>Xin chào {{ $order->user->name }},</h2>
        <div class="status-badge">{{ $statusTitle }}</div>
        
        <p>{{ $statusMessage }}</p>
        <p>Mã đơn hàng của bạn là: <strong>#{{ $order->id }}</strong></p>
        
        <div class="order-info">
            <h3>Chi tiết sản phẩm</h3>
            @foreach($order->order_items as $item)
            <div class="item-row">
                <div>
                    <div class="item-name">{{ $item->variant->product->name }}</div>
                    <div class="item-meta">
                        {{ $item->variant->capacity ? $item->variant->capacity->value . $item->variant->capacity->unit : '' }} 
                        x {{ $item->quantity }}
                    </div>
                </div>
                <div>{{ number_format($item->price * $item->quantity, 0, ',', '.') }}đ</div>
            </div>
            @endforeach
            
            <div class="total-row">
                <div>Tổng cộng:</div>
                <div style="color: #C9956A;">{{ number_format($order->total_amount, 0, ',', '.') }}đ</div>
            </div>
        </div>
        
        <div class="order-info">
            <h3>Thông tin giao hàng</h3>
            @if($order->shipping_address)
            <p style="margin: 0; font-size: 14px;">
                <strong>{{ $order->shipping_address->user_name ?? $order->user->name }}</strong><br>
                SĐT: {{ $order->shipping_address->phone }}<br>
                {{ $order->shipping_address->address_line }}<br>
                {{ $order->shipping_address->ward_name }}, {{ $order->shipping_address->district_name }}, {{ $order->shipping_address->province_name }}
            </p>
            @endif
        </div>
        
        <div class="btn-wrapper">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/orders/{{ $order->id }}" class="btn">Xem chi tiết đơn hàng</a>
        </div>
        
        <p>Cảm ơn bạn đã tin tưởng và mua sắm tại HQCosmetics!</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} HQCosmetics. All rights reserved.
        </div>
    </div>
</body>
</html>
