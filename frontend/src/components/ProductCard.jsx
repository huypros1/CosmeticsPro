import { useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../api/wishlistApi';
import { cartApi } from '../api/cartApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import StarRating from './StarRating';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const toast = useToast();
  const [wishlisted, setWishlisted] = useState(false);
  const [addingCart, setAddingCart] = useState(false);

  const variant = product.variants?.[0];
  const hasDiscount = variant?.sale_price && variant.sale_price < variant.price;
  const discountPct = hasDiscount
    ? Math.round((1 - variant.sale_price / variant.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? variant.sale_price : variant?.price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.warning('Vui lòng đăng nhập để thêm vào yêu thích'); return; }
    try {
      if (wishlisted) {
        await wishlistApi.removeFromWishlist(product.id);
        toast.info('Đã xóa khỏi danh sách yêu thích');
      } else {
        await wishlistApi.addToWishlist(product.id);
        toast.success('Đã thêm vào danh sách yêu thích');
      }
      setWishlisted(!wishlisted);
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng'); return; }
    if (!variant) { toast.error('Sản phẩm không có biến thể'); return; }
    try {
      setAddingCart(true);
      await cartApi.addToCart({ variant_id: variant.id, quantity: 1 });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng');
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      {/* Image */}
      <div className="product-card__img-wrap">
        {product.image ? (
          <img
            src={product.image.startsWith('http') ? product.image : `http://backend.test${product.image}`}
            alt={product.name}
            className="product-card__img"
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = '/default-product.png'; }}
          />
        ) : (
          <img
            src="/default-product.png"
            alt={product.name || "Default Product"}
            className="product-card__img"
            loading="lazy"
          />
        )}

        {/* Badges */}
        <div className="product-card__badges">
          {hasDiscount && (
            <span className="product-card__badge product-card__badge--sale">-{discountPct}%</span>
          )}
          {product.status === 'new' && (
            <span className="product-card__badge product-card__badge--new">Mới</span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="product-card__actions">
          <button
            className={`product-card__action-btn${wishlisted ? ' active' : ''}`}
            onClick={handleWishlist}
            title="Yêu thích"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button
            className="product-card__action-btn product-card__action-btn--cart"
            onClick={handleAddToCart}
            disabled={addingCart || !variant}
            title="Thêm vào giỏ"
          >
            {addingCart ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="product-card__info">
        {product.brand && (
          <span className="product-card__brand">{product.brand.name}</span>
        )}
        <h3 className="product-card__name">{product.name}</h3>
        {product.avg_rating > 0 && (
          <div className="product-card__rating">
            <StarRating rating={product.avg_rating} size={12} />
            <span className="product-card__reviews">({product.review_count || 0})</span>
          </div>
        )}
        <div className="product-card__price-row">
          {hasDiscount ? (
            <>
              <span className="product-card__price product-card__price--sale">
                {formatPrice(variant.sale_price)}
              </span>
              <span className="product-card__price product-card__price--original">
                {formatPrice(variant.price)}
              </span>
            </>
          ) : (
            <span className="product-card__price">
              {displayPrice ? formatPrice(displayPrice) : 'Liên hệ'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
