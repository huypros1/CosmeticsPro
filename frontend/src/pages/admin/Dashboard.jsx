import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const formatDate = (d) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const statusMap = {
  pending:    { label: 'Chờ xử lý',     color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  processing: { label: 'Đang chuẩn bị', color: '#3b82f6', bg: '#dbeafe', dot: '#3b82f6' },
  shipped:    { label: 'Đang giao',      color: '#8b5cf6', bg: '#ede9fe', dot: '#8b5cf6' },
  delivered:  { label: 'Đã giao',        color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
  cancelled:  { label: 'Đã hủy',         color: '#ef4444', bg: '#fee2e2', dot: '#ef4444' },
};

/* ── Stat Card ── */
const StatCard = ({ label, value, icon, iconBg, iconColor, sub, to, trend }) => (
  <Link to={to || '#'} style={{ textDecoration: 'none' }}>
    <div style={{
      background: '#fff', borderRadius: 10, padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb',
      transition: 'box-shadow 0.18s, transform 0.18s', cursor: 'pointer',
    }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{value}</p>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>{sub}</p>}
      </div>
      {trend && <span style={{ fontSize: 12, fontWeight: 600, color: trend > 0 ? '#10b981' : '#ef4444' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
    </div>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res))
      .catch(err => {
        console.error('Dashboard error', err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setError('__AUTH__');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Lỗi không xác định');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 92, borderRadius: 10 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 10 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    if (error === '__AUTH__') {
      return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
          <h2 style={{ margin: '0 0 8px', color: '#111827', fontSize: 20 }}>Phiên đăng nhập đã hết hạn</h2>
          <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>Token của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.</p>
          <a href="/login" style={{ display: 'inline-block', padding: '10px 28px', background: '#6366f1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Đăng nhập lại
          </a>
        </div>
      );
    }
    return (
      <div style={{ padding: 32, background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', color: '#991b1b' }}>
        <strong>Không thể tải dữ liệu Dashboard.</strong>
        {error && <div style={{ marginTop: 8, fontSize: 13, fontFamily: 'monospace', color: '#dc2626' }}>{error}</div>}
        <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>Kiểm tra lại kết nối Laragon / MySQL và thử tải lại trang.</div>
      </div>
    );
  }

  const { stats: s, recent_orders, monthly_sales, orders_by_status } = stats;

  /* ── Chart.js data ── */
  const months = (monthly_sales || []).map(d => d.month);
  const salesData = (monthly_sales || []).map(d => d.sales);

  const lineChartData = {
    labels: months,
    datasets: [{
      label: 'Doanh thu (VND)',
      data: salesData,
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: (ctx) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(99,102,241,0.2)');
        gradient.addColorStop(1, 'rgba(99,102,241,0)');
        return gradient;
      },
      borderWidth: 2.5,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.4,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatPrice(ctx.raw)}`,
        },
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 12 } },
      },
      y: {
        grid: { color: '#f3f4f6', borderDash: [4, 4] },
        ticks: {
          color: '#9ca3af', font: { size: 11 },
          callback: (v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : v,
        },
      },
    },
  };

  // Order count per status — from full DB counts
  const statusCounts = Object.keys(statusMap).map(k => orders_by_status?.[k] || 0);
  const totalStatusCount = statusCounts.reduce((a, b) => a + b, 0);

  const doughnutData = {
    labels: Object.values(statusMap).map(v => v.label),
    datasets: [{
      data: statusCounts,
      backgroundColor: Object.values(statusMap).map(v => v.dot),
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 14,
          font: { size: 12 },
          color: '#4b5563',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'sáng' : hour < 18 ? 'chiều' : 'tối';

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#111827' }}>Tổng quan</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
          Chào buổi {greeting}! Dưới đây là tình hình kinh doanh của bạn.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Doanh thu" to="/admin/orders"
          value={s.total_revenue >= 1000000 ? `${(s.total_revenue / 1000000).toFixed(1)}M` : `${Math.round((s.total_revenue || 0) / 1000)}K`}
          sub="₫ từ đơn đã hoàn tất"
          iconBg="#eef2ff" iconColor="#6366f1"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Đơn hàng" to="/admin/orders"
          value={s.total_orders || 0}
          sub="tổng tất cả trạng thái"
          iconBg="#f0fdf4" iconColor="#16a34a"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        />
        <StatCard
          label="Sản phẩm" to="/admin/products"
          value={s.total_products || 0}
          sub="đang kinh doanh"
          iconBg="#fefce8" iconColor="#ca8a04"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>}
        />
        <StatCard
          label="Khách hàng" to="/admin/users"
          value={s.total_users || 0}
          sub="đã đăng ký tài khoản"
          iconBg="#fdf4ff" iconColor="#9333ea"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Line Chart — Revenue */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Doanh thu theo tháng</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>6 tháng gần nhất</p>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: 20, letterSpacing: '0.04em' }}>DOANH THU</div>
          </div>
          <div style={{ padding: '20px', height: 260 }}>
            {months.length > 0
              ? <Line data={lineChartData} options={lineChartOptions} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>Chưa có dữ liệu</div>
            }
          </div>
        </div>

        {/* Doughnut — Order Status */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Trạng thái đơn</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>Tổng: {totalStatusCount} đơn</p>
            </div>
          </div>
          {/* Chart */}
          <div style={{ padding: '16px 20px 0', height: 200 }}>
            {statusCounts.some(c => c > 0)
              ? <Doughnut data={doughnutData} options={{ ...doughnutOptions, plugins: { ...doughnutOptions.plugins, legend: { display: false } } }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>Chưa có dữ liệu</div>
            }
          </div>
          {/* Status breakdown list */}
          <div style={{ padding: '12px 20px 16px' }}>
            {Object.entries(statusMap).map(([key, val], i) => {
              const count = orders_by_status?.[key] || 0;
              const pct = totalStatusCount > 0 ? Math.round((count / totalStatusCount) * 100) : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < Object.keys(statusMap).length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151' }}>{val.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{pct}%</span>
                    <span style={{ fontSize: 12, fontWeight: 700, background: val.bg, color: val.color, padding: '1px 8px', borderRadius: 12, minWidth: 28, textAlign: 'center' }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Đơn hàng gần đây</h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{recent_orders?.length || 0} đơn mới nhất</p>
          </div>
          <Link to="/admin/orders" style={{ fontSize: 12, color: '#6366f1', textDecoration: 'none', fontWeight: 600, padding: '6px 14px', background: '#eef2ff', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
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
              const st = statusMap[order.status] || { label: order.status, color: '#6b7280', bg: '#f3f4f6', dot: '#6b7280' };
              return (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'monospace', fontSize: 13 }}>#{order.id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                        {(order.user?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, color: '#111827', fontSize: 13 }}>{order.user?.name || '—'}</span>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{formatPrice(order.total_amount)}</span></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                      {st.label}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: order.payment_status === 'paid' ? '#d1fae5' : '#fef3c7',
                      color: order.payment_status === 'paid' ? '#065f46' : '#92400e',
                    }}>
                      {order.payment_status === 'paid' ? '✓ Đã TT' : '⏳ Chờ TT'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: 13 }}>{formatDate(order.created_at)}</td>
                </tr>
              );
            })}
            {(!recent_orders || recent_orders.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
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
