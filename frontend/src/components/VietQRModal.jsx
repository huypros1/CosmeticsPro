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
            <i className="bi bi-x-lg" style={{ fontSize: 20 }} />
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
                <i className="bi bi-qr-code" style={{ fontSize: 48, color: '#ccc' }} />
                <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>Không tải được QR</p>
              </div>
            )}
            <p className="vietqr-modal__scan-hint">
              <i className="bi bi-info-circle" style={{ marginRight: 4, fontSize: 14 }} />
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
                    <><i className="bi bi-check2" style={{ fontSize: 12 }} /> Đã chép</>
                  ) : (
                    <><i className="bi bi-copy" style={{ fontSize: 12 }} /> Chép</>
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
            <i className="bi bi-check2-circle" style={{ marginRight: 6, fontSize: 16 }} />
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
