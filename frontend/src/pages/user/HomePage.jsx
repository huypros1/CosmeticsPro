import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { postApi } from '../../api/postApi';
import ProductCard from '../../components/ProductCard';
import StarRating from '../../components/StarRating';

const formatDate = (date) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));

// Testimonial data
const testimonials = [
  { name: 'Nguyễn Thị Lan', avatar: 'L', rating: 5, text: 'Sản phẩm chất lượng tuyệt vời! Da mình cải thiện rõ rệt chỉ sau 2 tuần sử dụng. Sẽ tiếp tục ủng hộ HQCosmetic!', product: 'Serum Vitamin C' },
  { name: 'Trần Minh Hoa', avatar: 'H', rating: 5, text: 'Giao hàng nhanh, đóng gói cẩn thận. Kem dưỡng ẩm thật sự tuyệt, mình đã mua lần thứ 3 rồi đó!', product: 'Kem dưỡng ẩm' },
  { name: 'Lê Thu Hương', avatar: 'H', rating: 5, text: 'Hàng chính hãng, giá cả hợp lý. Tư vấn viên nhiệt tình, hỗ trợ rất tốt. Highly recommend!', product: 'Set dưỡng da' },
  { name: 'Phạm Bảo Ngọc', avatar: 'N', rating: 5, text: 'Mình đã thử nhiều shop nhưng chỉ tin tưởng HQCosmetic vì hàng luôn authentic và dịch vụ tốt.', product: 'Toner Cân bằng' },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setProductsLoading(true);
        const [prodData, newData, saleData, catData, postData] = await Promise.allSettled([
          productApi.getFeaturedProducts(),
          productApi.getNewArrivals(),
          productApi.getOnSale(),
          productApi.getCategories(),
          postApi.getPosts({ per_page: 3 }),
        ]);
        if (prodData.status === 'fulfilled') {
          const val = prodData.value;
          setFeaturedProducts(val.data || val || []);
        }
        if (newData.status === 'fulfilled') {
          const val = newData.value;
          setNewArrivals(val.data || val || []);
        }
        if (saleData.status === 'fulfilled') {
          const val = saleData.value;
          setOnSaleProducts(val.data || val || []);
        }
        if (catData.status === 'fulfilled') {
          const val = catData.value;
          setCategories(val.data || val || []);
        }
        if (postData.status === 'fulfilled') {
          const val = postData.value;
          setPosts(val.data || val || []);
        }
      } finally {
        setProductsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const ProductSkeleton = () => (
    <div className="grid-products">
      {Array.from({ length: 4 }).map((_, i) => (
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
  );

  return (
    <div className="home-page">
      {/* ── Editorial Hero ── */}
      <section className="hero-ed">
        {/* Full-width background image */}
        <div className="hero-ed__bg">
          <img
            src="https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
            alt="HQCosmetic background"
          />
          <div className="hero-ed__bg-overlay" />
        </div>

        {/* Top announcement bar */}
        <div className="hero-ed__topbar">
          <span>Bộ sưu tập mới — Fall 2026</span>
          <Link to="/products" className="hero-ed__topbar-link">
            Xem ngay <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {/* Center content — sits on top of background */}
        <div className="hero-ed__center">
          <p className="hero-ed__label">Mỹ phẩm cao cấp · Hàng chính hãng</p>

          <h1 className="hero-ed__title">
            Vẻ đẹp đích thực<br />
            bắt đầu từ việc<br />
            <em>chăm sóc đúng cách.</em>
          </h1>

          <p className="hero-ed__desc">
            Hơn 50 thương hiệu quốc tế — được kiểm định và phân phối chính hãng tại Việt Nam.
          </p>

          <div className="hero-ed__actions">
            <Link to="/products" className="hero-ed__btn-fill">Mua sắm ngay</Link>
            <Link to="/blog" className="hero-ed__btn-line">Bí quyết làm đẹp</Link>
          </div>
        </div>

        {/* Trust strip at bottom of hero */}
        <div className="hero-ed__strip">
          {[
            { icon: 'bi-patch-check', text: '100% hàng chính hãng' },
            { icon: 'bi-truck', text: 'Miễn phí ship đơn 500K+' },
            { icon: 'bi-arrow-counterclockwise', text: 'Đổi trả trong 30 ngày' },
            { icon: 'bi-headset', text: 'Tư vấn 24/7' },
          ].map((item) => (
            <div key={item.text} className="hero-ed__strip-item">
              <i className={`bi ${item.icon}`} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cam kết (Features) ── */}
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

      {/* ── Categories ── */}
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
                <Link key={cat.id} to={`/products?category=${cat.slug}`} className="category-card">
                  <div className="category-card__img">
                    {cat.image ? (
                      <img src={cat.image.startsWith('http') ? cat.image : `http://backend.test${cat.image}`} alt={cat.name} onError={(e) => { e.target.onerror = null; e.target.src = '/default-product.png'; }} />
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

      {/* ── Sản phẩm mới ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="text-label" style={{ marginBottom: 8 }}>Mới nhất</p>
              <h2 className="text-heading-lg">Sản phẩm mới về</h2>
            </div>
            <Link to="/products?sort=newest" className="btn btn-outline btn-sm">Xem tất cả</Link>
          </div>
          {productsLoading ? <ProductSkeleton /> : newArrivals.length > 0 ? (
            <div className="grid-products">
              {newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state__icon">🌸</div><p className="empty-state__title">Chưa có sản phẩm</p></div>
          )}
        </div>
      </section>

      {/* ── Sản phẩm bán chạy ── */}
      <section className="section" style={{ background: 'var(--color-gray-50)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <p className="text-label" style={{ marginBottom: 8 }}>Nổi bật</p>
              <h2 className="text-heading-lg">Sản phẩm bán chạy</h2>
            </div>
            <Link to="/products?sort=popular" className="btn btn-outline btn-sm">Xem tất cả</Link>
          </div>
          {productsLoading ? <ProductSkeleton /> : featuredProducts.length > 0 ? (
            <div className="grid-products">
              {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state__icon">🌸</div><p className="empty-state__title">Chưa có sản phẩm</p></div>
          )}
        </div>
      </section>

      {/* ── Sản phẩm đang sales ── */}
      {(productsLoading || onSaleProducts.length > 0) && (
        <section className="section section--sale">
          <div className="container">
            <div className="section-header">
              <div>
                <p className="text-label" style={{ marginBottom: 8, color: 'var(--color-error)' }}>🔥 Flash Sale</p>
                <h2 className="text-heading-lg">Đang giảm giá</h2>
              </div>
              <Link to="/products" className="btn btn-outline btn-sm">Xem tất cả</Link>
            </div>
            {productsLoading ? <ProductSkeleton /> : (
              <div className="grid-products">
                {onSaleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Banner CTA ── */}
      <section className="banner-cta">
        <div className="container">
          <div className="banner-cta__inner">
            <div className="banner-cta__content">
              <p className="text-label" style={{ color: 'var(--color-accent)', marginBottom: 12 }}>Ưu đãi đặc biệt</p>
              <h2 className="banner-cta__title">Giảm đến 30% cho thành viên mới</h2>
              <p className="banner-cta__desc">
                Đăng ký thành viên ngay hôm nay và nhận ngay ưu đãi độc quyền cho đơn hàng đầu tiên.
              </p>
              <Link to="/register" className="btn btn-accent btn-lg">Đăng ký ngay</Link>
            </div>
            <div className="banner-cta__deco" style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
              <img
                src="https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop"
                alt="Special Offer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '300px' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Đánh giá khách hàng ── */}
      <section className="section section--testimonials">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 40 }}>
            <div>
              <p className="text-label" style={{ marginBottom: 8 }}>Khách hàng nói gì</p>
              <h2 className="text-heading-lg">Đánh giá từ khách hàng</h2>
            </div>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className={`testimonial-card${i === activeTestimonial ? ' testimonial-card--active' : ''}`}>
                <div className="testimonial-card__stars">
                  <StarRating rating={t.rating} size={16} />
                </div>
                <p className="testimonial-card__text">"{t.text}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.avatar}</div>
                  <div>
                    <p className="testimonial-card__name">{t.name}</p>
                    <p className="testimonial-card__product">Đã mua: {t.product}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === activeTestimonial ? 'var(--color-accent)' : 'var(--color-border)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      {posts.length > 0 && (
        <section className="section" style={{ background: 'var(--color-gray-50)' }}>
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
                      <img src={post.thumbnail.startsWith('http') ? post.thumbnail : `http://backend.test${post.thumbnail}`} alt={post.title} onError={(e) => { e.target.onerror = null; e.target.src = '/default-blog.png'; }} />
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

      {/* ── Bản đồ ── */}
      <section className="section section--map">
        <div className="container">
          <div className="section-header" style={{ marginBottom: 32 }}>
            <div>
              <p className="text-label" style={{ marginBottom: 8 }}>Tìm chúng tôi</p>
              <h2 className="text-heading-lg">Cửa hàng của chúng tôi</h2>
            </div>
          </div>
          <div className="store-map-grid">
            <div className="store-info">
              <div className="store-info__item">
                <div className="store-info__icon">📍</div>
                <div>
                  <p className="store-info__label">Địa chỉ</p>
                  <p className="store-info__value">123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
                </div>
              </div>
              <div className="store-info__item">
                <div className="store-info__icon">🕐</div>
                <div>
                  <p className="store-info__label">Giờ mở cửa</p>
                  <p className="store-info__value">Thứ 2 – Thứ 7: 8:00 – 21:00</p>
                  <p className="store-info__value">Chủ nhật: 9:00 – 19:00</p>
                </div>
              </div>
              <div className="store-info__item">
                <div className="store-info__icon">📞</div>
                <div>
                  <p className="store-info__label">Điện thoại</p>
                  <p className="store-info__value">0909 123 456</p>
                </div>
              </div>
              <div className="store-info__item">
                <div className="store-info__icon">✉️</div>
                <div>
                  <p className="store-info__label">Email</p>
                  <p className="store-info__value">support@hqcosmetic.vn</p>
                </div>
              </div>
            </div>
            <div className="store-map">
              <iframe
                title="HQCosmetic Store Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4440979085!2d106.69868531411624!3d10.77720146225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa5777f9c3eb5c0!2zTmd1eeG7hW4gSHXhu4csIELhur9uIE5naOOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1svi!2s!4v1695000000000!5m2!1svi!2s"
                width="100%"
                height="380"
                style={{ border: 0, borderRadius: 16, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
