import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';

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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
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
                      : <div style={{ width: 48, height: 48, background: 'var(--color-gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📂</div>
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
                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
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
