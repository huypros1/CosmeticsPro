import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';

const FlashSaleManagement = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

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
      const res = await adminApi.getFlashSales({ page: p });
      setSales(res.data.data);
      setMeta({ current_page: res.data.current_page, last_page: res.data.last_page });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(page); }, [page]);

  const fetchProducts = async (search = '') => {
    try {
      const res = await adminApi.getProducts({ search, per_page: 50 });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
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
      const fullSale = res.data;
      // format datetime for input[type="datetime-local"]
      const formatDT = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      setForm({
        name: fullSale.name,
        start_time: formatDT(fullSale.start_time),
        end_time: formatDT(fullSale.end_time),
        status: fullSale.status,
        items: fullSale.items.map(i => ({
          product_id: i.product_id,
          product_variant_id: i.product_variant_id,
          sale_price: i.sale_price,
          quantity: i.quantity,
          _temp_name: i.product?.name,
        })),
      });
      setShowModal(true);
    } catch {
      alert('Không thể tải thông tin');
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

  const addItem = (product) => {
    if (form.items.find(i => i.product_id === product.id)) {
      return alert('Sản phẩm đã có trong danh sách');
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: product.id,
        product_variant_id: null,
        sale_price: '',
        quantity: '',
        _temp_name: product.name,
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý Flash Sale</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Tạo Flash Sale</button>
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
              : sales.map(sale => (
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
            {!loading && sales.length === 0 && (
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
                        <th>Giá Sale (đ)</th>
                        <th>Số lượng (0=ko giới hạn)</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item._temp_name}</td>
                          <td>
                            <input required type="number" min="0" className="form-input" style={{ padding: '6px 12px' }} value={item.sale_price} onChange={e => updateItem(index, 'sale_price', e.target.value)} />
                          </td>
                          <td>
                            <input type="number" min="0" className="form-input" style={{ padding: '6px 12px' }} value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                          </td>
                          <td>
                            <button type="button" className="action-btn action-btn-danger" onClick={() => removeItem(index)}>X</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div>
                  <label className="form-label">Thêm sản phẩm (Tìm kiếm)</label>
                  <input className="form-input" placeholder="Nhập tên sản phẩm..." value={searchProduct} onChange={handleSearchProduct} style={{ marginBottom: 12 }} />
                  
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    {products.map(p => (
                      <div key={p.id} style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{p.name} (Giá gốc: {Number(p.price || 0).toLocaleString()}đ)</span>
                        <button type="button" className="btn btn-sm" style={{ background: '#f3f4f6', color: '#111827', padding: '4px 12px', borderRadius: 4 }} onClick={() => addItem(p)}>Thêm</button>
                      </div>
                    ))}
                    {products.length === 0 && <div style={{ padding: 12, color: '#6b7280', textAlign: 'center' }}>Không tìm thấy sản phẩm</div>}
                  </div>
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
