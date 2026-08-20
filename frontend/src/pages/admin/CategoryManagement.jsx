import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';

/** Trả về URL hiển thị ảnh: blob (file mới) hoặc ảnh từ server */
const getImgSrc = (src) => {
  if (!src) return null;
  if (src.startsWith('blob:') || src.startsWith('http')) return src;
  return `http://backend.test${src}`;
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  const fetchCategories = async (p = 1) => {
    try {
      setLoading(true);
      // axiosClient returns response.data directly (res = paginate object)
      const res = await adminApi.getCategories({ page: p, search, per_page: 10 });
      setCategories(res?.data || (Array.isArray(res) ? res : []));
      setMeta(res?.meta || { current_page: res?.current_page, last_page: res?.last_page } || {});
    } catch {
      console.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCategories(page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setImageFile(null);
    setImagePreview(cat.image || null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Revoke old blob to avoid memory leak
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (imageFile) fd.append('image', imageFile);

      if (editItem) {
        await adminApi.updateCategory(editItem.id, fd);
      } else {
        await adminApi.createCategory(fd);
      }
      setShowModal(false);
      fetchCategories(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Danh mục</h1>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-plus-lg" />
          Thêm Danh mục
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm tên danh mục..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '300px' }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Mô tả</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : categories.map(cat => (
                <tr key={cat.id}>
                  <td>#{cat.id}</td>
                  <td>
                    {cat.image
                      ? <img src={cat.image.startsWith('http') ? cat.image : `http://backend.test${cat.image}`} alt={cat.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                      : <div style={{ width: 48, height: 48, background: 'var(--color-gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-folder2" style={{ fontSize: 22, color: 'var(--color-text-muted)' }} />
                        </div>
                    }
                  </td>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td><code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{cat.slug}</code></td>
                  <td style={{ color: 'var(--color-text-secondary)', maxWidth: 200 }}>{cat.description || '—'}</td>
                  <td>{cat.created_at ? formatDate(cat.created_at) : '—'}</td>
                  <td>
                    <button className="action-btn action-btn-edit" onClick={() => openEdit(cat)}>Sửa</button>
                  </td>
                </tr>
              ))
            }
            {!loading && categories.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chưa có danh mục nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: meta.last_page }).map((_, i) => (
            <button key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`pagination__page${page === i + 1 ? ' active' : ''}`}
            >{i + 1}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>{editItem ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tên danh mục *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ảnh danh mục</label>

                {/* Preview box */}
                <div style={{
                  width: '100%', height: 180, borderRadius: 10, overflow: 'hidden',
                  border: '2px dashed var(--color-gray-200)', marginBottom: 10,
                  background: 'var(--color-gray-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                  {imagePreview ? (
                    <>
                      <img
                        src={getImgSrc(imagePreview)}
                        alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: 'rgba(0,0,0,.55)', color: '#fff',
                          border: 'none', borderRadius: '50%',
                          width: 26, height: 26, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, lineHeight: 1,
                        }}
                        title="Xóa ảnh"
                      >×</button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      <i className="bi bi-image" style={{ fontSize: 36, marginBottom: 6, display: 'block' }} />
                      <p style={{ fontSize: 13, margin: 0 }}>Chưa có ảnh</p>
                    </div>
                  )}
                </div>

                {/* File info */}
                {imageFile && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  <i className={`bi ${imagePreview ? 'bi-arrow-repeat' : 'bi-folder2-open'}`} />
                  {imagePreview ? ' Đổi ảnh' : ' Chọn ảnh'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
