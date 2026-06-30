import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/admin/products',    icon: '🛍️', label: 'Sản phẩm' },
  { to: '/admin/categories',  icon: '📂', label: 'Danh mục' },
  { to: '/admin/orders',      icon: '📦', label: 'Đơn hàng' },
  { to: '/admin/posts',       icon: '📝', label: 'Tin tức' },
  { to: '/admin/reviews',     icon: '⭐', label: 'Đánh giá' },
  { to: '/admin/users',       icon: '👥', label: 'Người dùng' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span style={{ fontSize: 20 }}>✦</span>
          <span>HQCosmetic</span>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="admin-user-name">{user?.name}</p>
              <p className="admin-user-role">Quản trị viên</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Đăng xuất
          </button>
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-header-title">
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Admin'}
          </div>
          <div className="admin-header-right">
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Xin chào, <strong>{user?.name}</strong></span>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
