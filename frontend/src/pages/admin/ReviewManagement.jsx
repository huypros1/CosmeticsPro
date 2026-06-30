import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import StarRating from '../../components/StarRating';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [filterRating, setFilterRating] = useState('');

  const fetchReviews = async (p = 1) => {
    try {
      setLoading(true);
      const params = { page: p };
      if (filterRating) params.rating = filterRating;
      const res = await adminApi.getReviews(params);
      setReviews(res.data.data || res.data || []);
      setMeta(res.data.meta || {});
    } catch {
      console.error('Error fetching reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(page); }, [page, filterRating]);

  const handleDelete = async (id) => {
    if (!confirm('Xóa đánh giá này?')) return;
    try {
      await adminApi.deleteReview(id);
      fetchReviews(page);
    } catch {
      alert('Không thể xóa đánh giá');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Quản lý Đánh giá</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Lọc theo sao:</label>
          <select className="form-select" style={{ width: 140 }} value={filterRating} onChange={e => { setFilterRating(e.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} sao</option>)}
          </select>
        </div>
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
              <th>Ngày</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : reviews.map(review => (
                <tr key={review.id}>
                  <td>#{review.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {review.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14 }}>{review.user?.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{review.product?.name || '—'}</td>
                  <td><StarRating rating={review.rating} size={14} /></td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 260 }}>
                    {review.content || <em style={{ color: 'var(--color-text-muted)' }}>Không có nội dung</em>}
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(review.created_at)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(review.id)}>Xóa</button>
                  </td>
                </tr>
              ))
            }
            {!loading && reviews.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chưa có đánh giá nào</td></tr>
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
    </div>
  );
};

export default ReviewManagement;
