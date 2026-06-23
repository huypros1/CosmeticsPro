import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../context/ToastContext';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

const statusMap = {
  pending:    { label: 'Chờ xác nhận',   class: 'badge-gray',    step: 0 },
  processing: { label: 'Đang xử lý',     class: 'badge-warning', step: 1 },
  shipped:    { label: 'Đang vận chuyển',class: 'badge-accent',  step: 2 },
  delivered:  { label: 'Đã giao',         class: 'badge-success', step: 3 },
  cancelled:  { label: 'Đã hủy',          class: 'badge-error',   step: -1 },
};

const steps = ['Đặt hàng', 'Xác nhận', 'Vận chuyển', 'Đã giao'];

const OrderDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderApi.getOrderById(id)
      .then((d) => {
        // Backend: JsonResource => { data: {...} }
        setOrder(d.data || d);
      })
      .catch(() => toast.error('Không tìm thấy đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    try {
      setCancelling(true);
      await orderApi.cancelOrder(id);
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
      toast.success('Đã hủy đơn hàng');
    } catch {
      toast.error('Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '60px 24px' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 8 }} />
    </div>
  );

  if (!order) return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <div className="empty-state__icon">😢</div>
      <p className="empty-state__title">Không tìm thấy đơn hàng</p>
      <Link to="/orders" className="btn btn-outline btn-sm">Quay lại</Link>
    </div>
  );

  const st = statusMap[order.status] || { label: order.status, class: 'badge-gray', step: 0 };
  const currentStep = st.step;

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="order-detail-header">
          <div>
            <Link to="/orders" className="back-link">← Đơn hàng của tôi</Link>
            <h1 className="page-title">Đơn hàng #{order.id}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
              Đặt ngày {formatDate(order.created_at)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${st.class}`} style={{ padding: '6px 14px', fontSize: 13 }}>{st.label}</span>
            {['pending', 'processing'].includes(order.status) && (
              <button className="btn btn-outline btn-sm" onClick={handleCancel} disabled={cancelling}
                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {order.status !== 'cancelled' && (
          <div className="order-progress">
            {steps.map((step, idx) => (
              <div key={step} className={`order-progress__step${idx <= currentStep ? ' done' : ''}${idx === currentStep ? ' current' : ''}`}>
                <div className="order-progress__dot">{idx < currentStep ? '✓' : idx + 1}</div>
                <span className="order-progress__label">{step}</span>
                {idx < steps.length - 1 && <div className={`order-progress__line${idx < currentStep ? ' done' : ''}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="order-detail-layout">
          {/* Items */}
          <div>
            <div className="order-detail-section">
              <h3 className="order-detail-section__title">Sản phẩm đã đặt</h3>
              <div className="order-detail-items">
                {(order.order_items || []).map((item) => (
                  <div key={item.id} className="order-detail-item">
                    <div className="order-card__item-img">
                      {item.variant?.product?.image
                        ? <img src={item.variant.product.image} alt="" />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/products/${item.variant?.product?.slug}`} className="order-detail-item__name">
                        {item.variant?.product?.name}
                      </Link>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3 }}>
                        {item.variant?.capacity?.value}{item.variant?.capacity?.unit} × {item.quantity}
                      </p>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div className="order-detail-section">
              <h3 className="order-detail-section__title">Địa chỉ giao hàng</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                {order.shipping_address?.address_line}
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {order.shipping_address?.phone}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="order-detail-summary">
            <h3 className="cart-summary__title">Chi tiết thanh toán</h3>
            <div className="cart-summary__rows">
              <div className="cart-summary__row">
                <span>Phương thức</span>
                <span style={{ textTransform: 'uppercase', fontSize: 13, fontWeight: 600 }}>
                  {order.payment_method}
                </span>
              </div>
              <div className="cart-summary__row">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(order.shipping_fee || 0)}</span>
              </div>
              {order.voucher && (
                <div className="cart-summary__row" style={{ color: 'var(--color-success)' }}>
                  <span>Voucher</span>
                  <span>-</span>
                </div>
              )}
              <div className="cart-summary__divider" />
              <div className="cart-summary__row cart-summary__row--total">
                <span>Tổng cộng</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Trạng thái TT</span>
                <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-error'}`}>
                  {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
