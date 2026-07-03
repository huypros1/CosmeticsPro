import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';
import { productApi } from '../../api/productApi';

const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

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
  const fileRef = useRef();

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
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
      if (editItem) {
        await adminApi.updateProduct(editItem.id, fd);
      } else {
        await adminApi.createProduct(fd);
      }
      setShowModal(false);
      fetchProducts(page);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7h14"/></svg>
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
                      ? <img src={p.image.startsWith('http') ? p.image : `http://backend.test${p.image}`} alt={p.name} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} />
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
                {imagePreview && (
                  <img src={imagePreview.startsWith('http') ? imagePreview : `http://backend.test${imagePreview}`} alt="preview"
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                )}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                </button>
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
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
