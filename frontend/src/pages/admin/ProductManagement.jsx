import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';
import { productApi } from '../../api/productApi';
import { getImgUrl } from '../../utils/helpers';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

/** Trả về URL hiển thị ảnh: blob (file mới) hoặc path từ server */
const getImgSrc = (src) => {
  if (!src) return null;
  if (src.startsWith('blob:') || src.startsWith('http')) return src;
  return getImgUrl(src);
};

const emptyForm = {
  name: '', description: '', content: '', status: 'active',
  category_id: '', brand_id: '', is_featured: false,
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [variants, setVariants] = useState([{ capacity_value: '', capacity_unit: 'ml', price: '', sale_price: '', stock: '' }]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const fileRef    = useRef();
  const galleryRef = useRef();

  // Gallery state
  const [galleryImages, setGalleryImages]   = useState([]); // ảnh đã lưu trên server
  const [galleryPending, setGalleryPending] = useState([]); // file mới chờ upload
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const fetchProducts = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getProducts({ 
        page: p, 
        search, 
        category_id: categoryFilter, 
        brand_id: brandFilter, 
        status: statusFilter 
      });
      console.log('[Products] res:', res, 'res.data:', res?.data);
      const list = Array.isArray(res) ? res : (res?.data || []);
      console.log('[Products] list:', list, 'length:', list.length);
      setProducts(list);
      setMeta({ current_page: res?.current_page ?? 1, last_page: res?.last_page ?? 1 });
    } catch (err) {
      console.error('[Products] Error fetching products:', err?.response?.status, err?.message, err?.response?.data);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, categoryFilter, brandFilter, statusFilter]);

  useEffect(() => {
    productApi.getCategories().then(d => setCategories(d.data || d || [])).catch(() => {});
    productApi.getBrands().then(d => setBrands(d.data || d || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setVariants([{ capacity_value: '', capacity_unit: 'ml', price: '', sale_price: '', stock: '' }]);
    setImageFile(null);
    setImagePreview(null);
    setGalleryImages([]);
    setGalleryPending([]);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditItem(product);
    setForm({
      name: product.name,
      description: product.description || '',
      content: product.content || '',
      status: product.status,
      category_id: product.category?.id || '',
      brand_id: product.brand?.id || '',
      is_featured: product.is_featured || false,
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    setVariants(
      product.variants?.length
        ? product.variants.map(v => ({
            id: v.id,
            capacity_value: v.capacity?.value || '',
            capacity_unit: v.capacity?.unit || 'ml',
            price: v.price || '',
            sale_price: v.sale_price || '',
            stock: v.stock || '',
          }))
        : [{ capacity_value: '', capacity_unit: 'ml', price: '', sale_price: '', stock: '' }]
    );
    setGalleryImages([]);
    setGalleryPending([]);
    setShowModal(true);
    // Fetch ảnh gallery từ server
    setGalleryLoading(true);
    adminApi.getProductImages(product.id)
      .then(res => setGalleryImages(Array.isArray(res) ? res : (res?.data || [])))
      .catch(() => {})
      .finally(() => setGalleryLoading(false));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

  const addVariant = () => setVariants(prev => [...prev, { capacity_value: '', capacity_unit: 'ml', price: '', sale_price: '', stock: '' }]);
  const removeVariant = (i) => setVariants(prev => prev.filter((_, idx) => idx !== i));
  const updateVariant = (i, key, val) => setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [key]: val } : v));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'is_featured') fd.append(k, v ? '1' : '0');
        else if (v !== '') fd.append(k, v);
      });
      if (imageFile) fd.append('image', imageFile);
      variants.forEach((v, i) => {
        if (v.price) {
          fd.append(`variants[${i}][price]`, v.price);
          if (v.sale_price) fd.append(`variants[${i}][sale_price]`, v.sale_price);
          fd.append(`variants[${i}][stock]`, v.stock || 0);
          if (v.capacity_value) fd.append(`variants[${i}][capacity_value]`, v.capacity_value);
          fd.append(`variants[${i}][capacity_unit]`, v.capacity_unit);
          if (v.id) fd.append(`variants[${i}][id]`, v.id);
        }
      });
      let savedProduct;
      if (editItem) {
        savedProduct = await adminApi.updateProduct(editItem.id, fd);
      } else {
        savedProduct = await adminApi.createProduct(fd);
      }

      // Upload gallery ảnh mới (nếu có)
      const productId = savedProduct?.data?.id ?? savedProduct?.id ?? editItem?.id;
      if (productId && galleryPending.length > 0) {
        setUploadingGallery(true);
        const gfd = new FormData();
        galleryPending.forEach(f => gfd.append('images[]', f));
        await adminApi.uploadProductImages(productId, gfd);
        setUploadingGallery(false);
      }

      setShowModal(false);
      fetchProducts(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
      setUploadingGallery(false);
    }
  };

  const handleToggleStatus = async (product) => {
    try {
      await adminApi.toggleProductStatus(product.id);
      fetchProducts(page);
    } catch {
      alert('Không thể thay đổi trạng thái');
    }
  };

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Sản phẩm</h1>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-plus-lg" />
          Thêm Sản phẩm
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm tên sản phẩm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '250px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Danh mục</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Thương hiệu</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '160px' }}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="active">Đang bán</option>
          <option value="inactive">Ngừng bán</option>
        </select>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th>
              <th>Thương hiệu</th><th>Biến thể</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : products.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>
                    {p.image
                      ? <img src={getImgUrl(p.image)} alt={p.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                      : <div style={{ width: 52, height: 52, background: 'var(--color-gray-100)', borderRadius: 8 }} />
                    }
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{p.category?.name || '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{p.brand?.name || '—'}</td>
                  <td>
                    {p.variants?.length
                      ? <span style={{ fontSize: 12, background: 'var(--color-gray-100)', padding: '2px 8px', borderRadius: 20 }}>{p.variants.length} biến thể</span>
                      : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Chưa có</span>
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${p.status === 'active' ? 'status-delivered' : 'status-cancelled'}`}>
                      {p.status === 'active' ? 'Hoạt động' : 'Ẩn'}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn action-btn-edit" style={{ marginRight: 6 }} onClick={() => openEdit(p)}>Sửa</button>
                    <button
                      className="action-btn"
                      style={{
                        background: p.status === 'active' ? '#f0fdf4' : '#f9fafb',
                        color: p.status === 'active' ? '#166534' : '#6b7280',
                        border: `1px solid ${p.status === 'active' ? '#bbf7d0' : '#e4e7ec'}`,
                      }}
                      onClick={() => handleToggleStatus(p)}
                    >
                      {p.status === 'active' ? 'Ẩn' : 'Hiện'}
                    </button>
                  </td>
                </tr>
              ))
            }
            {!loading && products.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Chưa có sản phẩm nào</td></tr>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 760, boxShadow: 'var(--shadow-xl)', marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>{editItem ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
            <form onSubmit={handleSave}>
              {/* Row 1 */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Tên sản phẩm *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Danh mục *</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Thương hiệu *</label>
                  <select className="form-select" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} required>
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ẩn</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                  <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                  <label htmlFor="is_featured" style={{ cursor: 'pointer', userSelect: 'none' }}>Sản phẩm nổi bật</label>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Mô tả ngắn</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              {/* Image */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ảnh sản phẩm</label>

                {/* Preview box */}
                <div style={{
                  width: '100%', height: 200, borderRadius: 10, overflow: 'hidden',
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
                          width: 28, height: 28, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, lineHeight: 1,
                        }}
                        title="Xóa ảnh"
                      >×</button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
                      <p style={{ fontSize: 13, margin: 0 }}>Chưa có ảnh sản phẩm</p>
                      <p style={{ fontSize: 12, margin: '4px 0 0', color: 'var(--color-text-muted)' }}>PNG, JPG, WEBP — tối đa 5MB</p>
                    </div>
                  )}
                </div>

                {/* File info */}
                {imageFile && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}

                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? '🔄 Đổi ảnh' : '📁 Chọn ảnh'}
                </button>
              </div>

              {/* ── Gallery ảnh sản phẩm ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    🖼️ Bộ ảnh sản phẩm
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>
                      (tối đa 10 ảnh, tự động hiển thị slider trang chi tiết)
                    </span>
                  </label>
                  <button type="button" className="btn btn-outline btn-sm"
                    onClick={() => galleryRef.current?.click()}
                    disabled={galleryImages.length + galleryPending.length >= 10}
                  >
                    + Thêm ảnh
                  </button>
                </div>
                <input
                  ref={galleryRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const remaining = 10 - galleryImages.length - galleryPending.length;
                    const toAdd = files.slice(0, remaining);
                    setGalleryPending(prev => [...prev, ...toAdd]);
                    e.target.value = '';
                  }}
                />

                {galleryLoading ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[1,2,3].map(i => (
                      <div key={i} className="skeleton" style={{ width: 90, height: 90, borderRadius: 8 }} />
                    ))}
                  </div>
                ) : (galleryImages.length + galleryPending.length === 0) ? (
                  <div style={{ border: '2px dashed #d1d5db', borderRadius: 10, padding: '24px',
                    textAlign: 'center', color: '#9ca3af', cursor: 'pointer' }}
                    onClick={() => galleryRef.current?.click()}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                    <p style={{ margin: 0, fontSize: 13 }}>Nhấn để thêm ảnh gallery</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11 }}>PNG, JPG, WEBP — max 5MB/ảnh</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Ảnh đã lưu trên server */}
                    {galleryImages.map((img) => (
                      <div key={img.id} style={{ position: 'relative', width: 90, height: 90 }}>
                        <img
                          src={getImgUrl(img.url)}
                          alt="gallery"
                          style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                          onError={(e) => { e.target.style.opacity = '0.3'; }}
                        />
                        <button type="button"
                          onClick={async () => {
                            if (!window.confirm('Xóa ảnh này?')) return;
                            try {
                              await adminApi.deleteProductImage(editItem?.id, img.id);
                              setGalleryImages(prev => prev.filter(i => i.id !== img.id));
                            } catch { alert('Không thể xóa ảnh'); }
                          }}
                          style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,.85)',
                            color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22,
                            cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Xóa ảnh"
                        >×</button>
                        <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,0,0,.45)',
                          color: '#fff', fontSize: 9, borderRadius: 3, padding: '1px 4px' }}>Đã lưu</div>
                      </div>
                    ))}

                    {/* File mới chờ upload */}
                    {galleryPending.map((file, idx) => {
                      const blobUrl = URL.createObjectURL(file);
                      return (
                        <div key={`pending-${idx}`} style={{ position: 'relative', width: 90, height: 90 }}>
                          <img src={blobUrl} alt="pending"
                            style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8,
                              border: '2px dashed #10b981', opacity: 0.85 }} />
                          <button type="button"
                            onClick={() => setGalleryPending(prev => prev.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(239,68,68,.85)',
                              color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22,
                              cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >×</button>
                          <div style={{ position: 'absolute', bottom: 3, left: 3, background: 'rgba(16,185,129,.7)',
                            color: '#fff', fontSize: 9, borderRadius: 3, padding: '1px 4px' }}>Mới</div>
                        </div>
                      );
                    })}

                    {/* Nút thêm nếu còn slot */}
                    {galleryImages.length + galleryPending.length < 10 && (
                      <button type="button"
                        onClick={() => galleryRef.current?.click()}
                        style={{ width: 90, height: 90, borderRadius: 8, border: '2px dashed #d1d5db',
                          background: '#f9fafb', color: '#6b7280', cursor: 'pointer', fontSize: 24, display: 'flex',
                          alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    )}
                  </div>
                )}
                {(galleryImages.length + galleryPending.length > 0) && (
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>
                    {galleryImages.length} ảnh đã lưu · {galleryPending.length} ảnh sẽ upload khi lưu
                    {galleryPending.length > 0 && <span style={{ color: '#10b981', fontWeight: 600 }}> ✓</span>}
                  </p>
                )}
              </div>

              {/* Variants */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0 }}>Biến thể sản phẩm</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addVariant}>+ Thêm biến thể</button>
                </div>
                {variants.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 1.5fr 1.5fr 1fr auto', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <input className="form-input" placeholder="Dung tích (e.g. 50)" value={v.capacity_value} onChange={e => updateVariant(i, 'capacity_value', e.target.value)} />
                    <select className="form-select" value={v.capacity_unit} onChange={e => updateVariant(i, 'capacity_unit', e.target.value)}>
                      {['ml', 'g', 'oz', 'L', 'kg'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input className="form-input" placeholder="Giá *" type="number" value={v.price} onChange={e => updateVariant(i, 'price', e.target.value)} />
                    <input className="form-input" placeholder="Giá sale" type="number" value={v.sale_price} onChange={e => updateVariant(i, 'sale_price', e.target.value)} />
                    <input className="form-input" placeholder="Tồn kho" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(i)} style={{ padding: '6px 10px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 6, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))}
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Mỗi hàng là 1 biến thể. Bỏ trống Dung tích nếu sản phẩm không có.</p>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploadingGallery}>
                  {uploadingGallery ? '📤 Đang upload ảnh...' : saving ? '⏳ Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
