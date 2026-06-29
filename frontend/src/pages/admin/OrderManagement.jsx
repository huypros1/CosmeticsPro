import { useState, useEffect } from 'react';
import axios from 'axios';
import { paymentApi } from '../../api/paymentApi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/admin/orders/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  if (loading) return <div>Đang tải danh sách đơn hàng...</div>;

  return (
    <div className="management-page">
      <h1 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px' }}>Quản lý Đơn hàng</h1>

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
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="processing">Đang chuẩn bị</option>
                    <option value="shipped">Đang giao</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td>
                  {/* Chỉ hiện nút xác nhận khi là VietQR và chưa thanh toán */}
                  {order.payment_method === 'vietqr' && order.payment_status !== 'paid' ? (
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
                      {confirmingId === order.id ? '...' : '✅ Xác nhận đã nhận TT'}
                    </button>
                  ) : order.payment_status === 'paid' ? (
                    <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Đã xác nhận</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>COD</span>
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
