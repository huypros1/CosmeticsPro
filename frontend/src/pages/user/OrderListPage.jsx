import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../context/ToastContext';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));

const statusMap = {
  pending:    { label: 'Chờ xác nhận', class: 'badge-gray' },
  processing: { label: 'Đang xử lý',   class: 'badge-warning' },
  shipped:    { label: 'Đang vận chuyển', class: 'badge-accent' },
  delivered:  { label: 'Đã giao',      class: 'badge-success' },
  cancelled:  { label: 'Đã hủy',       class: 'badge-error' },
};

const paymentMap = {
  unpaid:   { label: 'Chưa thanh toán', class: 'badge-error' },
  paid:     { label: 'Đã thanh toán',   class: 'badge-success' },
  refunded: { label: 'Đã hoàn tiền',    class: 'badge-gray' },
};

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    orderApi.getOrders()
      .then((d) => {
        // Backend: ResourceCollection => { data: [...] }
        setOrders(d.data || d || []);
      })
      .catch(() => toast.error('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 8, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Đơn hàng của tôi</h1>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📦</div>
            <p className="empty-state__title">Chưa có đơn hàng nào</p>
            <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const st = statusMap[order.status] || { label: order.status, class: 'badge-gray' };
              const pm = paymentMap[order.payment_status] || { label: order.payment_status, class: 'badge-gray' };
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card__header">
                    <div className="order-card__meta">
                      <span className="order-card__id">Đơn #{order.id}</span>
                      <span className="order-card__date">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="order-card__badges">
                      <span className={`badge ${st.class}`}>{st.label}</span>
                      <span className={`badge ${pm.class}`}>{pm.label}</span>
                    </div>
                  </div>
                  <div className="order-card__items">
                    {(order.items || order.order_items || []).slice(0, 3).map((item) => (
                      <div key={item.id} className="order-card__item">
                        <div className="order-card__item-img">
                          {item.variant?.product?.image
                            ? <img src={item.variant.product.image} alt="" />
                            : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />
                          }
                        </div>
                        <div>
                          <p className="order-card__item-name">{item.variant?.product?.name}</p>
                          <p className="order-card__item-meta">× {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {((order.items || order.order_items)?.length || 0) > 3 && (
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 0' }}>
                        +{(order.items || order.order_items).length - 3} sản phẩm khác
                      </span>
                    )}
                  </div>
                  <div className="order-card__footer">
                    <div>
                      <span className="order-card__total-label">Tổng cộng</span>
                      <span className="order-card__total">{formatPrice(order.total_amount)}</span>
                    </div>
                    <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
