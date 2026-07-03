import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';

const BACKEND = 'http://backend.test';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileRef = useRef();

  const fetchBrands = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getBrands({ page: p, search, per_page: 10 });
      setBrands(res?.data || (Array.isArray(res) ? res : []));
      setMeta(res?.meta || { current_page: res?.current_page, last_page: res?.last_page } || {});
    } catch {
      console.error('Error fetching brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBrands(page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', description: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const openEdit = (brand) => {
    setEditItem(brand);
    setForm({ name: brand.name, description: brand.description || '' });
    setLogoFile(null);
    setLogoPreview(brand.logo ? BACKEND + brand.logo : null);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (logoFile) fd.append('logo', logoFile);

      if (editItem) {
        await adminApi.updateBrand(editItem.id, fd);
      } else {
        await adminApi.createBrand(fd);
      }
      setShowModal(false);
      fetchBrands(page);
    } catch {
      alert('Đã xảy ra lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const lastPage = meta.last_page || (brands.length < 10 ? page : page + 1);

  return (
    <div className="management-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Quản lý Thương hiệu</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Thêm, sửa logo và thông tin thương hiệu</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm thương hiệu</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Tìm tên thương hiệu..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '300px' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
          <p>Chưa có thương hiệu nào. Hãy thêm mới!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {brands.map(brand => (
            <div key={brand.id} style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'pointer',
            }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = ''; }}
            >
              {/* Logo */}
              <div style={{
                height: 120,
                background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #f3f4f6',
              }}>
                {brand.logo ? (
                  <img
                    src={BACKEND + brand.logo}
                    alt={brand.name}
                    style={{ maxWidth: '80%', maxHeight: '80px', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: 36, color: '#d1d5db' }}>🏷️</span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {brand.name}
                </p>
                {brand.description && (
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {brand.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8 }}>
                <button
                  className="action-btn action-btn-edit"
                  style={{ flex: 1 }}
                  onClick={() => openEdit(brand)}
                >
                  Sửa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          {Array.from({ length: lastPage }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`pagination__page${page === i + 1 ? ' active' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32,
            width: '100%', maxWidth: 480, boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700 }}>
              {editItem ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
            </h2>

            <form onSubmit={handleSave}>
              {/* Logo Upload */}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Logo thương hiệu</label>
                <div
                  style={{
                    border: '2px dashed #e5e7eb', borderRadius: 12,
                    padding: 20, textAlign: 'center', cursor: 'pointer',
                    background: '#f9fafb', transition: 'border-color 0.2s',
                  }}
                  onClick={() => fileRef.current?.click()}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#c98a6c'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
                  ) : (
                    <div style={{ color: '#9ca3af' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                      <p style={{ margin: 0, fontSize: 13 }}>Nhấn để chọn logo (PNG, JPG, GIF)</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Tên thương hiệu <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  required
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: The Ordinary, LANEIGE..."
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Giới thiệu ngắn về thương hiệu..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editItem ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandManagement;
