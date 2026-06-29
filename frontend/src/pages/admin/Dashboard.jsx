import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div>Đang tải dữ liệu Dashboard...</div>;
  }

  if (!stats) {
    return <div>Không thể tải dữ liệu.</div>;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const translateStatus = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      processing: 'Đang chuẩn bị',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="dashboard-page">
      <h1 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px' }}>Tổng quan hệ thống</h1>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Tổng doanh thu (Hoàn tất)</h3>
          <div className="value">{formatPrice(stats.stats.total_revenue || 0)}</div>
        </div>
        <div className="stat-card">
          <h3>Tổng đơn hàng</h3>
          <div className="value">{stats.stats.total_orders}</div>
        </div>
        <div className="stat-card">
          <h3>Sản phẩm</h3>
          <div className="value">{stats.stats.total_products}</div>
        </div>
        <div className="stat-card">
          <h3>Khách hàng</h3>
          <div className="value">{stats.stats.total_users}</div>
        </div>
      </div>

      <div className="recent-orders">
        <h2>Đơn hàng gần đây</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.user?.name}</td>
                <td>{formatPrice(order.total_amount)}</td>
                <td>
                  <span className={getStatusClass(order.status)}>
                    {translateStatus(order.status)}
                  </span>
                </td>
                <td>
                  <span className={getStatusClass(order.payment_status === 'paid' ? 'delivered' : 'pending')}>
                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
            {stats.recent_orders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
