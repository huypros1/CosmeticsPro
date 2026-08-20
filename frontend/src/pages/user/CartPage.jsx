import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../../api/cartApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const CartPage = () => {
  const { user } = useAuth();
  const { cartItems, setCartItems, fetchCart, cartLoading } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  const handleUpdate = async (id, quantity) => {
    try {
      setUpdating(id);
      await cartApi.updateCartItem(id, { quantity });
      await fetchCart();  // re-fetch to ensure consistent state
    } catch { toast.error('Không thể cập nhật'); }
    finally { setUpdating(null); }
  };

  const handleRemove = async (id) => {
    try {
      await cartApi.removeCartItem(id);
      await fetchCart();
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  if (!user) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state__icon">🛒</div>
        <p className="empty-state__title">Vui lòng đăng nhập</p>
        <Link to="/login" className="btn btn-primary btn-sm">Đăng nhập</Link>
      </div>
    );
  }

  const subtotal = cartItems.reduce((s, item) => s + (item.price * item.quantity), 0);
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Giỏ hàng</h1>

        {cartLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🛒</div>
            <p className="empty-state__title">Giỏ hàng trống</p>
            <p className="empty-state__text">Hãy thêm sản phẩm vào giỏ hàng của bạn</p>
            <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <div className="cart-page__layout">
            {/* Items */}
            <div className="cart-items">
              <div className="cart-items__header">
                <span>Sản phẩm</span>
                <span>Đơn giá</span>
                <span>Số lượng</span>
                <span>Tổng</span>
                <span />
              </div>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item__product">
                    <div className="cart-item__img">
                      {item.variant?.product?.image ? (
                        <img src={item.variant.product.image} alt={item.variant?.product?.name} />
                      ) : (
                        <div className="cart-item__img-placeholder" />
                      )}
                    </div>
                    <div className="cart-item__info">
                      <Link to={`/products/${item.variant?.product?.slug}`} className="cart-item__name">
                        {item.variant?.product?.name}
                      </Link>
                      <span className="cart-item__variant">
                        {item.variant?.capacity?.value}{item.variant?.capacity?.unit}
                      </span>
                    </div>
                  </div>
                  <span className="cart-item__price">{formatPrice(item.price)}</span>
                  <div className="quantity-input" style={{ width: 'fit-content' }}>
                    <button className="quantity-input__btn"
                      onClick={() => handleUpdate(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}>−</button>
                    <span className="quantity-input__value">
                      {updating === item.id ? '...' : item.quantity}
                    </span>
                    <button className="quantity-input__btn"
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      disabled={updating === item.id}>+</button>
                  </div>
                  <span className="cart-item__total">{formatPrice(item.price * item.quantity)}</span>
                  <button className="cart-item__remove" onClick={() => handleRemove(item.id)} title="Xóa">
                    <i className="bi bi-trash3" style={{ fontSize: 16 }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <h3 className="cart-summary__title">Tổng đơn hàng</h3>
              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Phí vận chuyển</span>
                  <span>{shipping === 0 ? <span style={{ color: 'var(--color-success)' }}>Miễn phí</span> : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="cart-summary__shipping-note">
                    Miễn phí vận chuyển cho đơn từ {formatPrice(500000)}
                  </p>
                )}
                <div className="cart-summary__divider" />
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/checkout')}>
                Tiến hành thanh toán
              </button>
              <Link to="/products" className="btn btn-ghost btn-full" style={{ marginTop: 8, textAlign: 'center' }}>
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
