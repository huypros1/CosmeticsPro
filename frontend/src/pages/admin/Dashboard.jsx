import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Link } from 'react-router-dom';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

const statusMap = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b' },
  processing: { label: 'Đang chuẩn bị', color: '#3b82f6' },
  shipped: { label: 'Đang giao', color: '#8b5cf6' },
  delivered: { label: 'Đã giao', color: '#10b981' },
  cancelled: { label: 'Đã hủy', color: '#ef4444' },
};

// Simple SVG bar chart
const BarChart = ({ data }) => {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.sales), 1);
  const h = 160;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${data.length * 80} ${h + 40}`} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const barH = max > 0 ? (d.sales / max) * h : 0;
          const x = i * 80 + 10;
          const y = h - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={60} height={barH} rx={6}
                fill="url(#barGrad)" opacity={0.9} />
              <text x={x + 30} y={h + 16} textAnchor="middle" fontSize={11} fill="#888">{d.month}</text>
              {d.sales > 0 && (
                <text x={x + 30} y={y - 6} textAnchor="middle" fontSize={10} fill="#C9956A" fontWeight="600">
                  {d.sales >= 1000000 ? `${(d.sales / 1000000).toFixed(1)}M` : `${Math.round(d.sales / 1000)}K`}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9956A" />
            <stop offset="100%" stopColor="#a67652" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color }) => (
  <div style={{
    background: '#fff', borderRadius: 16, padding: '24px', border: '1px solid #f0ebe6',
    display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,.04)',
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14, background: color + '1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0,
    }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{value}</p>
      {trend && <p style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>{trend}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data))
      .catch(err => console.error('Dashboard error', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
      </div>
    );
  }

  if (!stats) return <div style={{ padding: 32, color: 'var(--color-error)' }}>Không thể tải dữ liệu.</div>;

  const { stats: s, recent_orders, monthly_sales } = stats;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Tổng quan hệ thống</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard title="Tổng doanh thu" value={formatPrice(s.total_revenue)} icon="💰" color="#C9956A" trend="Đơn hàng hoàn tất" />
        <StatCard title="Tổng đơn hàng" value={s.total_orders} icon="📦" color="#3b82f6" />
        <StatCard title="Sản phẩm" value={s.total_products} icon="🛍️" color="#8b5cf6" />
        <StatCard title="Khách hàng" value={s.total_users} icon="👥" color="#10b981" />
      </div>

      {/* Revenue Chart */}
      {monthly_sales?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 28, border: '1px solid #f0ebe6', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 600 }}>📈 Doanh thu 6 tháng gần nhất</h2>
          <BarChart data={monthly_sales} />
        </div>
      )}

      {/* Recent Orders */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f0ebe6', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>🕐 Đơn hàng gần đây</h2>
          <Link to="/admin/orders" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>Xem tất cả →</Link>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {(recent_orders || []).map(order => {
              const st = statusMap[order.status] || { label: order.status, color: '#888' };
              return (
                <tr key={order.id}>
                  <td><span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>#{order.id}</span></td>
                  <td>{order.user?.name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(order.total_amount)}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.color + '1a', color: st.color }}>
                      {st.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: order.payment_status === 'paid' ? '#d1fae5' : '#fef3e8', color: order.payment_status === 'paid' ? '#065f46' : '#b45309' }}>
                      {order.payment_status === 'paid' ? '✓ Đã TT' : '⏳ Chờ TT'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(order.created_at)}</td>
                </tr>
              );
            })}
            {(!recent_orders || recent_orders.length === 0) && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chưa có đơn hàng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
