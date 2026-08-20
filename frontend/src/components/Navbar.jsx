import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">HQ</span>
          <span className="navbar__logo-accent">Cosmetics</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav">
          <NavLink to="/" end className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Trang chủ</NavLink>
          <NavLink to="/products" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Sản phẩm</NavLink>
          <NavLink to="/blog" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Blog</NavLink>
          <NavLink to="/contact" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Liên hệ</NavLink>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Search */}
          <button className="navbar__icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Tìm kiếm">
            <i className="bi bi-search" style={{ fontSize: 18 }} />
          </button>

          {/* Wishlist */}
          {user && (
            <Link to="/wishlist" className="navbar__icon-btn" aria-label="Yêu thích">
              <i className="bi bi-heart" style={{ fontSize: 18 }} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="navbar__icon-btn navbar__cart-btn" aria-label="Giỏ hàng">
            <i className="bi bi-bag" style={{ fontSize: 18 }} />
            {cartCount > 0 && (
              <span className="navbar__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="navbar__user" ref={userMenuRef}>
              <button className="navbar__user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `http://backend.test${user.avatar}`} alt={user.name} className="navbar__avatar" />
                ) : (
                  <span className="navbar__avatar-placeholder">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <div className="navbar__user-menu">
                  <div className="navbar__user-info">
                    <p className="navbar__user-name">{user.name}</p>
                    <p className="navbar__user-email">{user.email}</p>
                  </div>
                  <div className="navbar__user-divider" />
                  <Link to="/profile" className="navbar__user-item" onClick={() => setUserMenuOpen(false)}>
                    <i className="bi bi-person" />
                    Tài khoản
                  </Link>
                  <Link to="/orders" className="navbar__user-item" onClick={() => setUserMenuOpen(false)}>
                    <i className="bi bi-bag-check" />
                    Đơn hàng
                  </Link>
                  <div className="navbar__user-divider" />
                  <button className="navbar__user-item navbar__user-logout" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span className={`hamburger${mobileOpen ? ' open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="navbar__search-overlay">
          <form onSubmit={handleSearch} className="navbar__search-form">
            <input
              type="text"
              className="navbar__search-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <i className="bi bi-search" />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearchOpen(false)}>
              <i className="bi bi-x-lg" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile-menu">
          <NavLink to="/" end onClick={() => setMobileOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/products" onClick={() => setMobileOpen(false)}>Sản phẩm</NavLink>
          <NavLink to="/blog" onClick={() => setMobileOpen(false)}>Blog</NavLink>
          <NavLink to="/contact" onClick={() => setMobileOpen(false)}>Liên hệ</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" onClick={() => setMobileOpen(false)}>Tài khoản</NavLink>
              <NavLink to="/orders" onClick={() => setMobileOpen(false)}>Đơn hàng</NavLink>
              <NavLink to="/wishlist" onClick={() => setMobileOpen(false)}>Yêu thích</NavLink>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}>Đăng xuất</button>
            </>
          ) : (
            <NavLink to="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</NavLink>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
