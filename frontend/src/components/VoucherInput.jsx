/**
 * VoucherInput — Component nhập và áp dụng mã giảm giá
 *
 * Props:
 *   orderValue      (number)   : Tổng tiền đơn hàng (subtotal) để server tính giảm
 *   onApplied       (function) : Callback khi áp dụng thành công: ({ voucher, discountAmount }) => void
 *   onRemoved       (function) : Callback khi xóa voucher: () => void
 *   appliedVoucher  (object|null) : Voucher đang áp dụng (từ state cha)
 *   discountAmount  (number)      : Số tiền đang giảm (từ state cha)
 */
import { useState } from 'react';
import { voucherApi } from '../api/voucherApi';

const formatPrice = (v) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);

const VoucherInput = ({
  orderValue = 0,
  onApplied,
  onRemoved,
  appliedVoucher = null,
  discountAmount = 0,
}) => {
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  /* ── Apply ─────────────────────────────────────────────────── */
  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await voucherApi.validateVoucher(code.trim(), orderValue);
      onApplied?.({
        voucher:        res.voucher,
        discountAmount: res.discount_amount ?? 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Mã giảm giá không hợp lệ.');
      onRemoved?.();
    } finally {
      setLoading(false);
    }
  };

  /* ── Remove ─────────────────────────────────────────────────── */
  const handleRemove = () => {
    setCode('');
    setError('');
    onRemoved?.();
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="voucher-widget">

      {/* Input + Button row */}
      <div className="voucher-widget__row">
        <div className="voucher-widget__input-wrap">
          <i className="bi bi-ticket-perforated voucher-widget__icon" />
          <input
            type="text"
            className={`voucher-widget__input${error ? ' voucher-widget__input--error' : ''}`}
            placeholder="Nhập mã giảm giá..."
            value={appliedVoucher ? appliedVoucher.code : code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/\s/g, ''));
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleApply(); }
            }}
            disabled={!!appliedVoucher || loading}
            maxLength={50}
            aria-label="Mã giảm giá"
          />
        </div>

        {/* Áp dụng / Xóa */}
        {appliedVoucher ? (
          <button
            type="button"
            className="voucher-widget__btn voucher-widget__btn--remove"
            onClick={handleRemove}
            aria-label="Xóa voucher"
          >
            <i className="bi bi-x-circle" /> Xóa
          </button>
        ) : (
          <button
            type="button"
            className="voucher-widget__btn voucher-widget__btn--apply"
            onClick={handleApply}
            disabled={loading || !code.trim()}
          >
            {loading
              ? <><span className="voucher-widget__spinner" /> Kiểm tra...</>
              : <><i className="bi bi-check2-circle" /> Áp dụng</>}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="voucher-widget__error" role="alert">
          <i className="bi bi-exclamation-circle-fill" />
          {error}
        </div>
      )}

      {/* Applied success badge */}
      {appliedVoucher && (
        <div className="voucher-widget__applied">
          <div className="voucher-widget__applied-left">
            <i className="bi bi-check-circle-fill" />
            <div>
              <span className="voucher-widget__applied-code">{appliedVoucher.code}</span>
              {appliedVoucher.description && (
                <span className="voucher-widget__applied-desc">{appliedVoucher.description}</span>
              )}
            </div>
          </div>
          <div className="voucher-widget__applied-discount">
            −{formatPrice(discountAmount)}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherInput;
