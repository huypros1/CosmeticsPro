import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';

const statusMap = { draft: 'Bản nháp', published: 'Đã đăng' };

const PostManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [form, setForm] = useState({ title: '', content: '', status: 'draft', category_post_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const fetchPosts = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getPosts({ page: p });
      setPosts(res.data.data || res.data || []);
      setMeta(res.data.meta || {});
    } catch {
      console.error('Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await adminApi.getPostCategories();
      setCategories(res.data || []);
    } catch { }
  };

  useEffect(() => { fetchPosts(page); }, [page]);
  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', content: '', status: 'draft', category_post_id: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (post) => {
    setEditItem(post);
    setForm({
      title: post.title,
      content: post.content || '',
      status: post.status,
      category_post_id: post.category_post_id || '',
    });
    setImageFile(null);
    setImagePreview(post.thumbnail || null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('status', form.status);
      if (form.category_post_id) fd.append('category_post_id', form.category_post_id);
      if (imageFile) fd.append('thumbnail', imageFile);

      if (editItem) {
        await adminApi.updatePost(editItem.id, fd);
      } else {
        await adminApi.createPost(fd);
      }
      setShowModal(false);
      fetchPosts(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const fd = new FormData();
      fd.append('title', post.title);
      fd.append('content', post.content || '');
      fd.append('status', newStatus);
      await adminApi.updatePost(post.id, fd);
      fetchPosts(page);
    } catch {
      alert('Không thể thay đổi trạng thái');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý Tin tức</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm bài viết</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tiêu đề</th>
              <th>Danh mục</th>
              <th>Tác giả</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : posts.map(post => (
                <tr key={post.id}>
                  <td>#{post.id}</td>
                  <td>
                    {post.thumbnail
                      ? <img src={post.thumbnail.startsWith('http') ? post.thumbnail : `http://backend.test${post.thumbnail}`} alt={post.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      : <div style={{ width: 60, height: 40, background: 'var(--color-gray-100)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</div>
                    }
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: 220 }}>{post.title}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{post.category?.name || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{post.author?.name || '—'}</td>
                  <td>
                    <span className={`status-badge ${post.status === 'published' ? 'status-delivered' : 'status-pending'}`}>
                      {statusMap[post.status] || post.status}
                    </span>
                  </td>
                  <td>{post.created_at ? formatDate(post.created_at) : '—'}</td>
                  <td>
                    <button className="action-btn action-btn-edit" style={{ marginRight: 6 }} onClick={() => openEdit(post)}>Sửa</button>
                    <button
                      className="action-btn"
                      style={{
                        background: post.status === 'published' ? '#f0fdf4' : '#fef9c3',
                        color: post.status === 'published' ? '#166534' : '#92400e',
                        border: `1px solid ${post.status === 'published' ? '#bbf7d0' : '#fde68a'}`,
                      }}
                      onClick={() => handleToggleStatus(post)}
                    >
                      {post.status === 'published' ? 'Rút xuống' : 'Đăng'}
                    </button>
                  </td>
                </tr>
              ))
            }
            {!loading && posts.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chưa có bài viết nào</td></tr>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>{editItem ? 'Sửa bài viết' : 'Thêm bài viết'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tiêu đề *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-select" value={form.category_post_id} onChange={e => setForm({ ...form, category_post_id: e.target.value })}>
                    <option value="">-- Không có --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">Bản nháp</option>
                    <option value="published">Đăng ngay</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Nội dung</label>
                <textarea className="form-textarea" rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Nội dung bài viết..." />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ảnh thumbnail</label>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManagement;
