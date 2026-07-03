import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { reviewApi } from '../../api/reviewApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

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

// ─── Review Item Component ────────────────────────────────────────────────────
const ReviewItemForm = ({ product, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(product.reviewed);
  const [hoverRating, setHoverRating] = useState(0);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.warning('Vui lòng nhập nội dung đánh giá');
      return;
    }
    try {
      setSubmitting(true);
      await reviewApi.submitReview({
        product_id: product.product_id,
        rating,
        content,
      });
      setSubmitted(true);
      toast.success(`Đã đánh giá "${product.product_name}"`);
      if (onReviewSubmitted) onReviewSubmitted(product.product_id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi đánh giá';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-order-item">
      <div className="review-order-item__product">
        <div className="review-order-item__img">
          {product.product_image
            ? <img src={product.product_image} alt={product.product_name} />
            : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)', borderRadius: 8 }} />
          }
        </div>
        <div className="review-order-item__info">
          <p className="review-order-item__name">{product.product_name}</p>
          <p className="review-order-item__variant">
            {product.variant_info && <span>{product.variant_info}</span>}
            {product.quantity && <span> × {product.quantity}</span>}
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="review-order-item__done">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Đã đánh giá</span>
        </div>
      ) : (
        <form className="review-order-item__form" onSubmit={handleSubmit}>
          <div className="review-order-item__stars">
            <span className="review-order-item__stars-label">Đánh giá:</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  style={{
                    fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: s <= (hoverRating || rating) ? '#C9956A' : '#D5D0C8',
                    transition: 'color 0.15s, transform 0.15s',
                    transform: s <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)',
                  }}
                >★</button>
              ))}
            </div>
          </div>
          <div className="review-order-item__input-row">
            <input
              type="text"
              className="form-input"
              placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? '...' : 'Gửi'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ─── Main OrderDetailPage ─────────────────────────────────────────────────────
const OrderDetailPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Review states
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    orderApi.getOrderById(id)
      .then((d) => {
        setOrder(d.data || d);
      })
      .catch(() => toast.error('Không tìm thấy đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load reviewable products when order is delivered
  useEffect(() => {
    if (order?.status === 'delivered' && user) {
      setReviewLoading(true);
      reviewApi.getReviewableProducts(id)
        .then((d) => {
          setCanReview(d.can_review || false);
          setReviewableProducts(d.products || []);
        })
        .catch(() => {})
        .finally(() => setReviewLoading(false));
    }
  }, [order?.status, id, user]);

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

  const handleReviewSubmitted = (productId) => {
    setReviewableProducts((prev) =>
      prev.map((p) => p.product_id === productId ? { ...p, reviewed: true } : p)
    );
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
  const allReviewed = reviewableProducts.length > 0 && reviewableProducts.every((p) => p.reviewed);

  return (
    <div className="order-detail-page" style={{ padding: '40px 0', backgroundColor: '#fafafa', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/orders" className="back-link" style={{ display: 'inline-block', marginBottom: 16 }}>← Quay lại danh sách đơn hàng</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 className="page-title" style={{ margin: 0, fontSize: 24 }}>Chi tiết đơn hàng #{order.id}</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 6 }}>
                Đặt ngày: {formatDate(order.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className={`badge ${st.class}`} style={{ padding: '8px 16px', fontSize: 14, borderRadius: 20 }}>
                {st.label}
              </span>
              {['pending', 'processing'].includes(order.status) && (
                <button className="btn btn-outline" onClick={handleCancel} disabled={cancelling}
                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', padding: '6px 16px', fontSize: 14 }}>
                  {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        {order.status !== 'cancelled' && (
          <div style={{ background: '#fff', padding: '32px 40px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: 24 }}>
            <div className="order-progress">
              {steps.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step} className={`order-progress__step${isDone ? ' done' : ''}${isCurrent ? ' current' : ''}`} style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
                    <div className="order-progress__dot" style={{ 
                      width: 40, height: 40, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'var(--color-accent)' : '#eee',
                      color: isDone ? '#fff' : '#999',
                      fontWeight: 600, fontSize: 16, zIndex: 2, position: 'relative',
                      border: isCurrent ? '4px solid #FDF8F5' : '4px solid #fff'
                    }}>
                      {idx < currentStep ? '✓' : idx + 1}
                    </div>
                    <span className="order-progress__label" style={{ display: 'block', marginTop: 12, fontSize: 14, fontWeight: isCurrent ? 600 : 500, color: isDone ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {step}
                    </span>
                    {idx < steps.length - 1 && (
                      <div className="order-progress__line" style={{
                        position: 'absolute', top: 20, left: '50%', width: '100%', height: 3,
                        background: idx < currentStep ? 'var(--color-accent)' : '#eee', zIndex: 1
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Main Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Products Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, borderBottom: '1px solid #eee', paddingBottom: 16 }}>Sản phẩm đã đặt</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(order.items || order.order_items || []).map((item) => (
                  <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', flexShrink: 0 }}>
                      {item.variant?.product?.image
                        ? <img src={item.variant.product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/products/${item.variant?.product?.slug}`} style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                        {item.variant?.product?.name}
                      </Link>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                        Phân loại: {item.variant?.capacity?.value}{item.variant?.capacity?.unit} 
                      </p>
                      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                        Số lượng: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-accent)' }}>{formatPrice(item.price * item.quantity)}</span>
                      {item.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>({formatPrice(item.price)} / sp)</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Section */}
            {order.status === 'delivered' && (
              <div style={{ background: 'linear-gradient(135deg, #FFF9F5 0%, #FFFFFF 100%)', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F0D5C1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#A06B43', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Đánh giá sản phẩm
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>Hãy chia sẻ cảm nhận của bạn về sản phẩm nhé!</p>
                  </div>
                  {allReviewed && <span className="badge badge-success">✓ Đã hoàn tất</span>}
                </div>

                {reviewLoading ? (
                  <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
                ) : canReview && reviewableProducts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {reviewableProducts.map((product) => (
                      <ReviewItemForm key={product.product_id} product={product} onReviewSubmitted={handleReviewSubmitted} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)' }}>Bạn đã đánh giá tất cả sản phẩm.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Address & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Delivery Address Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Địa chỉ nhận hàng
              </h3>
              {order.shipping_address ? (
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px', fontSize: 15 }}>
                    {order.shipping_address.user_name || order.user?.name || user?.name || 'Khách hàng'}
                  </p>
                  <p style={{ margin: '0 0 4px' }}>Số điện thoại: <strong>{order.shipping_address.phone}</strong></p>
                  <p style={{ margin: 0 }}>
                    {order.shipping_address.address_line}<br />
                    {order.shipping_address.ward_name}, {order.shipping_address.district_name}, {order.shipping_address.province_name}
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Không có thông tin địa chỉ</p>
              )}
            </div>

            {/* Payment Summary Card */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Thanh toán</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Phương thức:</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 500 }}>{order.payment_method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Tiền hàng:</span>
                  <span>{formatPrice(order.total_amount - (order.shipping_fee || 0))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Phí vận chuyển:</span>
                  <span>{formatPrice(order.shipping_fee || 0)}</span>
                </div>
                <div style={{ borderTop: '1px dashed #eee', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Tổng cộng:</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-accent)' }}>{formatPrice(order.total_amount)}</span>
                </div>
                
                <div style={{ marginTop: 8, padding: '12px 0 0', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Trạng thái:</span>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 12 }}>
                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailPage;
