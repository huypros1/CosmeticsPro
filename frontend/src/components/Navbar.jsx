import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getImgUrl } from '../utils/helpers';
import { productApi } from '../api/productApi';

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Thêm effect debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Tận dụng api getProducts có hỗ trợ q (search)
        const res = await productApi.getProducts({ search: searchQuery.trim(), per_page: 4 });
        const list = Array.isArray(res) ? res : (res?.data || []);
        setSearchResults(list.slice(0, 4));
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400); // Đợi 400ms sau khi người dùng ngừng gõ
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
                  <img src={getImgUrl(user.avatar)} alt={user.name} className="navbar__avatar" />
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
          <div className="navbar__search-container" style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSearch} className="navbar__search-form" style={{ width: '100%' }}>
              <input
                type="text"
                className="navbar__search-input"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{ width: '100%' }}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                <i className="bi bi-search" />
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                <i className="bi bi-x-lg" />
              </button>
            </form>
            
            {/* Search Dropdown */}
            {searchQuery.trim() && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                border: '1px solid #f3f4f6', overflow: 'hidden', zIndex: 1000
              }}>
                {isSearching ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Đang tìm kiếm...</div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map(product => (
                      <Link 
                        key={product.id} 
                        to={`/products/${product.slug}`} 
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '16px',
                          borderBottom: '1px solid #f3f4f6', textDecoration: 'none', color: 'inherit',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img 
                          src={getImgUrl(product.image)} 
                          alt={product.name} 
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.name}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)' }}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                    <Link 
                      to={`/products?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      style={{
                        display: 'block', padding: '12px', textAlign: 'center', color: 'var(--color-primary)',
                        fontSize: '13px', fontWeight: 600, background: '#f8fafc', textDecoration: 'none'
                      }}
                    >
                      Xem tất cả kết quả tìm kiếm "{searchQuery}" <i className="bi bi-arrow-right"></i>
                    </Link>
                  </>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                    Không tìm thấy sản phẩm nào phù hợp
                  </div>
                )}
              </div>
            )}
          </div>
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
