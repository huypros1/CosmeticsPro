import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
          <Link to="/admin">CosmeticsPro Admin</Link>
        </div>
        <nav>
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/products">Sản phẩm</Link>
          <Link to="/admin/categories">Danh mục</Link>
          <Link to="/admin/orders">Đơn hàng</Link>
          <Link to="/admin/users">Người dùng</Link>
        </nav>
      </aside>
      <div className="admin-content">
        <header className="admin-header">
          <span>Xin chào, {user?.name}</span>
          <button onClick={handleLogout}>Đăng xuất</button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
