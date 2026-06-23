import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { cartApi } from '../../api/cartApi';
import { reviewApi } from '../../api/reviewApi';
import { wishlistApi } from '../../api/wishlistApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import StarRating from '../../components/StarRating';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d));

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeTab, setActiveTab] = useState('desc');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await productApi.getProductBySlug(slug);
        // Backend: JsonResource returns { data: {...} }
        const prod = res.data || res;
        setProduct(prod);
        setSelectedVariant(prod?.variants?.[0]);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  useEffect(() => {
    if (product?.id) {
      reviewApi.getProductReviews(product.id)
        .then((d) => setReviews(d.data || d || []))
        .catch(() => {});
    }
  }, [product?.id]);

  const handleAddToCart = async () => {
    if (!user) { toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng'); return; }
    if (!selectedVariant) return;
    try {
      setAddingCart(true);
      await cartApi.addToCart({ variant_id: selectedVariant.id, quantity });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch {
      toast.error('Không thể thêm vào giỏ hàng, vui lòng thử lại');
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) { toast.warning('Vui lòng đăng nhập'); return; }
    try {
      if (wishlisted) {
        await wishlistApi.removeFromWishlist(product.id);
        setWishlisted(false);
        toast.info('Đã xóa khỏi yêu thích');
      } else {
        await wishlistApi.addToWishlist(product.id);
        setWishlisted(true);
        toast.success('Đã thêm vào yêu thích');
      }
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.warning('Vui lòng đăng nhập để đánh giá'); return; }
    try {
      setSubmittingReview(true);
      await reviewApi.submitReview({ product_id: product.id, ...reviewForm });
      toast.success('Đánh giá đã được gửi');
      setReviewForm({ rating: 5, content: '' });
      const data = await reviewApi.getProductReviews(product.id);
      setReviews(data.data || data || []);
    } catch {
      toast.error('Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="product-detail-skeleton">
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 8 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
            <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 36, width: '80%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 24, width: '30%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state__icon">😢</div>
        <p className="empty-state__title">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="btn btn-primary btn-sm">Xem sản phẩm khác</Link>
      </div>
    );
  }

  const allImages = [product.image, ...(product.images?.map((i) => i.url) || [])].filter(Boolean);
  const hasDiscount = selectedVariant?.sale_price && selectedVariant.sale_price < selectedVariant.price;
  const displayPrice = hasDiscount ? selectedVariant.sale_price : selectedVariant?.price;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>›</span>
          <Link to="/products">Sản phẩm</Link>
          {product.category && (
            <>
              <span>›</span>
              <Link to={`/products?category=${product.category.slug}`}>{product.category.name}</Link>
            </>
          )}
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        {/* Main Layout */}
        <div className="product-detail__main">
          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {allImages.length > 0 ? (
                <img src={allImages[activeImg]} alt={product.name} className="product-gallery__img" />
              ) : (
                <div className="product-gallery__placeholder">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="product-gallery__thumbs">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    className={`product-gallery__thumb${activeImg === i ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            {product.brand && (
              <span className="product-detail__brand">{product.brand.name}</span>
            )}
            <h1 className="product-detail__name">{product.name}</h1>

            {/* Rating summary */}
            {reviews.length > 0 && (
              <div className="product-detail__rating">
                <StarRating rating={Number(avgRating)} size={16} />
                <span className="product-detail__rating-num">{avgRating}</span>
                <span className="product-detail__rating-count">({reviews.length} đánh giá)</span>
              </div>
            )}

            {/* Price */}
            <div className="product-detail__price-block">
              {hasDiscount ? (
                <>
                  <span className="product-detail__price product-detail__price--sale">
                    {formatPrice(selectedVariant.sale_price)}
                  </span>
                  <span className="product-detail__price product-detail__price--original">
                    {formatPrice(selectedVariant.price)}
                  </span>
                  <span className="badge badge-error">
                    -{Math.round((1 - selectedVariant.sale_price / selectedVariant.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="product-detail__price">
                  {displayPrice ? formatPrice(displayPrice) : 'Liên hệ'}
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="product-detail__section">
                <span className="product-detail__section-label">Dung tích</span>
                <div className="product-detail__variants">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      className={`product-detail__variant-btn${selectedVariant?.id === v.id ? ' active' : ''}${v.stock === 0 ? ' disabled' : ''}`}
                      onClick={() => v.stock > 0 && setSelectedVariant(v)}
                      disabled={v.stock === 0}
                      title={v.stock === 0 ? 'Hết hàng' : ''}
                    >
                      {v.capacity?.value}{v.capacity?.unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            {selectedVariant && (
              <div className="product-detail__stock">
                {selectedVariant.stock > 0 ? (
                  <span className="badge badge-success">Còn hàng ({selectedVariant.stock})</span>
                ) : (
                  <span className="badge badge-error">Hết hàng</span>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="product-detail__section">
              <span className="product-detail__section-label">Số lượng</span>
              <div className="quantity-input">
                <button
                  className="quantity-input__btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >−</button>
                <span className="quantity-input__value">{quantity}</span>
                <button
                  className="quantity-input__btn"
                  onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                  disabled={quantity >= (selectedVariant?.stock || 99)}
                >+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="product-detail__actions">
              <button
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={addingCart || !selectedVariant || selectedVariant.stock === 0}
              >
                {addingCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>
              <button
                className={`btn btn-outline btn-icon-xl${wishlisted ? ' btn-wishlisted' : ''}`}
                onClick={handleWishlist}
                title="Thêm vào yêu thích"
                style={{ width: 52, height: 52, flexShrink: 0 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="product-detail__trust">
              {[
                { icon: '✓', text: 'Hàng chính hãng 100%' },
                { icon: '🚚', text: 'Miễn phí vận chuyển' },
                { icon: '↩', text: 'Đổi trả trong 30 ngày' },
              ].map((t) => (
                <span key={t.text} className="product-detail__trust-item">
                  <span style={{ color: 'var(--color-accent)' }}>{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="product-detail__tabs">
          <div className="tabs-header">
            {['desc', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`tabs-header__btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'desc' ? 'Mô tả sản phẩm' : `Đánh giá (${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'desc' && (
            <div className="tabs-content">
              {product.description ? (
                <p style={{ lineHeight: 1.85, color: 'var(--color-text-secondary)' }}>{product.description}</p>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>Chưa có mô tả sản phẩm.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tabs-content">
              {/* Review Form */}
              {user && (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <h4 className="review-form__title">Viết đánh giá của bạn</h4>
                  <div className="review-form__rating">
                    <span className="product-detail__section-label">Đánh giá</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                          style={{
                            fontSize: 24, background: 'none', border: 'none', cursor: 'pointer',
                            color: s <= reviewForm.rating ? '#C9956A' : '#D5D0C8',
                            transition: 'color 0.15s',
                          }}
                        >★</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nội dung đánh giá</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="empty-state" style={{ paddingTop: 40 }}>
                  <div className="empty-state__icon">💬</div>
                  <p className="empty-state__title">Chưa có đánh giá nào</p>
                  <p className="empty-state__text">Hãy là người đầu tiên đánh giá sản phẩm này</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="review-item">
                      <div className="review-item__header">
                        <div className="review-item__user">
                          <div className="review-item__avatar">
                            {rev.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="review-item__name">{rev.user?.name}</p>
                            <p className="review-item__date">{formatDate(rev.created_at)}</p>
                          </div>
                        </div>
                        <StarRating rating={rev.rating} size={14} />
                      </div>
                      {rev.content && (
                        <p className="review-item__content">{rev.content}</p>
                      )}
                      {rev.image && (
                        <img src={rev.image} alt="Review" className="review-item__img" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
