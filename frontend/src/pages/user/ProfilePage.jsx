import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import { wishlistApi } from '../../api/wishlistApi';
import { orderApi } from '../../api/orderApi';
import { cartApi } from '../../api/cartApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));

const statusMap = {
  pending:    { label: 'Chờ xác nhận', cls: 'badge-gray' },
  processing: { label: 'Đang xử lý',   cls: 'badge-warning' },
  shipped:    { label: 'Đang vận chuyển', cls: 'badge-accent' },
  delivered:  { label: 'Đã giao',      cls: 'badge-success' },
  cancelled:  { label: 'Đã hủy',       cls: 'badge-error' },
};

// ─── Wishlist Tab ─────────────────────────────────────────────────────────────
const WishlistTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchCart } = useCart();
  const toast = useToast();

  useEffect(() => {
    wishlistApi.getWishlist()
      .then((d) => setItems(d.data || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistApi.removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => (i.id || i.product?.id) !== productId));
      toast.info('Đã xóa khỏi yêu thích');
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const handleAddToCart = async (product) => {
    const variant = product?.variants?.[0];
    if (!variant) { toast.error('Sản phẩm không có biến thể'); return; }
    try {
      await cartApi.addToCart({ variant_id: variant.id, quantity: 1 });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch { toast.error('Không thể thêm vào giỏ hàng'); }
  };

  if (loading) return (
    <div className="grid-products" style={{ marginTop: 0 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ aspectRatio: '4/5', borderRadius: 8 }} />
      ))}
    </div>
  );

  if (items.length === 0) return (
    <div className="empty-state" style={{ padding: '40px 0' }}>
      <div className="empty-state__icon">🤍</div>
      <p className="empty-state__title">Danh sách yêu thích trống</p>
      <p className="empty-state__text">Lưu những sản phẩm bạn yêu thích để mua sau</p>
      <Link to="/products" className="btn btn-primary">Khám phá sản phẩm</Link>
    </div>
  );

  return (
    <div className="grid-products" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {items.map((item) => {
        const product = item.name ? item : (item.product || item);
        const variant = product.variants?.[0];
        const price = variant?.sale_price || variant?.price;
        return (
          <div key={product.id} className="product-card" style={{ position: 'relative' }}>
            <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="product-card__img-wrap">
                {product.image
                  ? <img src={product.image} alt={product.name} className="product-card__img" />
                  : <div className="product-card__img-placeholder" />
                }
              </div>
              <div className="product-card__info">
                {product.brand && <span className="product-card__brand">{product.brand.name}</span>}
                <h3 className="product-card__name">{product.name}</h3>
                {price && <span className="product-card__price">{formatPrice(price)}</span>}
              </div>
            </Link>
            <div style={{ padding: '0 12px 12px', display: 'flex', gap: 6 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 12 }}
                onClick={() => handleAddToCart(product)}>
                Thêm vào giỏ
              </button>
              <button className="btn btn-outline btn-icon-sm" onClick={() => handleRemove(product.id)} title="Xóa">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    orderApi.getOrders()
      .then((d) => setOrders(d.data || d || []))
      .catch(() => toast.error('Không thể tải đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 110, borderRadius: 10 }} />
      ))}
    </div>
  );

  if (orders.length === 0) return (
    <div className="empty-state" style={{ padding: '40px 0' }}>
      <div className="empty-state__icon">📦</div>
      <p className="empty-state__title">Chưa có đơn hàng nào</p>
      <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {orders.map((order) => {
        const st = statusMap[order.status] || { label: order.status, cls: 'badge-gray' };
        const items = order.items || order.order_items || [];
        return (
          <div key={order.id} className="order-card">
            <div className="order-card__header">
              <div className="order-card__meta">
                <span className="order-card__id">Đơn #{order.id}</span>
                <span className="order-card__date">{formatDate(order.created_at)}</span>
              </div>
              <span className={`badge ${st.cls}`}>{st.label}</span>
            </div>
            <div className="order-card__items">
              {items.slice(0, 2).map((item) => (
                <div key={item.id} className="order-card__item">
                  <div className="order-card__item-img">
                    {item.variant?.product?.image
                      ? <img src={item.variant.product.image} alt="" />
                      : <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-100)' }} />
                    }
                  </div>
                  <div>
                    <p className="order-card__item-name">{item.variant?.product?.name}</p>
                    <p className="order-card__item-meta">× {item.quantity}</p>
                  </div>
                </div>
              ))}
              {items.length > 2 && (
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
                  +{items.length - 2} sản phẩm khác
                </span>
              )}
            </div>
            <div className="order-card__footer">
              <div>
                <span className="order-card__total-label">Tổng cộng</span>
                <span className="order-card__total">{formatPrice(order.total_amount)}</span>
              </div>
              <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, login } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '' },
  });
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch: watchPw } = useForm();

  const newPassword = watchPw('password');

  const onSaveProfile = async (data) => {
    try {
      setSavingProfile(true);
      const res = await profileApi.updateProfile(data);
      const token = localStorage.getItem('token');
      login(token, res.user || { ...user, name: data.name });
      toast.success('Cập nhật thông tin thành công');
    } catch { toast.error('Không thể cập nhật thông tin'); }
    finally { setSavingProfile(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await profileApi.uploadAvatar(fd);
      const token = localStorage.getItem('token');
      login(token, res.data?.user || res.user || { ...user });
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch {
      toast.error('Không thể cập nhật ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onChangePassword = async (data) => {
    try {
      setSavingPw(true);
      await profileApi.changePassword(data);
      toast.success('Đổi mật khẩu thành công');
      resetPw();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mật khẩu cũ không đúng');
    } finally { setSavingPw(false); }
  };

  const tabs = [
    { key: 'info',     label: 'Thông tin cá nhân', icon: '👤' },
    { key: 'orders',   label: 'Đơn hàng',           icon: '📦' },
    { key: 'wishlist', label: 'Yêu thích',           icon: '❤️' },
    { key: 'security', label: 'Bảo mật',             icon: '🔒' },
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Tài khoản của tôi</h1>

        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-user">
              <div
                className="profile-avatar"
                onClick={() => avatarInputRef.current?.click()}
                title="Nhấp để thay đổi ảnh đại diện"
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {uploadingAvatar ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : user?.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `http://backend.test${user.avatar}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase()}</span>
                )}
                {/* Camera overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  fontSize: 20,
                }} className="avatar-overlay">📷</div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              <div>
                <p className="profile-user__name">{user?.name}</p>
                <p className="profile-user__email">{user?.email}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Nhấp vào ảnh để thay đổi</p>
              </div>
            </div>
            <nav className="profile-nav">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`profile-nav__item${tab === t.key ? ' active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  <span style={{ marginRight: 8 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="profile-content">

            {/* Info Tab */}
            {tab === 'info' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Thông tin cá nhân</h3>
                <form onSubmit={handleSubmit(onSaveProfile)}>
                  <div style={{ display: 'grid', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Họ tên</label>
                      <input className={`form-input${errors.name ? ' form-input--error' : ''}`}
                        {...register('name', { required: 'Họ tên là bắt buộc' })} />
                      {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={user?.email || ''} disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={savingProfile}>
                      {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Lịch sử đơn hàng</h3>
                <OrdersTab />
              </div>
            )}

            {/* Wishlist Tab */}
            {tab === 'wishlist' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Sản phẩm yêu thích</h3>
                <WishlistTab />
              </div>
            )}

            {/* Security Tab */}
            {tab === 'security' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Đổi mật khẩu</h3>
                <form onSubmit={handlePw(onChangePassword)}>
                  <div style={{ display: 'grid', gap: 20, maxWidth: 400 }}>
                    <div className="form-group">
                      <label className="form-label">Mật khẩu hiện tại</label>
                      <input type="password" className="form-input"
                        {...regPw('current_password', { required: 'Bắt buộc' })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mật khẩu mới</label>
                      <input type="password" className="form-input"
                        {...regPw('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Xác nhận mật khẩu mới</label>
                      <input type="password" className="form-input"
                        {...regPw('password_confirmation', {
                          required: 'Bắt buộc',
                          validate: (v) => v === newPassword || 'Mật khẩu không khớp',
                        })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={savingPw}>
                      {savingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
