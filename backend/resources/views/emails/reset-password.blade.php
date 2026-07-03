<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Khôi phục mật khẩu</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 0; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; margin-top: 40px; }
        .logo { text-align: center; margin-bottom: 30px; font-size: 24px; font-weight: bold; color: #111; letter-spacing: 1px; }
        .logo span { font-weight: 300; color: #C9956A; }
        h2 { color: #333333; font-size: 20px; margin-bottom: 20px; }
        p { color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
        .btn-wrapper { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 14px 32px; background-color: #111111; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 15px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; color: #999999; font-size: 13px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo">
            HQ<span>Cosmetics</span>
        </div>
        
        <h2>Xin chào,</h2>
        
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản HQCosmetics liên kết với địa chỉ email này.</p>
        
        <p>Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu của bạn. Link này sẽ hết hạn sau 60 phút.</p>
        
        <div class="btn-wrapper">
            <a href="{{ $resetUrl }}" class="btn">Đặt lại mật khẩu</a>
        </div>
        
        <p>Nếu nút bấm không hoạt động, bạn có thể copy và dán đường link sau vào trình duyệt:</p>
        <p style="word-break: break-all; color: #C9956A;">{{ $resetUrl }}</p>
        
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} HQCosmetics. All rights reserved.
        </div>
    </div>
</body>
</html>
