import { useState, useEffect } from 'react';
import { voucherApi } from '../../api/voucherApi';
import { useToast } from '../../context/ToastContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN');
};

const formatPrice = (price) => {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'fixed',
    discount_value: '',
    min_order_value: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    usage_limit: '',
    status: 'active'
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getAll();
      setVouchers(res.data || res || []);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpenModal = (voucher = null) => {
    if (voucher) {
      setEditingId(voucher.id);
      setFormData({
        code: voucher.code,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        min_order_value: voucher.min_order_value || '',
        max_discount_amount: voucher.max_discount_amount || '',
        start_date: voucher.start_date.substring(0, 16),
        end_date: voucher.end_date.substring(0, 16),
        usage_limit: voucher.usage_limit || '',
        status: voucher.status
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        discount_type: 'fixed',
        discount_value: '',
        min_order_value: '',
        max_discount_amount: '',
        start_date: '',
        end_date: '',
        usage_limit: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // clean up empty string to null for optional numbers
      const payload = { ...formData };
      if (payload.min_order_value === '') payload.min_order_value = 0;
      if (payload.max_discount_amount === '') payload.max_discount_amount = null;
      if (payload.usage_limit === '') payload.usage_limit = null;

      if (editingId) {
        await voucherApi.update(editingId, payload);
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await voucherApi.create(payload);
        toast.success('Thêm mã giảm giá thành công');
      }
      setShowModal(false);
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
      try {
        await voucherApi.delete(id);
        toast.success('Đã xóa mã giảm giá');
        fetchVouchers();
      } catch (error) {
        toast.error('Lỗi khi xóa mã giảm giá');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await voucherApi.toggleStatus(id);
      toast.success('Đã thay đổi trạng thái');
      fetchVouchers();
    } catch (error) {
      toast.error('Lỗi khi đổi trạng thái');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Mã giảm giá</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Thêm Voucher
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Loại/Mức giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Hạn sử dụng</th>
                  <th>Lượt dùng</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map(v => (
                  <tr key={v.id}>
                    <td><strong>{v.code}</strong></td>
                    <td>
                      {v.discount_type === 'fixed' 
                        ? formatPrice(v.discount_value) 
                        : `${v.discount_value}% ${v.max_discount_amount ? `(Tối đa ${formatPrice(v.max_discount_amount)})` : ''}`
                      }
                    </td>
                    <td>{formatPrice(v.min_order_value)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      Từ: {formatDate(v.start_date)}<br />
                      Đến: {formatDate(v.end_date)}
                    </td>
                    <td>{v.used_count} / {v.usage_limit || '∞'}</td>
                    <td>
                      <span className={`badge ${v.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {v.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button className="btn-icon" onClick={() => handleToggleStatus(v.id)} title="Đổi trạng thái">
                          🔄
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenModal(v)} title="Sửa">
                          ✏️
                        </button>
                        <button className="btn-icon text-danger" onClick={() => handleDelete(v.id)} title="Xóa">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">Chưa có mã giảm giá nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h2 className="modal-title">{editingId ? 'Sửa Voucher' : 'Thêm Voucher'}</h2>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label className="form-label">Mã Code *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Loại giảm giá</label>
                  <select
                    className="form-control"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                  >
                    <option value="fixed">Giảm số tiền cố định</option>
                    <option value="percent">Giảm theo %</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mức giảm *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Đơn tối thiểu (₫)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({...formData, min_order_value: e.target.value})}
                  />
                </div>
                {formData.discount_type === 'percent' && (
                  <div className="form-group">
                    <label className="form-label">Giảm tối đa (₫)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({...formData, max_discount_amount: e.target.value})}
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giới hạn số lần dùng</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Để trống nếu không giới hạn"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherPage;
