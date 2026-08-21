import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { orderApi } from '../../api/orderApi';
import { voucherApi } from '../../api/voucherApi';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AddressFormFields from '../../components/AddressFormFields';
import axiosClient from '../../api/axiosClient';
import { ghnApi } from '../../api/ghnApi';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const CheckoutPage = () => {
  const { cartItems, fetchCart } = useCart();
  const location = useLocation();
  const checkoutItemsToUse = location.state?.items || cartItems;
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const sePayFormRef = useRef(null);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddressString, setShippingAddressString] = useState('');
  const [sePayFormData, setSePayFormData] = useState(null);
  
  // GHN Shipping Fee
  const [ghnShippingFee, setGhnShippingFee] = useState(null);
  const [fetchingFee, setFetchingFee] = useState(false);

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

  /* ── Tính tiền & Khối lượng ── */
  const subtotal    = checkoutItemsToUse.reduce((s, item) => s + item.price * item.quantity, 0);
  
  // Tính tổng khối lượng dựa vào dung tích (ml/g) của biến thể.
  // Giả sử 1ml tương đương 1g. Thêm 200g trọng lượng vỏ hộp bao bì.
  const totalWeight = checkoutItemsToUse.reduce((sum, item) => {
    const val = Number(item.variant?.capacity?.value) || 0;
    return sum + (val * item.quantity);
  }, 0);
  const calculatedWeight = totalWeight > 0 ? totalWeight + 200 : 1000; // Mặc định 1kg nếu không có thông số

  const calculatedShipping = ghnShippingFee !== null ? ghnShippingFee : 30000;
  const shippingFee = subtotal > 500000 ? 0 : calculatedShipping;
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

  /* ── Lấy phí ship GHN ── */
  const handleLocationSelect = async (loc) => {
    if (!loc) {
      setGhnShippingFee(null);
      return;
    }
    try {
      setFetchingFee(true);
      // 1. Lấy dịch vụ khả dụng
      const services = await ghnApi.getAvailableServices(loc.district_id);
      const serviceId = services.data?.[0]?.service_id;
      if (!serviceId) {
        toast.warning('Không tìm thấy gói vận chuyển cho khu vực này.');
        return;
      }
      // 2. Tính phí
      const feeRes = await ghnApi.calculateFee({
        service_id: serviceId,
        insurance_value: Math.min(subtotal, 5000000), // GHN max bảo hiểm thường 5tr
        to_district_id: loc.district_id,
        to_ward_code: loc.ward_code,
        weight: calculatedWeight
      });
      setGhnShippingFee(feeRes.data?.total || 30000);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tính phí vận chuyển GHN. Dùng mức phí mặc định.');
      setGhnShippingFee(30000);
    } finally {
      setFetchingFee(false);
    }
  };

  /* ── Đặt hàng ── */
  const handlePlaceOrder = async (formData) => {
    if (!shippingAddressString.trim()) {
      toast.warning('Vui lòng chọn đầy đủ tỉnh/thành, quận/huyện, phường/xã');
      return;
    }
    if (checkoutItemsToUse.length === 0) {
      toast.warning('Giỏ hàng trống');
      return;
    }

    const orderItems = checkoutItemsToUse.map((i) => ({
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

      if (paymentMethod === 'sepay') {
        // Gọi backend để lấy form fields đã ký HMAC
        const baseUrl = window.location.origin;
        const checkoutRes = await axiosClient.post('/payment/sepay/create-checkout', {
          order_id:    orderId,
          amount:      total,
          success_url: `${baseUrl}/payment/success?order_id=${orderId}`,
          error_url:   `${baseUrl}/payment/error?order_id=${orderId}`,
          cancel_url:  `${baseUrl}/payment/cancel?order_id=${orderId}`,
        });
        setSePayFormData({
          checkoutURL: checkoutRes.checkout_url,
          fields:      checkoutRes.fields,
        });
        setTimeout(() => sePayFormRef.current?.submit(), 100);
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
    { value: 'cod',   label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt khi nhận hàng' },
    { value: 'sepay', label: 'SePay - Chuyển khoản ngân hàng', icon: '🏦', desc: 'Thanh toán qua cổng SePay (ATM/QR/Internet Banking)', badge: 'Phổ biến' },
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

                  {/* Tỉnh / Phường — API GHN (3 cấp) */}
                  <AddressFormFields 
                    onAddressChange={setShippingAddressString} 
                    onLocationSelect={handleLocationSelect}
                  />

                  {/* Số nhà / Tên đường (chi tiết hơn) */}
                  <div className="form-group">
                    <label className="form-label">
                      Số nhà, tên đường <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(tùy chọn)</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="VD: 123 Nguyễn Huệ, Tầng 2"
                      {...register('street')}
                    />
                  </div>
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

                {paymentMethod === 'sepay' && (
                  <div className="vietqr-info-box">
                    <i className="bi bi-info-circle-fill" style={{ flexShrink: 0, color: '#0ea5e9', fontSize: 16 }} />
                    <p>Sau khi đặt hàng, bạn sẽ được chuyển sang trang SePay để thanh toán an toàn qua chuyển khoản ngân hàng / QR.</p>
                  </div>
                )}
              </div>

              {/* Voucher */}
              <div className="checkout-section">
                <h3 className="checkout-section__title">Mã giảm giá</h3>

                {/* Input row */}
                <div className="voucher-input">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập mã voucher (VD: SUMMER30)"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase());
                      // Xoá voucher cũ khi user sửa mã
                      if (voucher) { setVoucher(null); setDiscountAmount(0); }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyVoucher())}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}
                    disabled={!!voucher}
                  />
                  {voucher ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => { setVoucher(null); setVoucherCode(''); setDiscountAmount(0); }}
                      style={{ whiteSpace: 'nowrap', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                    >
                      Xóa
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {voucherLoading
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'currentColor', width: 13, height: 13 }}/>
                            Đang kiểm tra...
                          </span>
                        : 'Áp dụng'}
                    </button>
                  )}
                </div>

                {/* Applied success */}
                {voucher && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', marginTop: 10,
                    background: 'var(--color-success-bg)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-check-circle-fill" style={{ fontSize: 14, color: 'var(--color-success)', flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-success)' }}>
                          {voucher.code}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-success)', opacity: 0.8, marginLeft: 8 }}>
                          — Tiết kiệm {formatPrice(discountAmount)}
                        </span>
                        {voucher.description && (
                          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {voucher.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="checkout-summary">
              <h3 className="cart-summary__title">Đơn hàng</h3>
              <div className="checkout-items">
                {checkoutItemsToUse.map((item) => (
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
                    {fetchingFee ? (
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Đang tính...</span>
                    ) : shippingFee === 0 ? (
                      <span style={{ color: 'var(--color-success)' }}>Miễn phí</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
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
                disabled={placing || fetchingFee}
              >
                {placing
                  ? 'Đang xử lý...'
                  : paymentMethod === 'sepay'
                    ? '🏦 Đặt hàng & Thanh toán SePay'
                    : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </form>

        {/* Hidden SePay auto-submit form */}
        {sePayFormData && (
          <form
            ref={sePayFormRef}
            action={sePayFormData.checkoutURL}
            method="POST"
            style={{ display: 'none' }}
          >
            {Object.keys(sePayFormData.fields).map((field) => (
              <input key={field} type="hidden" name={field} value={sePayFormData.fields[field]} />
            ))}
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
