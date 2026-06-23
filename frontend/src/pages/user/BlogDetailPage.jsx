import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postApi } from '../../api/postApi';

const formatDate = (d) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d));

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postApi.getPostBySlug(slug)
      .then((d) => setPost(d.post || d))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="container" style={{ padding: '60px 24px' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 8, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 36, width: '60%', borderRadius: 4, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 4, marginBottom: 32 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 10, width: i % 3 === 2 ? '70%' : '100%' }} />
      ))}
    </div>
  );

  if (!post) return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <p className="empty-state__title">Không tìm thấy bài viết</p>
      <Link to="/blog" className="btn btn-outline btn-sm">Quay lại Blog</Link>
    </div>
  );

  return (
    <div className="blog-detail-page">
      {/* Hero Image */}
      {post.thumbnail && (
        <div className="blog-detail__hero-img">
          <img src={post.thumbnail} alt={post.title} />
        </div>
      )}

      <div className="container">
        <div className="blog-detail__layout">
          <article className="blog-detail__article">
            <Link to="/blog" className="back-link">← Quay lại Blog</Link>
            <div className="blog-detail__meta">
              <span className="text-label" style={{ color: 'var(--color-accent)' }}>
                {post.category_post?.name || 'Blog'}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                {formatDate(post.created_at)}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                Bởi {post.author?.name}
              </span>
            </div>
            <h1 className="blog-detail__title">{post.title}</h1>
            {post.image && (
              <img src={post.image} alt={post.title} className="blog-detail__main-img" />
            )}
            <div
              className="blog-detail__content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
