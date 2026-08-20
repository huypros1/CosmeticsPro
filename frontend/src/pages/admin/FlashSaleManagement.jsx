import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';

const FlashSaleManagement = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [form, setForm] = useState({
    name: '',
    start_time: '',
    end_time: '',
    status: 'active',
    items: [],
  });

  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');

  const fetchSales = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getFlashSales({ page: p, search, status: statusFilter });
      // res.data is the Laravel paginate object: { data: [...], current_page, last_page }
      const payload = res.data;
      const list = payload?.data ?? payload;
      setSales(Array.isArray(list) ? list : []);
      setMeta({
        current_page: payload?.current_page ?? 1,
        last_page: payload?.last_page ?? 1,
      });
    } catch (err) {
      console.error('fetchSales error:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSales(page);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search, statusFilter]);

  const fetchProducts = async (search = '') => {
    try {
      const res = await adminApi.getProducts({ search, per_page: 50 });
      // Handle multiple response shapes
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchProducts error:', err);
      setProducts([]);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchProducts();
    }
  }, [showModal]);

  const handleSearchProduct = (e) => {
    setSearchProduct(e.target.value);
    // basic debounce
    setTimeout(() => {
      fetchProducts(e.target.value);
    }, 500);
  };

  const handleToggleStatus = async (sale) => {
    try {
      await adminApi.toggleFlashSaleStatus(sale.id);
      fetchSales(page);
    } catch {
      alert('Không thể đổi trạng thái');
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', start_time: '', end_time: '', status: 'active', items: [] });
    setShowModal(true);
  };

  const openEdit = async (sale) => {
    setEditItem(sale);
    try {
      const res = await adminApi.getFlashSale(sale.id);
      // Backend returns the object directly (no wrapper), axios wraps in res.data
      const fullSale = res.data?.data || res.data || {};

      const formatDT = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      // items may be named 'items' or 'flash_sale_items'
      const rawItems = fullSale?.items || fullSale?.flash_sale_items || [];

      setForm({
        name: fullSale?.name || '',
        start_time: formatDT(fullSale?.start_time),
        end_time: formatDT(fullSale?.end_time),
        status: fullSale?.status || 'active',
        items: rawItems.map(i => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id,
          sale_price: i.sale_price,
          quantity: i.quantity ?? 0,
          _temp_name: i.product?.name || `Sản phẩm #${i.product_id}`,
          _temp_variant: i.variant?.capacity
            ? `${i.variant.capacity.value}${i.variant.capacity.unit}`
            : (i.product_variant_id ? `Variant #${i.product_variant_id}` : ''),
        })),
      });
      setShowModal(true);
    } catch (err) {
      console.error('openEdit error:', err?.response?.data || err.message || err);
      alert(`Không thể tải thông tin flash sale: ${err?.response?.status || ''} ${err?.response?.data?.message || err.message || ''}`);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      return alert('Vui lòng chọn ít nhất 1 sản phẩm');
    }
    try {
      setSaving(true);
      if (editItem) {
        await adminApi.updateFlashSale(editItem.id, form);
      } else {
        await adminApi.createFlashSale(form);
      }
      setShowModal(false);
      fetchSales(page);
    } catch {
      alert('Đã xảy ra lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // Add a specific variant as a flash sale item
  const addVariantItem = (product, variant) => {
    if (form.items.find(i => i.product_variant_id === variant.id)) {
      return alert('Biến thể này đã có trong danh sách');
    }
    const capacityLabel = variant.capacity ? `${variant.capacity.value}${variant.capacity.unit}` : `ID: ${variant.id}`;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: product.id,
        product_variant_id: variant.id,
        sale_price: variant.sale_price || variant.price || '',
        quantity: '',
        _temp_name: product.name,
        _temp_variant: capacityLabel,
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = [...form.items];
    newItems.splice(index, 1);
    setForm({ ...form, items: newItems });
  };

  const formatDate = (d) => new Date(d).toLocaleString('vi-VN');

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Flash Sale</h1>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-plus-lg" />
          Thêm Chương trình
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm tên chương trình..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '300px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-input"
          style={{ width: '200px' }}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="active">Hoạt động (Active)</option>
          <option value="inactive">Đã Tắt (Inactive)</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên chương trình</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th>Số sản phẩm</th>
              <th>Trạng thái</th>
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
              : (sales || []).map(sale => (
                <tr key={sale.id}>
                  <td>#{sale.id}</td>
                  <td style={{ fontWeight: 600 }}>{sale.name}</td>
                  <td>{formatDate(sale.start_time)}</td>
                  <td>{formatDate(sale.end_time)}</td>
                  <td>{sale.items?.length || 0} SP</td>
                  <td>
                    <button
                      className="action-btn"
                      style={{
                        background: sale.status === 'active' ? '#f0fdf4' : '#f9fafb',
                        color: sale.status === 'active' ? '#166534' : '#6b7280',
                        border: `1px solid ${sale.status === 'active' ? '#bbf7d0' : '#e4e7ec'}`,
                      }}
                      onClick={() => handleToggleStatus(sale)}
                    >
                      {sale.status === 'active' ? 'Đang bật' : 'Đang tắt'}
                    </button>
                  </td>
                  <td>
                    <button className="action-btn action-btn-edit" onClick={() => openEdit(sale)}>Sửa</button>
                  </td>
                </tr>
              ))
            }
            {!loading && (sales || []).length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Chưa có flash sale nào</td></tr>
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

      {/* Modal Edit/Create */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 860, boxShadow: 'var(--shadow-xl)', marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20 }}>{editItem ? 'Sửa Flash Sale' : 'Tạo Flash Sale'}</h2>
            
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tên chương trình</label>
                  <input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Bắt đầu</label>
                  <input required type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Kết thúc</label>
                  <input required type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Sản phẩm trong Flash Sale</h3>
                
                {form.items.length > 0 && (
                  <table className="admin-table" style={{ marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Biến thể</th>
                        <th>Giá Sale (đ)</th>
                        <th>SL (0=vô hạn)</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index}>
                          <td style={{ fontWeight: 500 }}>{item._temp_name}</td>
                          <td style={{ color: '#6b7280', fontSize: 13 }}>
                            {item._temp_variant || '—'}
                          </td>
                          <td>
                            <input required type="number" min="0" className="form-input" style={{ padding: '6px 12px' }} value={item.sale_price} onChange={e => updateItem(index, 'sale_price', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" className="form-input" style={{ padding: '6px 12px' }} value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <button type="button" className="action-btn action-btn-danger" onClick={() => removeItem(index)}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div>
                  <label className="form-label">Chọn sản phẩm & biến thể</label>
                  <input
                    className="form-input"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchProduct}
                    onChange={handleSearchProduct}
                    style={{ marginBottom: 12 }}
                  />
                  
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa' }}>
                    {(products || []).length === 0 && (
                      <div style={{ padding: 24, color: '#9ca3af', textAlign: 'center' }}>
                        Không tìm thấy sản phẩm nào
                      </div>
                    )}
                    {(products || []).map(p => {
                      // Get first image from first variant or product
                      const imgUrl = p.image || p.variants?.[0]?.images?.[0] || null;
                      return (
                        <div key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          {/* Product header row */}
                          <div style={{ padding: '10px 14px', background: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 40, height: 40, background: '#e5e7eb', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 18 }}>🖼</div>
                            )}
                            <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{p.name}</span>
                          </div>
                          {/* Variants with checkboxes */}
                          {(p.variants || []).length > 0 ? (
                            (p.variants || []).map(v => {
                              const capacityLabel = v.capacity ? `${v.capacity.value}${v.capacity.unit}` : `Biến thể #${v.id}`;
                              const alreadyAdded = form.items.some(i => i.product_variant_id === v.id);
                              return (
                                <div key={v.id} style={{
                                  padding: '8px 14px 8px 24px',
                                  borderTop: '1px solid #f3f4f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  background: alreadyAdded ? '#f0fdf4' : '#fff',
                                  transition: 'background 0.15s',
                                }}>
                                  <input
                                    type="checkbox"
                                    id={`v-${v.id}`}
                                    checked={alreadyAdded}
                                    onChange={() => alreadyAdded
                                      ? setForm(prev => ({ ...prev, items: prev.items.filter(i => i.product_variant_id !== v.id) }))
                                      : addVariantItem(p, v)
                                    }
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#C9956A', flexShrink: 0 }}
                                  />
                                  <label htmlFor={`v-${v.id}`} style={{ flex: 1, cursor: 'pointer', fontSize: 13 }}>
                                    <span style={{ fontWeight: 500, color: '#374151' }}>📦 {capacityLabel}</span>
                                    <span style={{ color: '#6b7280', marginLeft: 8 }}>
                                      Giá gốc: {Number(v.sale_price || v.price || 0).toLocaleString()}đ
                                    </span>
                                  </label>
                                  {alreadyAdded && (
                                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>✓ Đã chọn</span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '8px 24px', fontSize: 12, color: '#9ca3af' }}>Không có biến thể</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {form.items.length > 0 && (
                    <p style={{ fontSize: 13, color: '#C9956A', marginTop: 8, fontWeight: 500 }}>
                      ✓ Đã chọn {form.items.length} biến thể — nhập giá Sale và số lượng ở bảng trên
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu chương trình'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSaleManagement;
