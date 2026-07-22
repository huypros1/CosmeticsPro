import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { orderApi } from '../../api/orderApi';
import { voucherApi } from '../../api/voucherApi';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AddressFormFields from '../../components/AddressFormFields';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const CheckoutPage = () => {
  const { cartItems, fetchCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);          // object voucher
  const [discountAmount, setDiscountAmount] = useState(0); // số tiền giảm thực tế (từ server)
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddressString, setShippingAddressString] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      recipient_name:  user?.name || '',
      recipient_phone: '',
      street:          '',
    },
  });
  const streetValue = watch('street');

  /* ── Tính tiền ── */
  const subtotal    = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 ? 0 : 30000;
  // discount dùng giá trị trả về từ server, không tự tính lại
  const discount    = discountAmount;
  const total       = subtotal + shippingFee - discount;

  /* ── Áp voucher ── */
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setVoucherLoading(true);
      const res = await voucherApi.validateVoucher(voucherCode.trim(), subtotal);
      setVoucher(res.voucher || res);
      // Dùng discount_amount từ server — đã tính đúng trên subtotal + max_discount_amount
      setDiscountAmount(res.discount_amount ?? 0);
      toast.success('Áp dụng voucher thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Voucher không hợp lệ');
      setVoucher(null);
      setDiscountAmount(0);
    } finally {
      setVoucherLoading(false);
    }
  };

  /* ── Đặt hàng ── */
  const handlePlaceOrder = async (formData) => {
    if (!shippingAddressString.trim()) {
      toast.warning('Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã');
      return;
    }
    if (cartItems.length === 0) {
      toast.warning('Giỏ hàng trống');
      return;
    }

    const orderItems = cartItems.map((i) => ({
      variant_id: i.variant?.id ?? i.variant_id,
      quantity:   i.quantity,
      price:      i.price,
    }));

    if (orderItems.some((i) => !i.variant_id)) {
      toast.error('Có sản phẩm trong giỏ hàng bị lỗi, vui lòng tải lại trang');
      return;
    }

    // Gộp số nhà + địa chỉ từ dropdown
    const fullAddress = formData.street
      ? `${formData.street}, ${shippingAddressString}`
      : shippingAddressString;

    try {
      setPlacing(true);
      const res = await orderApi.placeOrder({
        recipient_name:   formData.recipient_name,
        recipient_phone:  formData.recipient_phone,
        shipping_address: fullAddress,
        voucher_id:       voucher?.id || null,
        payment_method:   paymentMethod,
        shipping_fee:     shippingFee,
        total_amount:     total,
        items:            orderItems,
      });

      await fetchCart();
      const orderId = res?.order?.id ?? res?.order?.data?.id ?? res?.id;

      if (paymentMethod === 'vietqr') {
        navigate(`/payment/vietqr/${orderId}`);
      } else {
        toast.success('Đặt hàng thành công!');
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Đặt hàng thất bại, vui lòng thử lại';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPlacing(false);
    }
  };

  const paymentMethods = [
    { value: 'cod',    label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt khi nhận hàng' },
    { value: 'vietqr', label: 'VietQR - Chuyển khoản ngân hàng', icon: '🏦', desc: 'Quét QR bằng app bất kỳ ngân hàng', badge: 'Phổ biến' },
    { value: 'momo',   label: 'Ví MoMo', icon: '💜', desc: 'Thanh toán qua ứng dụng MoMo' },
  ];

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Thanh toán</h1>

        <form onSubmit={handleSubmit(handlePlaceOrder)}>
          <div className="checkout-layout">
            {/* Left: Form */}
            <div className="checkout-form">

              {/* Shipping Info */}
              <div className="checkout-section">
                <h3 className="checkout-section__title">Thông tin giao hàng</h3>
                <div style={{ display: 'grid', gap: 16 }}>

                  {/* Tên người nhận */}
                  <div className="form-group">
                    <label className="form-label">
                      Tên người nhận <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      className={`form-input${errors.recipient_name ? ' form-input--error' : ''}`}
                      placeholder="Nguyễn Văn A"
                      {...register('recipient_name', { required: 'Vui lòng nhập tên người nhận' })}
                    />
                    {errors.recipient_name && (
                      <span className="form-error">{errors.recipient_name.message}</span>
                    )}
                  </div>

                  {/* SĐT */}
                  <div className="form-group">
                    <label className="form-label">
                      Số điện thoại <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      className={`form-input${errors.recipient_phone ? ' form-input--error' : ''}`}
                      placeholder="0909 123 456"
                      type="tel"
                      {...register('recipient_phone', {
                        required: 'Vui lòng nhập số điện thoại',
                        pattern: { value: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ' },
                      })}
                    />
                    {errors.recipient_phone && (
                      <span className="form-error">{errors.recipient_phone.message}</span>
                    )}
                  </div>

                  {/* Tỉnh / Quận / Phường */}
                  <AddressFormFields onAddressChange={setShippingAddressString} />

                  {/* Số nhà / Tên đường */}
                  <div className="form-group">
                    <label className="form-label">Số nhà, tên đường</label>
                    <input
                      className="form-input"
                      placeholder="VD: 123 Nguyễn Huệ"
                      {...register('street')}
                    />
                  </div>

                  {/* Preview địa chỉ đầy đủ */}
                  {shippingAddressString && (
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                      borderLeft: '3px solid var(--color-primary)',
                    }}>
                      <strong>📍 Địa chỉ giao hàng:</strong>{' '}
                      {[streetValue, shippingAddressString].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section">
                <h3 className="checkout-section__title">Phương thức thanh toán</h3>
                <div className="payment-methods">
                  {paymentMethods.map((pm) => (
                    <label
                      key={pm.value}
                      className={`payment-option${paymentMethod === pm.value ? ' selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === pm.value}
                        onChange={() => setPaymentMethod(pm.value)}
                        hidden
                      />
                      <div className="payment-option__radio" />
                      <span className="payment-option__icon">{pm.icon}</span>
                      <div className="payment-option__text">
                        <span className="payment-option__label">
                          {pm.label}
                          {pm.badge && <span className="payment-option__badge">{pm.badge}</span>}
                        </span>
                        {pm.desc && <span className="payment-option__desc">{pm.desc}</span>}
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === 'vietqr' && (
                  <div className="vietqr-info-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: '#0ea5e9' }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>Sau khi đặt hàng, mã QR sẽ hiện lên để bạn quét thanh toán ngay bằng ứng dụng bất kỳ ngân hàng nội địa.</p>
                  </div>
                )}
              </div>

              {/* Voucher */}
              <div className="checkout-section">
                <h3 className="checkout-section__title">Mã giảm giá</h3>
                <div className="voucher-input">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập mã voucher..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading}
                  >
                    {voucherLoading ? '...' : 'Áp dụng'}
                  </button>
                </div>
                {voucher && (
                  <div className="voucher-applied">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ color: 'var(--color-success)', fontSize: 13 }}>
                      Giảm {voucher.discount_type === 'percent'
                        ? `${voucher.discount_value}%`
                        : formatPrice(voucher.discount_value)}
                    </span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 13 }}
                      onClick={() => { setVoucher(null); setVoucherCode(''); setDiscountAmount(0); }}
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="checkout-summary">
              <h3 className="cart-summary__title">Đơn hàng</h3>
              <div className="checkout-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item__img">
                      {item.variant?.product?.image ? (
                        <img src={item.variant.product.image} alt="" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />
                      )}
                    </div>
                    <div className="checkout-item__info">
                      <p className="checkout-item__name">{item.variant?.product?.name}</p>
                      <p className="checkout-item__meta">
                        {item.variant?.capacity?.value}{item.variant?.capacity?.unit} × {item.quantity}
                      </p>
                    </div>
                    <span className="checkout-item__price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0
                      ? <span style={{ color: 'var(--color-success)' }}>Miễn phí</span>
                      : formatPrice(shippingFee)}
                  </span>
                </div>
                {voucher && (
                  <div className="cart-summary__row" style={{ color: 'var(--color-success)' }}>
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="cart-summary__divider" />
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={placing}
              >
                {placing
                  ? 'Đang xử lý...'
                  : paymentMethod === 'vietqr'
                    ? '🏦 Đặt hàng & Lấy mã QR'
                    : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
