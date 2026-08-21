import { useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../api/wishlistApi';
import { cartApi } from '../api/cartApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import StarRating from './StarRating';
import { getImgUrl } from '../utils/helpers';

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
            src={getImgUrl(product.image)}
            alt={product.name}
            className="product-card__img"
            loading="lazy"
            onError={(e) => { e.target.onerror = null; e.target.src = '/default-product.png'; }}
          />
        ) : (
          <img src="/default-product.png" alt={product.name || 'Default Product'} className="product-card__img" loading="lazy" />
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
            <i className={`bi ${wishlisted ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: 15 }} />
          </button>
          <button
            className="product-card__action-btn product-card__action-btn--cart"
            onClick={handleAddToCart}
            disabled={addingCart || !variant}
            title="Thêm vào giỏ"
          >
            {addingCart
              ? <i className="bi bi-arrow-repeat spin" style={{ fontSize: 15 }} />
              : <i className="bi bi-bag-plus" style={{ fontSize: 15 }} />}
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
