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
          <span className="navbar__logo-text">COSMETICS</span>
          <span className="navbar__logo-accent">PRO</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav">
          <NavLink to="/" end className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Trang chủ</NavLink>
          <NavLink to="/products" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Sản phẩm</NavLink>
          <NavLink to="/blog" className={({ isActive }) => `navbar__link${isActive ? ' active' : ''}`}>Blog</NavLink>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Search */}
          <button className="navbar__icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Tìm kiếm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Wishlist */}
          {user && (
            <Link to="/wishlist" className="navbar__icon-btn" aria-label="Yêu thích">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="navbar__icon-btn navbar__cart-btn" aria-label="Giỏ hàng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {cartCount > 0 && (
              <span className="navbar__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* User */}
          {user ? (
            <div className="navbar__user" ref={userMenuRef}>
              <button
                className="navbar__user-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="navbar__avatar" />
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
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Tài khoản
                  </Link>
                  <Link to="/orders" className="navbar__user-item" onClick={() => setUserMenuOpen(false)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    Đơn hàng
                  </Link>
                  <div className="navbar__user-divider" />
                  <button className="navbar__user-item navbar__user-logout" onClick={handleLogout}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
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
            <button type="submit" className="btn btn-primary btn-sm">Tìm</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSearchOpen(false)}>✕</button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile-menu">
          <NavLink to="/" end onClick={() => setMobileOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/products" onClick={() => setMobileOpen(false)}>Sản phẩm</NavLink>
          <NavLink to="/blog" onClick={() => setMobileOpen(false)}>Blog</NavLink>
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
