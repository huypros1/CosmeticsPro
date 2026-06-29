import { useState } from 'react';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

/**
 * Modal hiển thị QR VietQR để thanh toán chuyển khoản
 */
const VietQRModal = ({ isOpen, qrData, onConfirm, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !qrData) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(qrData.account_number).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="vietqr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vietqr-modal">
        {/* Header */}
        <div className="vietqr-modal__header">
          <div className="vietqr-modal__title-group">
            <div className="vietqr-modal__badge">QR Pay</div>
            <h2 className="vietqr-modal__title">Thanh toán VietQR</h2>
          </div>
          <button className="vietqr-modal__close" onClick={onClose} aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="vietqr-modal__body">
          {/* QR code */}
          <div className="vietqr-modal__qr-wrap">
            {!imgError ? (
              <img
                src={qrData.qr_image_url}
                alt="Mã QR thanh toán"
                className="vietqr-modal__qr-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="vietqr-modal__qr-fallback">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <circle cx="17.5" cy="17.5" r="2.5"/>
                </svg>
                <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>Không tải được QR</p>
              </div>
            )}
            <p className="vietqr-modal__scan-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 4 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Mở app ngân hàng → Quét QR để thanh toán
            </p>
          </div>

          {/* Bank info */}
          <div className="vietqr-modal__info">
            <div className="vietqr-info-row">
              <span className="vietqr-info-row__label">Ngân hàng</span>
              <span className="vietqr-info-row__value vietqr-info-row__value--highlight">{qrData.bank_name}</span>
            </div>
            <div className="vietqr-info-row">
              <span className="vietqr-info-row__label">Số tài khoản</span>
              <div className="vietqr-info-row__copy-group">
                <span className="vietqr-info-row__value">{qrData.account_number}</span>
                <button className={`vietqr-copy-btn${copied ? ' copied' : ''}`} onClick={handleCopyAccount}>
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Đã chép
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Chép
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="vietqr-info-row">
              <span className="vietqr-info-row__label">Chủ tài khoản</span>
              <span className="vietqr-info-row__value">{qrData.account_name}</span>
            </div>
            <div className="vietqr-info-row vietqr-info-row--amount">
              <span className="vietqr-info-row__label">Số tiền</span>
              <span className="vietqr-info-row__value vietqr-info-row__value--amount">{formatPrice(qrData.amount)}</span>
            </div>
            <div className="vietqr-info-row">
              <span className="vietqr-info-row__label">Nội dung CK</span>
              <span className="vietqr-info-row__value vietqr-info-row__value--memo">{qrData.memo}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="vietqr-modal__footer">
          <p className="vietqr-modal__note">
            ⚡ Sau khi chuyển khoản, đơn hàng sẽ được xác nhận trong vòng 1-2 phút.
          </p>
          <button className="btn btn-primary btn-full" onClick={onConfirm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Tôi đã chuyển khoản xong
          </button>
          <button className="vietqr-modal__later-btn" onClick={onClose}>
            Chuyển khoản sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default VietQRModal;
