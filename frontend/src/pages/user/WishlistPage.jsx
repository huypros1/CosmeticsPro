import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../../api/wishlistApi';
import { cartApi } from '../../api/cartApi';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

const WishlistPage = () => {
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
    await wishlistApi.removeFromWishlist(productId);
    setItems((prev) => prev.filter((i) => i.product_id !== productId && i.product?.id !== productId));
    toast.info('Đã xóa khỏi yêu thích');
  };

  const handleAddToCart = async (item) => {
    const variant = item.product?.variants?.[0];
    if (!variant) { toast.error('Sản phẩm không có biến thể'); return; }
    try {
      await cartApi.addToCart({ variant_id: variant.id, quantity: 1 });
      await fetchCart();
      toast.success('Đã thêm vào giỏ hàng');
    } catch { toast.error('Không thể thêm vào giỏ hàng'); }
  };

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Sản phẩm yêu thích</h1>
        {loading ? (
          <div className="grid-products">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '4/5', borderRadius: 8 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🤍</div>
            <p className="empty-state__title">Danh sách yêu thích trống</p>
            <p className="empty-state__text">Lưu những sản phẩm bạn yêu thích để mua sau</p>
            <Link to="/products" className="btn btn-primary">Khám phá sản phẩm</Link>
          </div>
        ) : (
          <div className="grid-products">
            {items.map((item) => {
              const product = item.product || item;
              const variant = product.variants?.[0];
              const price = variant?.sale_price || variant?.price;
              return (
                <div key={item.id} className="product-card" style={{ position: 'relative' }}>
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
                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAddToCart(item)}>
                      Thêm vào giỏ
                    </button>
                    <button className="btn btn-outline btn-icon-sm" onClick={() => handleRemove(product.id)} title="Xóa">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
