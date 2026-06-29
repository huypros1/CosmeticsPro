import { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error('Error updating order status', error);
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
                    {order.payment_status === 'paid' ? 'Đã TT' : 'Chưa TT'}
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
                    <option value="processing">Đang chuẩn bị</option>
                    <option value="shipped">Đang giao</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Chưa có đơn hàng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
