import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { postApi } from '../../api/postApi';
import ProductCard from '../../components/ProductCard';

const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setProductsLoading(true);
        const [prodData, catData, postData] = await Promise.allSettled([
          productApi.getFeaturedProducts(),
          productApi.getCategories(),
          postApi.getPosts({ per_page: 3 }),
        ]);
        if (prodData.status === 'fulfilled') {
          // getFeaturedProducts returns ResourceCollection: { data: [...] }
          const val = prodData.value;
          setFeaturedProducts(val.data || val || []);
        }
        if (catData.status === 'fulfilled') {
          const val = catData.value;
          setCategories(val.data || val || []);
        }
        if (postData.status === 'fulfilled') {
          const val = postData.value;
          // paginated response: { data: [...] }
          setPosts(val.data || val || []);
        }
      } finally {
        setProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <div className="hero__label text-label">New Collection 2026</div>
            <h1 className="hero__title">
              Vẻ đẹp<br />
              <em>tự nhiên</em><br />
              của bạn
            </h1>
            <p className="hero__desc">
              Khám phá bộ sưu tập mỹ phẩm cao cấp được chọn lọc kỹ càng,
              nâng niu làn da và tôn vinh vẻ đẹp riêng của bạn.
            </p>
            <div className="hero__actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Khám phá ngay
              </Link>
              <Link to="/blog" className="btn btn-outline btn-lg">
                Blog làm đẹp
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-number">500+</span>
                <span className="hero__stat-label">Sản phẩm</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">50+</span>
                <span className="hero__stat-label">Thương hiệu</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-number">10K+</span>
                <span className="hero__stat-label">Khách hàng</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__img-frame">
              <div className="hero__img-placeholder">
                <div className="hero__circle hero__circle--1" />
                <div className="hero__circle hero__circle--2" />
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>
            <div className="hero__tag hero__tag--1">
              <span>✓</span> Chính hãng 100%
            </div>
            <div className="hero__tag hero__tag--2">
              <span>★</span> 4.9/5 đánh giá
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-bar">
        <div className="container">
          <div className="features-bar__grid">
            {[
              { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Đơn hàng từ 500.000đ' },
              { icon: '✦', title: 'Hàng chính hãng', desc: 'Cam kết 100% authentic' },
              { icon: '↩', title: 'Đổi trả dễ dàng', desc: 'Trong vòng 30 ngày' },
              { icon: '💬', title: 'Hỗ trợ 24/7', desc: 'Tư vấn chuyên gia' },
            ].map((f) => (
              <div key={f.title} className="features-bar__item">
                <span className="features-bar__icon">{f.icon}</span>
                <div>
                  <p className="features-bar__title">{f.title}</p>
                  <p className="features-bar__desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="text-label" style={{ marginBottom: 8 }}>Khám phá</p>
                <h2 className="text-heading-lg">Danh mục sản phẩm</h2>
              </div>
              <Link to="/products" className="btn btn-outline btn-sm">Xem tất cả</Link>
            </div>
            <div className="categories-grid">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="category-card"
                >
                  <div className="category-card__img">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} />
                    ) : (
                      <div className="category-card__placeholder">
                        <span>{cat.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <span className="category-card__name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="section" style={{ background: 'var(--color-gray-50)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <p className="text-label" style={{ marginBottom: 8 }}>Nổi bật</p>
              <h2 className="text-heading-lg">Sản phẩm bán chạy</h2>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">Xem tất cả</Link>
          </div>
          {productsLoading ? (
            <div className="grid-products">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card-skeleton">
                  <div className="skeleton" style={{ aspectRatio: '4/5', borderRadius: 8 }} />
                  <div style={{ padding: '14px 0' }}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid-products">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🌸</div>
              <p className="empty-state__title">Chưa có sản phẩm</p>
            </div>
          )}
        </div>
      </section>

      {/* Banner CTA */}
      <section className="banner-cta">
        <div className="container">
          <div className="banner-cta__inner">
            <div className="banner-cta__content">
              <p className="text-label" style={{ color: 'var(--color-accent)', marginBottom: 12 }}>Ưu đãi đặc biệt</p>
              <h2 className="banner-cta__title">Giảm đến 30% cho thành viên mới</h2>
              <p className="banner-cta__desc">
                Đăng ký thành viên ngay hôm nay và nhận ngay ưu đãi độc quyền cho đơn hàng đầu tiên.
              </p>
              <Link to="/register" className="btn btn-accent btn-lg">
                Đăng ký ngay
              </Link>
            </div>
            <div className="banner-cta__deco">
              <div className="banner-cta__circle" />
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="text-label" style={{ marginBottom: 8 }}>Blog</p>
                <h2 className="text-heading-lg">Bí quyết làm đẹp</h2>
              </div>
              <Link to="/blog" className="btn btn-outline btn-sm">Xem tất cả</Link>
            </div>
            <div className="blog-grid">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card__img">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} />
                    ) : (
                      <div className="blog-card__img-placeholder" />
                    )}
                  </div>
                  <div className="blog-card__body">
                    <span className="text-label" style={{ color: 'var(--color-accent)' }}>
                      {post.category_post?.name || 'Blog'}
                    </span>
                    <h3 className="blog-card__title">{post.title}</h3>
                    <p className="blog-card__date">{formatDate(post.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
