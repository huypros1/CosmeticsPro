import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="main-layout">
      <header>
        <nav>
          <Link to="/">CosmeticsPro</Link>
          <div>
            <Link to="/products">Sản phẩm</Link>
            {user ? (
              <>
                <Link to="/cart">Giỏ hàng</Link>
                <button onClick={logout}>Đăng xuất</button>
              </>
            ) : (
              <Link to="/login">Đăng nhập</Link>
            )}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} CosmeticsPro</p>
      </footer>
    </div>
  );
};

export default MainLayout;
