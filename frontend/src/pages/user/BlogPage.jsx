import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postApi } from '../../api/postApi';

const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d));

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    postApi.getPosts({ status: 'published', category, per_page: 12 })
      .then((d) => setPosts(d.data || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="blog-page">
      {/* Header */}
      <div className="blog-page__hero">
        <div className="container">
          <p className="text-label" style={{ color: 'var(--color-accent)', marginBottom: 12 }}>Blog</p>
          <h1 className="blog-page__title">Bí quyết làm đẹp</h1>
          <p className="blog-page__subtitle">
            Khám phá các tips chăm sóc da, hướng dẫn trang điểm và xu hướng làm đẹp mới nhất
          </p>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="blog-grid" style={{ marginTop: 48 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 8, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 20, width: '85%', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-state__icon">📝</div>
            <p className="empty-state__title">Chưa có bài viết</p>
          </div>
        ) : (
          <div className="blog-grid" style={{ paddingTop: 48, paddingBottom: 80 }}>
            {posts.map((post, idx) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className={`blog-card${idx === 0 ? ' blog-card--featured' : ''}`}
              >
                <div className="blog-card__img">
                  {post.thumbnail
                    ? <img src={post.thumbnail} alt={post.title} />
                    : <div className="blog-card__img-placeholder" />
                  }
                </div>
                <div className="blog-card__body">
                  <span className="text-label" style={{ color: 'var(--color-accent)' }}>
                    {post.category?.name || 'Blog'}
                  </span>
                  <h3 className="blog-card__title">{post.title}</h3>
                  <p className="blog-card__date">{formatDate(post.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
