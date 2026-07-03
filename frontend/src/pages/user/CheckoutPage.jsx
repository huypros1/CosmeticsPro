import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { orderApi } from '../../api/orderApi';
import { profileApi } from '../../api/profileApi';
import { voucherApi } from '../../api/voucherApi';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import AddressFormFields from '../../components/AddressFormFields';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const CheckoutPage = () => {
  const { cartItems, fetchCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [checkoutAddressLine, setCheckoutAddressLine] = useState('');

  const { register: regAddr, handleSubmit: handleAddr, reset: resetAddr } = useForm();

  useEffect(() => {
    profileApi.getAddresses()
      .then((d) => {
        const list = d.data || d || [];
        setAddresses(list);
        const def = list.find((a) => a.status) || list[0];
        if (def) setSelectedAddress(def);
      })
      .catch(() => {});
  }, []);

  const subtotal = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const discount = voucher
    ? voucher.discount_type === 'percentage'
      ? Math.min(subtotal * voucher.discount_value / 100, subtotal)
      : Math.min(voucher.discount_value, subtotal)
    : 0;
  const total = subtotal + shippingFee - discount;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setVoucherLoading(true);
      const res = await voucherApi.validateVoucher(voucherCode.trim(), subtotal);
      setVoucher(res.voucher || res);
      toast.success('Áp dụng voucher thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Voucher không hợp lệ');
      setVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleAddAddress = async (data) => {
    if (!checkoutAddressLine.trim()) {
      toast.warning('Vui lòng chọn đầy đủ địa chỉ');
      return;
    }
    try {
      const res = await profileApi.addAddress({
        address_line: checkoutAddressLine,
        phone: data.phone,
      });
      const newAddr = res.address || res;
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddress(newAddr);
      setShowAddAddress(false);
      setCheckoutAddressLine('');
      resetAddr();
      toast.success('Đã thêm địa chỉ');
    } catch {
      toast.error('Không thể thêm địa chỉ');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.warning('Vui lòng chọn địa chỉ giao hàng'); return; }
    if (cartItems.length === 0) { toast.warning('Giỏ hàng trống'); return; }

    const orderItems = cartItems.map((i) => ({
      variant_id: i.variant?.id ?? i.variant_id,
      quantity: i.quantity,
      price: i.price,
    }));

    if (orderItems.some((i) => !i.variant_id)) {
      toast.error('Có sản phẩm trong giỏ hàng bị lỗi, vui lòng tải lại trang');
      return;
    }

    try {
      setPlacing(true);
      const res = await orderApi.placeOrder({
        shipping_address_id: selectedAddress.id,
        voucher_id: voucher?.id || null,
        payment_method: paymentMethod,
        shipping_fee: shippingFee,
        total_amount: total,
        items: orderItems,
      });
      await fetchCart();

      // axiosClient unwraps response.data already.
      // OrderController returns: { message, order: OrderResource } → OrderResource = { id, status, ... }
      const orderId = res?.order?.id ?? res?.order?.data?.id ?? res?.id;
      console.log('[Checkout] placeOrder res:', res, '→ orderId:', orderId);

      // Nếu chọn VietQR → redirect sang trang thanh toán riêng
      if (paymentMethod === 'vietqr') {
        navigate(`/payment/vietqr/${orderId}`);
      } else {
        toast.success('Đặt hàng thành công!');
        navigate(`/orders/${orderId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors
        || 'Đặt hàng thất bại, vui lòng thử lại';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPlacing(false);
    }
  };


  const paymentMethods = [
    { value: 'cod',     label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt khi nhận hàng' },
    { value: 'vietqr',  label: 'VietQR - Chuyển khoản ngân hàng', icon: '🏦', desc: 'Quét QR bằng app bất kỳ ngân hàng', badge: 'Phổ biến' },
    { value: 'momo',    label: 'Ví MoMo', icon: '💜', desc: 'Thanh toán qua ứng dụng MoMo' },
  ];


  return (
    <div className="checkout-page">
        <div className="container">
          <h1 className="page-title" style={{ marginBottom: 32 }}>Thanh toán</h1>

          <div className="checkout-layout">
            {/* Left: Form */}
            <div className="checkout-form">
              {/* Shipping Address */}
              <div className="checkout-section">
                <h3 className="checkout-section__title">Địa chỉ giao hàng</h3>
                <div className="address-list">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-option${selectedAddress?.id === addr.id ? ' selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === addr.id}
                        onChange={() => setSelectedAddress(addr)}
                        hidden
                      />
                      <div className="address-option__radio" />
                      <div className="address-option__content">
                        <div className="address-option__line">{addr.address_line}</div>
                        <div className="address-option__phone">{addr.phone}</div>
                        {addr.status && <span className="badge badge-accent">Mặc định</span>}
                      </div>
                    </label>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    style={{ width: 'fit-content' }}
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>

                {showAddAddress && (
                  <form className="add-address-form" onSubmit={handleAddr(handleAddAddress)}>
                    <AddressFormFields onAddressChange={setCheckoutAddressLine} />
                    <div className="form-group">
                      <label className="form-label">Số điện thoại <span style={{ color: 'var(--color-error)' }}>*</span></label>
                      <input
                        className="form-input"
                        placeholder="0909 123 456"
                        type="tel"
                        {...regAddr('phone', { required: true })}
                      />
                    </div>
                    {checkoutAddressLine && (
                      <div style={{ padding: '10px 14px', background: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <strong>Địa chỉ:</strong> {checkoutAddressLine}
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-sm">Lưu địa chỉ</button>
                  </form>
                )}
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

                {/* VietQR info box khi được chọn */}
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
                      Giảm {voucher.discount_type === 'percentage'
                        ? `${voucher.discount_value}%`
                        : formatPrice(voucher.discount_value)}
                    </span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: 13 }}
                      onClick={() => { setVoucher(null); setVoucherCode(''); }}>
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
                      ) : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />}
                    </div>
                    <div className="checkout-item__info">
                      <p className="checkout-item__name">{item.variant?.product?.name}</p>
                      <p className="checkout-item__meta">{item.variant?.capacity?.value}{item.variant?.capacity?.unit} × {item.quantity}</p>
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
                  <span>{shippingFee === 0 ? <span style={{ color: 'var(--color-success)' }}>Miễn phí</span> : formatPrice(shippingFee)}</span>
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
                className="btn btn-primary btn-full btn-lg"
                onClick={handlePlaceOrder}
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
        </div>
      </div>  );
};

export default CheckoutPage;
