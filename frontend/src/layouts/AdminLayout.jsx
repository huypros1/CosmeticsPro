import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin/dashboard',  icon: 'bi-speedometer2',      label: 'Dashboard'    },
  { to: '/admin/products',   icon: 'bi-box-seam',          label: 'Sản phẩm'     },
  { to: '/admin/categories', icon: 'bi-folder2-open',      label: 'Danh mục'     },
  { to: '/admin/brands',     icon: 'bi-patch-check',       label: 'Thương hiệu'  },
  { to: '/admin/orders',     icon: 'bi-cart-check',        label: 'Đơn hàng'     },
  { to: '/admin/vouchers',   icon: 'bi-ticket-perforated', label: 'Mã giảm giá'  },
  { to: '/admin/flash-sales',icon: 'bi-lightning-charge',  label: 'Flash Sale'   },
  { to: '/admin/posts',      icon: 'bi-newspaper',         label: 'Tin tức'      },
  { to: '/admin/reviews',    icon: 'bi-star-half',         label: 'Đánh giá'     },
  { to: '/admin/users',      icon: 'bi-people',            label: 'Người dùng'   },
  { to: '/admin/read-log',   icon: 'bi-terminal',          label: 'Read Log'     },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPage = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Admin';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-logo">
          <div>
            <span className="admin-logo-text">HQCosmetic</span>
            <span className="admin-logo-sub">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <div className="admin-nav-group-label">Quản lý</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <p className="admin-user-name">{user?.name}</p>
              <p className="admin-user-role">Quản trị viên</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Đăng xuất">
            <span style={{ fontSize: 13, fontWeight: 500 }}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-header-title">
            <span className="admin-header-breadcrumb">Admin /</span>&nbsp;{currentPage}
          </div>
          <div className="admin-header-right">
            <span className="admin-header-badge">Xin chào, <strong>{user?.name}</strong></span>
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
