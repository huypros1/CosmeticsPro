<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Khôi phục mật khẩu – HQCosmetics</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f5f1; color: #333; }
        .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }

        /* Header */
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 48px 32px 40px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; width: 300px; height: 300px; background: radial-gradient(circle, rgba(201,149,106,0.15) 0%, transparent 70%); top: -80px; left: -80px; }
        .header::after  { content: ''; position: absolute; width: 200px; height: 200px; background: radial-gradient(circle, rgba(201,149,106,0.10) 0%, transparent 70%); bottom: -40px; right: -40px; }
        .lock-icon { width: 72px; height: 72px; background: rgba(201,149,106,0.15); border: 1px solid rgba(201,149,106,0.3); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
        .lock-icon svg { width: 32px; height: 32px; color: #C9956A; }
        .header-brand { font-size: 13px; letter-spacing: 0.2em; color: #C9956A; text-transform: uppercase; margin-bottom: 12px; font-weight: 500; position: relative; z-index: 1; }
        .header h1 { color: #fff; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; position: relative; z-index: 1; }
        .header p { color: rgba(255,255,255,.6); font-size: 14px; margin-top: 8px; position: relative; z-index: 1; }

        /* Body */
        .body { padding: 40px 40px 32px; }
        .greeting { font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px; }
        .info-box { background: #faf7f4; border: 1px solid #ede8e3; border-left: 4px solid #C9956A; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px; font-size: 14px; color: #666; line-height: 1.6; }
        .info-box strong { color: #333; }

        /* CTA Button */
        .cta { text-align: center; margin: 32px 0; }
        .cta a {
            display: inline-block;
            background: linear-gradient(135deg, #C9956A 0%, #a67652 100%);
            color: #fff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.3px;
            box-shadow: 0 8px 20px rgba(201,149,106,0.35);
        }

        /* Fallback link */
        .fallback { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
        .fallback p { font-size: 13px; color: #888; margin-bottom: 8px; }
        .fallback code { font-size: 12px; color: #C9956A; word-break: break-all; display: block; line-height: 1.5; }

        /* Expiry notice */
        .expiry-notice { display: flex; align-items: flex-start; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; font-size: 13px; color: #78350f; line-height: 1.5; }
        .expiry-notice svg { flex-shrink: 0; margin-top: 1px; }

        /* Footer */
        .footer { background: #faf7f4; padding: 24px 40px; border-top: 1px solid #ede8e3; }
        .footer-ignore { font-size: 13px; color: #888; line-height: 1.6; margin-bottom: 20px; }
        .footer-copy { text-align: center; font-size: 12px; color: #aaa; padding-top: 16px; border-top: 1px solid #eee; }
        .footer-copy strong { color: #C9956A; }
    </style>
</head>
<body>
    <div class="wrapper">

        {{-- Header --}}
        <div class="header">
            <div class="lock-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#C9956A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
            </div>
            <p class="header-brand">HQCosmetics</p>
            <h1>Yêu cầu đặt lại mật khẩu</h1>
            <p>Chúng tôi nhận được yêu cầu từ tài khoản của bạn</p>
        </div>

        {{-- Body --}}
        <div class="body">
            <p class="greeting">
                Xin chào,<br><br>
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HQCosmetics liên kết với địa chỉ email này.
                Vui lòng nhấn nút bên dưới để tiến hành đặt lại mật khẩu của bạn.
            </p>

            {{-- Expiry warning --}}
            <div class="expiry-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Link đặt lại mật khẩu này sẽ <strong>hết hạn sau 60 phút</strong> kể từ thời điểm email được gửi.</span>
            </div>

            {{-- CTA --}}
            <div class="cta">
                <a href="{{ $resetUrl }}">🔑 Đặt lại mật khẩu</a>
            </div>

            {{-- Fallback --}}
            <div class="fallback">
                <p>Nếu nút bấm không hoạt động, hãy copy và dán đường link sau vào trình duyệt:</p>
                <code>{{ $resetUrl }}</code>
            </div>
        </div>

        {{-- Footer --}}
        <div class="footer">
            <p class="footer-ignore">
                Nếu bạn <strong>không thực hiện</strong> yêu cầu này, bạn có thể bỏ qua email này một cách an toàn.
                Mật khẩu tài khoản của bạn sẽ <strong>không thay đổi</strong> nếu bạn không nhấn vào link trên.
            </p>
            <div class="footer-copy">
                &copy; {{ date('Y') }} <strong>HQCosmetics</strong>. All rights reserved.
            </div>
        </div>

    </div>
</body>
</html>
