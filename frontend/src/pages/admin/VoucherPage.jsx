import { useState, useEffect } from 'react';
import { voucherApi } from '../../api/voucherApi';
import { useToast } from '../../context/ToastContext';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmtPrice = (v) =>
  v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const isExpired  = (d) => d && new Date(d) < new Date();
const isNotYet   = (d) => d && new Date(d) > new Date();

const getStatusLabel = (v) => {
  if (v.status !== 'active') return { label: 'Tạm dừng', cls: 'badge-neutral' };
  if (isExpired(v.end_date))  return { label: 'Hết hạn',  cls: 'badge-danger'  };
  if (isNotYet(v.start_date)) return { label: 'Chờ kích hoạt', cls: 'badge-warning' };
  return { label: 'Đang hoạt động', cls: 'badge-success' };
};

/* ─── Empty form state ────────────────────────────────────────── */
const EMPTY_FORM = {
  code: '', description: '',
  discount_type: 'fixed', discount_value: '',
  min_order_value: '', max_discount_amount: '',
  start_date: '', end_date: '',
  usage_limit: '', max_uses_per_user: '',
  status: 'active',
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const VoucherPage = () => {
  const [vouchers,    setVouchers]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});
  const toast = useToast();

  /* ── Data ─────────────────────────────────────────────────── */
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherApi.getAll();
      setVouchers(res.data || res || []);
    } catch {
      toast.error('Lỗi khi tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVouchers(); }, []);

  /* ── Filtered list ────────────────────────────────────────── */
  const filtered = vouchers.filter((v) => {
    if (filterStatus === 'all') return true;
    return getStatusLabel(v).label === filterStatus ||
           (filterStatus === 'active'   && v.status === 'active' && !isExpired(v.end_date) && !isNotYet(v.start_date)) ||
           (filterStatus === 'inactive' && (v.status !== 'active' || isExpired(v.end_date)));
  });

  /* ── Modal helpers ────────────────────────────────────────── */
  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingId(v.id);
    setFormData({
      code:               v.code,
      description:        v.description || '',
      discount_type:      v.discount_type,
      discount_value:     v.discount_value,
      min_order_value:    v.min_order_value || '',
      max_discount_amount:v.max_discount_amount || '',
      start_date:         v.start_date?.substring(0, 16) || '',
      end_date:           v.end_date?.substring(0, 16)   || '',
      usage_limit:        v.usage_limit || '',
      max_uses_per_user:  v.max_uses_per_user || '',
      status:             v.status,
    });
    setErrors({});
    setShowModal(true);
  };

  /* ── Submit ───────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      // Chuyển field rỗng thành null/0 đúng kiểu
      if (!payload.min_order_value)     payload.min_order_value     = 0;
      if (!payload.max_discount_amount) payload.max_discount_amount = null;
      if (!payload.usage_limit)         payload.usage_limit         = null;
      if (!payload.max_uses_per_user)   payload.max_uses_per_user   = null;
      if (!payload.description)         payload.description         = null;

      if (editingId) {
        await voucherApi.update(editingId, payload);
        toast.success('Cập nhật mã giảm giá thành công');
      } else {
        await voucherApi.create(payload);
        toast.success('Thêm mã giảm giá thành công');
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      // Hiển thị lỗi validation theo từng field
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        const mapped = {};
        Object.keys(serverErrors).forEach((k) => { mapped[k] = serverErrors[k][0]; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ───────────────────────────────────────────────── */
  const handleDelete = async (v) => {
    if (!window.confirm(`Xóa mã "${v.code}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await voucherApi.delete(v.id);
      toast.success('Đã xóa mã giảm giá');
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa mã giảm giá');
    }
  };

  /* ── Toggle Status ────────────────────────────────────────── */
  const handleToggle = async (v) => {
    try {
      await voucherApi.toggleStatus(v.id);
      toast.success(`Đã ${v.status === 'active' ? 'tạm dừng' : 'kích hoạt'} mã "${v.code}"`);
      fetchVouchers();
    } catch {
      toast.error('Không thể đổi trạng thái');
    }
  };

  /* ── Stats ────────────────────────────────────────────────── */
  const stats = {
    total:    vouchers.length,
    active:   vouchers.filter((v) => v.status === 'active' && !isExpired(v.end_date)).length,
    inactive: vouchers.filter((v) => v.status !== 'active' || isExpired(v.end_date)).length,
    used:     vouchers.reduce((s, v) => s + (v.used_count || 0), 0),
  };

  /* ─────────────────────────────────────────────────────────────
   | RENDER
   ───────────────────────────────────────────────────────────── */
  return (
    <div className="admin-page">

      {/* ── Header ── */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Quản lý Mã giảm giá</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Tạo và quản lý voucher / coupon cho khách hàng
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span style={{ fontSize: 18, marginRight: 6 }}>+</span> Thêm Voucher
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng mã', value: stats.total,    color: '#6366f1' },
          { label: 'Đang hoạt động', value: stats.active, color: '#22c55e' },
          { label: 'Tạm dừng / Hết hạn', value: stats.inactive, color: '#ef4444' },
          { label: 'Tổng lượt đã dùng', value: stats.used, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 8, height: 48, borderRadius: 4, background: s.color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="admin-card">

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'active', 'inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              style={{
                padding: '6px 14px', fontSize: 13, borderRadius: 20, border: '1px solid',
                cursor: 'pointer', fontWeight: filterStatus === f ? 600 : 400,
                background: filterStatus === f ? 'var(--color-primary)' : 'transparent',
                color:      filterStatus === f ? '#fff' : 'var(--color-text-secondary)',
                borderColor:filterStatus === f ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'all 0.15s',
              }}
            >
              {f === 'all' ? 'Tất cả' : f === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
            {filtered.length} mã
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div className="spinner-sm" style={{ margin: '0 auto', borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--color-primary)', width: 28, height: 28, borderWidth: 3 }} />
            <p style={{ marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã voucher</th>
                  <th>Loại giảm</th>
                  <th>Đơn tối thiểu</th>
                  <th>Thời hạn</th>
                  <th style={{ textAlign: 'center' }}>Lượt dùng</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const { label, cls } = getStatusLabel(v);
                  return (
                    <tr key={v.id}>
                      {/* Code + description */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <code style={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                            background: 'var(--color-gray-100)', padding: '2px 8px', borderRadius: 4,
                            letterSpacing: '0.08em', color: 'var(--color-text-primary)',
                          }}>{v.code}</code>
                          {v.description && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v.description}</span>
                          )}
                        </div>
                      </td>
                      {/* Discount */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                            {v.discount_type === 'fixed'
                              ? `−${fmtPrice(v.discount_value)}`
                              : `−${v.discount_value}%`}
                          </span>
                          {v.discount_type === 'percent' && v.max_discount_amount && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              Tối đa {fmtPrice(v.max_discount_amount)}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Min order */}
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                        {v.min_order_value ? fmtPrice(v.min_order_value) : 'Không giới hạn'}
                      </td>
                      {/* Dates */}
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <div>{fmtDate(v.start_date)}</div>
                        <div style={{ color: isExpired(v.end_date) ? 'var(--color-error)' : 'inherit' }}>
                          → {fmtDate(v.end_date)}
                        </div>
                      </td>
                      {/* Usage */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontWeight: 600 }}>
                            {v.used_count} / {v.usage_limit ?? '∞'}
                          </span>
                          {v.max_uses_per_user && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {v.max_uses_per_user}x/người
                            </span>
                          )}
                          {/* Progress bar */}
                          {v.usage_limit && (
                            <div style={{ width: 64, height: 4, background: 'var(--color-gray-100)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 2,
                                width: `${Math.min(100, (v.used_count / v.usage_limit) * 100)}%`,
                                background: v.used_count >= v.usage_limit ? '#ef4444' : '#22c55e',
                                transition: 'width 0.3s',
                              }} />
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Status badge */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${cls}`}>{label}</span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div className="admin-table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleToggle(v)}
                            title={v.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                          >
                            {v.status === 'active'
                              ? <i className="bi bi-pause-circle" style={{ fontSize: 15 }} />
                              : <i className="bi bi-play-circle" style={{ fontSize: 15 }} />}
                          </button>
                          <button className="btn-icon" onClick={() => openEdit(v)} title="Sửa">
                            <i className="bi bi-pencil" style={{ fontSize: 15 }} />
                          </button>
                          <button className="btn-icon text-danger" onClick={() => handleDelete(v)} title="Xóa">
                            <i className="bi bi-trash3" style={{ fontSize: 15 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
                      Chưa có mã giảm giá nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════
          MODAL: Add / Edit
      ═══════════════════════════════ */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                {editingId ? '✏️ Chỉnh sửa Voucher' : '➕ Thêm Voucher mới'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">

              {/* Mã code */}
              <div className="form-group">
                <label className="form-label">Mã code <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  className={`form-control${errors.code ? ' is-error' : ''}`}
                  placeholder="VD: SUMMER30, SALE50K"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }));
                    if (errors.code) setErrors((p) => ({ ...p, code: '' }));
                  }}
                  disabled={!!editingId}
                  required
                />
                {errors.code && <span className="form-error-text">{errors.code}</span>}
                <small style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                  Chỉ dùng chữ in hoa, số và dấu gạch dưới (A-Z, 0-9, _)
                </small>
              </div>

              {/* Mô tả */}
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="VD: Giảm 50k cho đơn từ 300k — Hè 2026"
                  value={formData.description}
                  onChange={set('description')}
                />
              </div>

              {/* Loại & Mức giảm */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Loại giảm giá <span style={{ color: 'red' }}>*</span></label>
                  <select className="form-control" value={formData.discount_type} onChange={set('discount_type')}>
                    <option value="fixed">Số tiền cố định (₫)</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Mức giảm {formData.discount_type === 'fixed' ? '(₫)' : '(%)'} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-control${errors.discount_value ? ' is-error' : ''}`}
                    placeholder={formData.discount_type === 'fixed' ? 'VD: 50000' : 'VD: 10 (%)'}
                    min="0"
                    max={formData.discount_type === 'percent' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={set('discount_value')}
                    required
                  />
                  {errors.discount_value && <span className="form-error-text">{errors.discount_value}</span>}
                </div>
              </div>

              {/* Min order & Max discount (chỉ hiện max khi percent) */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Đơn hàng tối thiểu (₫)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Để trống = không giới hạn"
                    min="0"
                    value={formData.min_order_value}
                    onChange={set('min_order_value')}
                  />
                </div>
                {formData.discount_type === 'percent' && (
                  <div className="form-group">
                    <label className="form-label">Giảm tối đa (₫)</label>
                    <input
                      type="number"
                      className={`form-control${errors.max_discount_amount ? ' is-error' : ''}`}
                      placeholder="Để trống = không giới hạn"
                      min="0"
                      value={formData.max_discount_amount}
                      onChange={set('max_discount_amount')}
                    />
                    {errors.max_discount_amount && <span className="form-error-text">{errors.max_discount_amount}</span>}
                  </div>
                )}
              </div>

              {/* Thời hạn */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Từ ngày <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="datetime-local"
                    className={`form-control${errors.start_date ? ' is-error' : ''}`}
                    value={formData.start_date}
                    onChange={set('start_date')}
                    required
                  />
                  {errors.start_date && <span className="form-error-text">{errors.start_date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Đến ngày <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="datetime-local"
                    className={`form-control${errors.end_date ? ' is-error' : ''}`}
                    value={formData.end_date}
                    min={formData.start_date}
                    onChange={set('end_date')}
                    required
                  />
                  {errors.end_date && <span className="form-error-text">{errors.end_date}</span>}
                </div>
              </div>

              {/* Usage limits */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tổng lượt dùng (hệ thống)</label>
                  <input
                    type="number"
                    className={`form-control${errors.usage_limit ? ' is-error' : ''}`}
                    placeholder="Để trống = không giới hạn"
                    min="1"
                    value={formData.usage_limit}
                    onChange={set('usage_limit')}
                  />
                  {errors.usage_limit && <span className="form-error-text">{errors.usage_limit}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Số lần / mỗi khách</label>
                  <input
                    type="number"
                    className={`form-control${errors.max_uses_per_user ? ' is-error' : ''}`}
                    placeholder="Để trống = không giới hạn"
                    min="1"
                    value={formData.max_uses_per_user}
                    onChange={set('max_uses_per_user')}
                  />
                  {errors.max_uses_per_user && <span className="form-error-text">{errors.max_uses_per_user}</span>}
                </div>
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label">Trạng thái <span style={{ color: 'red' }}>*</span></label>
                <select className="form-control" value={formData.status} onChange={set('status')}>
                  <option value="active">Kích hoạt ngay</option>
                  <option value="inactive">Tạm dừng (chưa kích hoạt)</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-sm" style={{ marginRight: 8 }}/> Đang lưu...</>
                    : editingId ? 'Lưu thay đổi' : 'Tạo Voucher'}
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
