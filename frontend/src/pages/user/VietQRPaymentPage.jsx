import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentApi } from '../../api/paymentApi';
import { orderApi } from '../../api/orderApi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const POLL_INTERVAL_MS = 5000; // Kiểm tra mỗi 5 giây

const VietQRPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | pending | paid | error
  const [copied, setCopied] = useState('');
  const [countdown, setCountdown] = useState(POLL_INTERVAL_MS / 1000);
  const [imgError, setImgError] = useState(false);
  const pollRef = useRef(null);
  const countRef = useRef(null);

  // Lấy thông tin đơn hàng
  useEffect(() => {
    orderApi.getOrderById(orderId)
      .then((res) => {
        const ord = res?.data ?? res;
        setOrder(ord);
        if (ord?.payment_status === 'paid') {
          setStatus('paid');
          return;
        }
        // Lấy QR code
        return paymentApi.generateVietQR({
          amount: Math.round(ord.total_amount),
          order_id: orderId,
          memo: `HQCosmetic DH${orderId}`,
        });
      })
      .then((qr) => {
        if (qr) {
          setQrData(qr);
          setStatus('pending');
        }
      })
      .catch(() => setStatus('error'));
  }, [orderId]);

  // Polling kiểm tra thanh toán
  const pollStatus = useCallback(async () => {
    if (status === 'paid') return;
    try {
      const res = await paymentApi.checkStatus(orderId);
      if (res?.is_paid || res?.payment_status === 'paid') {
        setStatus('paid');
      }
    } catch {
      // Bỏ qua lỗi polling
    }
  }, [orderId, status]);

  useEffect(() => {
    if (status !== 'pending') {
      clearInterval(pollRef.current);
      clearInterval(countRef.current);
      return;
    }
    // Bắt đầu polling
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    // Đếm ngược hiển thị
    countRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? POLL_INTERVAL_MS / 1000 : c - 1));
    }, 1000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(countRef.current);
    };
  }, [status, pollStatus]);

  // Khi thanh toán thành công → redirect sau 3 giây
  useEffect(() => {
    if (status === 'paid') {
      const t = setTimeout(() => navigate(`/orders/${orderId}`), 3500);
      return () => clearTimeout(t);
    }
  }, [status, orderId, navigate]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ── LOADING ─────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="qrpage-container">
        <div className="qrpage-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 60 }}>
          <div className="qrpage-spinner" />
          <p style={{ color: '#64748b', margin: 0 }}>Đang tạo mã QR thanh toán...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="qrpage-container">
        <div className="qrpage-card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ color: '#ef4444', marginTop: 12 }}>Không thể tải thông tin thanh toán</h2>
          <p style={{ color: '#64748b' }}>Vui lòng kiểm tra lại đơn hàng của bạn.</p>
          <Link to={`/orders/${orderId}`} className="btn btn-primary" style={{ marginTop: 16 }}>
            Xem đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // ── PAID - Success ───────────────────────────────────────
  if (status === 'paid') {
    return (
      <div className="qrpage-container">
        <div className="qrpage-card qrpage-card--success">
          <i className="bi bi-check-circle-fill qrpage-success-icon-bi" />
          <h2 className="qrpage-success-title">Thanh toán thành công! 🎉</h2>
          <p className="qrpage-success-sub">Đơn hàng #{orderId} của bạn đã được xác nhận.</p>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Đang chuyển đến trang đơn hàng...</p>
          <div className="qrpage-progress-bar">
            <div className="qrpage-progress-fill" />
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING - Show QR ────────────────────────────────────
  return (
    <div className="qrpage-container">
      {/* Header */}
      <div className="qrpage-header">
        <Link to="/" className="qrpage-logo">🌸 HQCosmetic</Link>
        <h1 className="qrpage-title">Thanh toán VietQR</h1>
        <Link to={`/orders/${orderId}`} className="qrpage-skip-link">Bỏ qua →</Link>
      </div>

      <div className="qrpage-body">
        {/* Left - QR Code */}
        <div className="qrpage-qr-panel">
          <div className="qrpage-qr-badge">Quét & Thanh toán</div>

          {!imgError && qrData?.qr_image_url ? (
            <img
              src={qrData.qr_image_url}
              alt="VietQR"
              className="qrpage-qr-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="qrpage-qr-placeholder">
              <i className="bi bi-qr-code" style={{ fontSize: 56, color: '#cbd5e1' }} />
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Không tải được QR</p>
            </div>
          )}

          <p className="qrpage-qr-hint">Mở app ngân hàng → Quét mã QR</p>
          <p className="qrpage-qr-hint" style={{ fontSize: 11 }}>Hỗ trợ tất cả ngân hàng Việt Nam</p>

          {/* Bank logos row */}
          <div className="qrpage-bank-logos">
            {['VCB', 'MB', 'TCB', 'ACB', 'BIDV', 'VTB'].map((b) => (
              <span key={b} className="qrpage-bank-tag">{b}</span>
            ))}
          </div>
        </div>

        {/* Right - Info */}
        <div className="qrpage-info-panel">
          <div className="qrpage-order-badge">Đơn hàng #{orderId}</div>

          <div className="qrpage-info-rows">
            <div className="qrpage-info-row">
              <span className="qrpage-info-label">Ngân hàng</span>
              <span className="qrpage-info-value qrpage-info-value--bank">{qrData?.bank_name}</span>
            </div>

            <div className="qrpage-info-row">
              <span className="qrpage-info-label">Số tài khoản</span>
              <div className="qrpage-copy-row">
                <span className="qrpage-info-value qrpage-info-value--mono">{qrData?.account_number}</span>
                <button
                  className={`qrpage-copy-btn${copied === 'acc' ? ' copied' : ''}`}
                  onClick={() => handleCopy(qrData?.account_number, 'acc')}
                >
                  {copied === 'acc' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="qrpage-info-row">
              <span className="qrpage-info-label">Chủ tài khoản</span>
              <span className="qrpage-info-value">{qrData?.account_name}</span>
            </div>

            <div className="qrpage-info-row qrpage-info-row--amount">
              <span className="qrpage-info-label">Số tiền</span>
              <span className="qrpage-info-value qrpage-info-value--amount">
                {formatPrice(qrData?.amount ?? order?.total_amount ?? 0)}
              </span>
            </div>

            <div className="qrpage-info-row">
              <span className="qrpage-info-label">Nội dung chuyển khoản</span>
              <div className="qrpage-copy-row">
                <span className="qrpage-info-value qrpage-info-value--memo">{qrData?.memo}</span>
                <button
                  className={`qrpage-copy-btn${copied === 'memo' ? ' copied' : ''}`}
                  onClick={() => handleCopy(qrData?.memo, 'memo')}
                >
                  {copied === 'memo' ? '✓' : 'Chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Polling status */}
          <div className="qrpage-poll-status">
            <div className="qrpage-poll-dot" />
            <span>Đang chờ xác nhận thanh toán</span>
            <span className="qrpage-poll-count">({countdown}s)</span>
          </div>

          <div className="qrpage-steps">
            <p className="qrpage-steps__title">Hướng dẫn:</p>
            <ol className="qrpage-steps__list">
              <li>Mở ứng dụng ngân hàng của bạn</li>
              <li>Chọn <strong>Quét QR</strong> hoặc <strong>Chuyển khoản</strong></li>
              <li>Nhập thông tin hoặc quét mã QR ở bên trái</li>
              <li>Xác nhận chuyển khoản — trang này sẽ <strong>tự động cập nhật</strong></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VietQRPaymentPage;
