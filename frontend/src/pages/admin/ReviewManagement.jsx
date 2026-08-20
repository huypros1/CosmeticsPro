import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';
import StarRating from '../../components/StarRating';

/* ─── Reply Modal ─────────────────────────────────────────────── */
const ReplyModal = ({ review, onClose, onSaved }) => {
  const [text, setText] = useState(review.admin_reply || '');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setLoading(true);
      await adminApi.replyToReview(review.id, text.trim());
      onSaved({ ...review, admin_reply: text.trim(), admin_replied_at: new Date().toISOString() });
      onClose();
    } catch {
      alert('Không thể gửi phản hồi, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Xóa phản hồi này?')) return;
    try {
      setLoading(true);
      await adminApi.deleteReviewReply(review.id);
      onSaved({ ...review, admin_reply: null, admin_replied_at: null });
      onClose();
    } catch {
      alert('Không thể xóa phản hồi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
        boxShadow: '0 24px 64px rgba(0,0,0,.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Phản hồi đánh giá</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {review.user?.name} — {review.product?.name}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: '#94a3b8', lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Review preview */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <StarRating rating={review.rating} size={14} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              {new Date(review.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 1.6 }}>
            "{review.content || 'Không có nội dung'}"
          </p>
        </div>

        {/* Reply form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            Nội dung phản hồi của Shop
          </label>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Cảm ơn bạn đã đánh giá sản phẩm! Chúng tôi..."
            style={{
              width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0',
              padding: '12px 14px', fontSize: 14, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
              boxSizing: 'border-box', transition: 'border-color .2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-accent, #C9956A)'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <div>
              {review.admin_reply && (
                <button type="button" onClick={handleDelete} disabled={loading} style={{
                  background: 'none', border: '1px solid #fca5a5', color: '#ef4444',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
                  transition: 'all .15s',
                }}>
                  🗑 Xóa phản hồi
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                padding: '9px 20px', fontSize: 14, cursor: 'pointer', color: '#64748b',
              }}>
                Hủy
              </button>
              <button type="submit" disabled={loading || !text.trim()} style={{
                background: 'var(--color-accent, #C9956A)', border: 'none', borderRadius: 8,
                padding: '9px 24px', fontSize: 14, fontWeight: 600, color: '#fff',
                cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !text.trim() ? 0.7 : 1, transition: 'opacity .2s',
              }}>
                {loading ? 'Đang gửi...' : review.admin_reply ? '✏ Cập nhật' : '✉ Gửi phản hồi'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [filterRating, setFilterRating] = useState('');
  const [filterReplied, setFilterReplied] = useState('');
  const [search, setSearch] = useState('');
  const [replyTarget, setReplyTarget] = useState(null);

  const fetchReviews = async (p = 1) => {
    try {
      setLoading(true);
      const params = { page: p, search };
      if (filterRating) params.rating = filterRating;
      const res = await adminApi.getReviews(params);
      let list = res?.data || (Array.isArray(res) ? res : []);
      if (filterReplied === 'replied') list = list.filter(r => r.admin_reply);
      else if (filterReplied === 'pending') list = list.filter(r => !r.admin_reply);
      setReviews(list);
      setMeta(res?.meta || { current_page: res?.current_page, last_page: res?.last_page } || {});
    } catch {
      console.error('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReviews(page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, filterRating, filterReplied, search]);

  const handleReviewUpdated = (updatedReview) => {
    setReviews(prev => prev.map(r => r.id === updatedReview.id ? { ...r, ...updatedReview } : r));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    try {
      await adminApi.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Không thể xóa đánh giá.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  const repliedCount = reviews.filter(r => r.admin_reply).length;
  const pendingCount = reviews.filter(r => !r.admin_reply).length;

  return (
    <div className="management-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Đánh giá</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
            Phản hồi đánh giá từ khách hàng để tăng độ tin cậy
          </p>
        </div>
        {/* Stats pills */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            background: '#fef9ef', border: '1px solid #fed7aa', borderRadius: 10,
            padding: '8px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C9956A' }}>{pendingCount}</div>
            <div style={{ fontSize: 12, color: '#92400e' }}>Chưa phản hồi</div>
          </div>
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            padding: '8px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{repliedCount}</div>
            <div style={{ fontSize: 12, color: '#166534' }}>Đã phản hồi</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm nội dung, tên KH, sản phẩm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '280px' }}
        />
        <select
          value={filterRating}
          onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '150px' }}
        >
          <option value="">Tất cả sao</option>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} sao</option>)}
        </select>
        <select
          value={filterReplied}
          onChange={(e) => { setFilterReplied(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '170px' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chưa phản hồi</option>
          <option value="replied">Đã phản hồi</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Đánh giá</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : reviews.map(review => (
                <tr key={review.id}>
                  <td>#{review.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--color-accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                      }}>
                        {review.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14 }}>{review.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13, maxWidth: 140 }}>
                    {review.product?.name || '—'}
                  </td>
                  <td><StarRating rating={review.rating} size={14} /></td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 220 }}>
                    <div style={{ marginBottom: review.admin_reply ? 6 : 0 }}>
                      {review.content
                        ? <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{review.content}</span>
                        : <em style={{ color: 'var(--color-text-muted)' }}>Không có nội dung</em>
                      }
                    </div>
                    {review.admin_reply && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fef9ef, #fff8f0)',
                        border: '1px solid #fed7aa', borderRadius: 8,
                        padding: '6px 10px', fontSize: 12,
                      }}>
                        <span style={{ fontWeight: 600, color: '#C9956A', display: 'block', marginBottom: 2 }}>
                          💬 Phản hồi Shop:
                        </span>
                        <span style={{
                          color: '#92400e', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {review.admin_reply}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    {review.admin_reply ? (
                      <span style={{
                        background: '#dcfce7', color: '#16a34a',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>✓ Đã phản hồi</span>
                    ) : (
                      <span style={{
                        background: '#fef3c7', color: '#d97706',
                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>⏳ Chờ phản hồi</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(review.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                      <button
                        onClick={() => setReplyTarget(review)}
                        style={{
                          background: review.admin_reply
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, var(--color-accent, #C9956A), #a0714f)',
                          border: 'none', borderRadius: 8,
                          padding: '6px 12px', fontSize: 12, fontWeight: 600,
                          color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
                          transition: 'opacity .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {review.admin_reply ? '✏ Sửa' : '💬 Phản hồi'}
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        style={{
                          background: '#fee2e2', border: 'none', borderRadius: 8,
                          padding: '6px 10px', fontSize: 12, color: '#ef4444',
                          cursor: 'pointer', transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                        title="Xóa đánh giá"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
            {!loading && reviews.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                  <div>Chưa có đánh giá nào</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta.last_page > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: meta.last_page }).map((_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`pagination__page${page === i + 1 ? ' active' : ''}`}
            >{i + 1}</button>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <ReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSaved={handleReviewUpdated}
        />
      )}
    </div>
  );
};

export default ReviewManagement;
