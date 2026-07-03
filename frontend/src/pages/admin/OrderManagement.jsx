import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { paymentApi } from '../../api/paymentApi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({ search, status: statusFilter, payment_status: paymentStatusFilter });
      console.log('[Orders] res:', res, 'res.data:', res?.data);
      const list = Array.isArray(res) ? res : (res?.data || []);
      console.log('[Orders] list length:', list.length);
      setOrders(list);
    } catch (err) {
      console.error('[Orders] Error:', err?.response?.status, err?.message, err?.response?.data);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, paymentStatusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateOrderStatus(id, { status: newStatus });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status', error);
    }
  };

  // ✅ Xác nhận đã nhận thanh toán VietQR
  const confirmPayment = async (id) => {
    if (!window.confirm(`Xác nhận đơn hàng #${id} đã nhận được thanh toán?`)) return;
    try {
      setConfirmingId(id);
      await paymentApi.adminConfirmPayment(id);
      fetchOrders();
      alert(`✅ Đã xác nhận thanh toán cho đơn hàng #${id}`);
    } catch (error) {
      console.error('Error confirming payment', error);
      alert('Có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setConfirmingId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const isStatusDisabled = (currentStatus, optionStatus) => {
    // Cannot change from cancelled to anything else
    if (currentStatus === 'cancelled' && optionStatus !== 'cancelled') return true;
    
    // Cannot cancel if already shipped or delivered
    if (optionStatus === 'cancelled' && (currentStatus === 'shipped' || currentStatus === 'delivered')) return true;

    // Prevent moving backward
    const statusOrder = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: 5 };
    
    // If not cancelling, prevent backward transition
    if (optionStatus !== 'cancelled' && currentStatus !== 'cancelled') {
       if (statusOrder[optionStatus] < statusOrder[currentStatus]) return true;
    }

    return false;
  };

  if (loading) return <div>Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Đơn hàng</h1>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm mã đơn, tên KH, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '300px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '200px' }}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="processing">Đang chuẩn bị</option>
          <option value="shipped">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '220px' }}
        >
          <option value="">Tất cả Thanh toán</option>
          <option value="pending">Chờ thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="failed">Thất bại</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Ngày đặt</th>
              <th>Trạng thái</th>
              <th>Xác nhận TT</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.user?.name}</td>
                <td>{formatPrice(order.total_amount)}</td>
                <td>
                  <span className={order.payment_status === 'paid' ? 'status-badge status-delivered' : 'status-badge status-pending'}>
                    {order.payment_status === 'paid' ? '✅ Đã TT' : '⏳ Chưa TT'}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: order.status === 'cancelled' ? '#f3f4f6' : '#fff' }}
                    disabled={order.status === 'cancelled'}
                  >
                    <option value="pending" disabled={isStatusDisabled(order.status, 'pending')}>Chờ xử lý</option>
                    <option value="confirmed" disabled={isStatusDisabled(order.status, 'confirmed')}>Đã xác nhận</option>
                    <option value="processing" disabled={isStatusDisabled(order.status, 'processing')}>Đang chuẩn bị</option>
                    <option value="shipped" disabled={isStatusDisabled(order.status, 'shipped')}>Đang giao</option>
                    <option value="delivered" disabled={isStatusDisabled(order.status, 'delivered')}>Đã giao</option>
                    <option value="cancelled" disabled={isStatusDisabled(order.status, 'cancelled')}>Đã hủy</option>
                  </select>
                </td>
                <td>
                  {/* Hiện nút xác nhận thanh toán cho cả COD và VietQR, trừ khi đơn bị hủy */}
                  {order.payment_status !== 'paid' && order.status !== 'cancelled' ? (
                    <button
                      onClick={() => confirmPayment(order.id)}
                      disabled={confirmingId === order.id}
                      style={{
                        padding: '6px 12px',
                        background: confirmingId === order.id ? '#94a3b8' : '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: confirmingId === order.id ? 'wait' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {confirmingId === order.id ? '...' : `✅ Nhận TT (${order.payment_method === 'vietqr' ? 'QR' : 'COD'})`}
                    </button>
                  ) : order.payment_status === 'paid' ? (
                    <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Đã thanh toán</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Đã hủy</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Chưa có đơn hàng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
