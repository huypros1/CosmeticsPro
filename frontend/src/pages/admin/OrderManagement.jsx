import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import { paymentApi } from '../../api/paymentApi';

// Luồng trạng thái hợp lệ (phải khớp backend)
const STATUS_ORDER = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };

const STATUS_LABELS = {
  pending:    { label: 'Chờ xử lý',       color: '#f59e0b', bg: '#fffbeb' },
  confirmed:  { label: 'Đã xác nhận',     color: '#3b82f6', bg: '#eff6ff' },
  processing: { label: 'Đang chuẩn bị',   color: '#8b5cf6', bg: '#f5f3ff' },
  shipped:    { label: 'Đang giao',        color: '#06b6d4', bg: '#ecfeff' },
  delivered:  { label: 'Đã giao',          color: '#10b981', bg: '#ecfdf5' },
  cancelled:  { label: 'Đã hủy',           color: '#ef4444', bg: '#fef2f2' },
};

const PAYMENT_LABELS = {
  unpaid:   { label: 'Chưa TT',    color: '#f59e0b' },
  paid:     { label: '✅ Đã TT',   color: '#10b981' },
  refunded: { label: '↩ Hoàn tiền', color: '#8b5cf6' },
};

const PAYMENT_METHOD_LABELS = { cod: 'COD', vietqr: 'VietQR', momo: 'MoMo', vnpay: 'VNPay' };

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getOrders({
        search,
        status: statusFilter,
        payment_status: paymentStatusFilter,
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 400);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  /* ── Chuyển trạng thái đơn hàng ── */
  const updateStatus = async (order, newStatus) => {
    if (newStatus === order.status) return;

    const st = STATUS_LABELS[newStatus]?.label || newStatus;
    if (!window.confirm(`Chuyển đơn #${order.id} sang trạng thái "${st}"?`)) return;

    try {
      setUpdatingId(order.id);
      await adminApi.updateOrderStatus(order.id, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
      alert(`❌ ${msg}`);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Xác nhận thanh toán (QR / COD) ── */
  const confirmPayment = async (order) => {
    const method = PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method;
    if (!window.confirm(`Xác nhận đơn #${order.id} đã nhận được thanh toán qua ${method}?`)) return;
    try {
      setConfirmingId(order.id);
      await paymentApi.adminConfirmPayment(order.id);
      await fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán';
      alert(`❌ ${msg}`);
    } finally {
      setConfirmingId(null);
    }
  };

  /* ── Đánh dấu hoàn tiền ── */
  const markRefunded = async (order) => {
    if (!window.confirm(`Đánh dấu đơn #${order.id} đã hoàn tiền?`)) return;
    try {
      setUpdatingId(order.id);
      await adminApi.updateOrderStatus(order.id, { payment_status: 'refunded' });
      await fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      alert(`❌ ${msg}`);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Disable logic cho select trạng thái ── */
  const isStatusDisabled = (currentStatus, optionStatus) => {
    if (currentStatus === 'cancelled') return true;           // Đơn đã hủy: lock toàn bộ
    if (currentStatus === 'delivered') return true;           // Đơn đã giao: lock toàn bộ
    if (optionStatus === 'cancelled' && ['shipped', 'delivered'].includes(currentStatus)) return true;
    if (optionStatus !== 'cancelled' && currentStatus !== 'cancelled') {
      const cur = STATUS_ORDER[currentStatus] ?? -1;
      const opt = STATUS_ORDER[optionStatus] ?? -1;
      if (opt !== -1 && cur !== -1 && opt < cur) return true; // Không cho lùi
    }
    return false;
  };

  const openOrderDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await adminApi.getOrder(id);
      setSelectedOrder(res);
    } catch (err) {
      alert('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Đơn hàng</h1>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm mã đơn, tên KH, email, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '280px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="processing">Đang chuẩn bị</option>
          <option value="shipped">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Thanh toán</option>
          {/* Đúng giá trị theo DB: unpaid / paid / refunded */}
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="refunded">Đã hoàn tiền</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Ngày đặt</th>
              <th style={{ minWidth: 180 }}>Trạng thái đơn</th>
              <th>Thao tác TT</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                ))}</tr>
              ))
              : orders.map(order => {
                const pm = PAYMENT_LABELS[order.payment_status] || { label: order.payment_status, color: '#6b7280' };
                const isLocked = order.status === 'cancelled' || order.status === 'delivered';
                const isUpdating = updatingId === order.id || confirmingId === order.id;

                return (
                  <tr key={order.id} style={{ opacity: isUpdating ? 0.6 : 1, transition: 'opacity .2s' }}>
                    <td>
                      <span style={{ fontWeight: 700 }}>#{order.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{order.user?.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{order.recipient_phone}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(order.total_amount)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pm.color }}>
                          {pm.label}
                        </span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>
                          {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* ── Select trạng thái đơn ── */}
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order, e.target.value)}
                        disabled={isLocked || isUpdating}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${STATUS_LABELS[order.status]?.color || '#ccc'}`,
                          backgroundColor: STATUS_LABELS[order.status]?.bg || '#f9fafb',
                          color: STATUS_LABELS[order.status]?.color || '#374151',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          opacity: isLocked ? 0.7 : 1,
                        }}
                      >
                        <option value="pending"    disabled={isStatusDisabled(order.status, 'pending')}>Chờ xử lý</option>
                        <option value="confirmed"  disabled={isStatusDisabled(order.status, 'confirmed')}>Đã xác nhận</option>
                        <option value="processing" disabled={isStatusDisabled(order.status, 'processing')}>Đang chuẩn bị</option>
                        <option value="shipped"    disabled={isStatusDisabled(order.status, 'shipped')}>Đang giao</option>
                        <option value="delivered"  disabled={isStatusDisabled(order.status, 'delivered')}>Đã giao</option>
                        <option value="cancelled"  disabled={isStatusDisabled(order.status, 'cancelled')}>Đã hủy</option>
                      </select>
                    </td>

                    {/* ── Thao tác thanh toán ── */}
                    <td>
                      {order.payment_status === 'refunded' ? (
                        <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>↩ Đã hoàn tiền</span>

                      ) : order.payment_status === 'paid' ? (
                        // Đơn bị hủy + đã paid → cho phép đánh refunded
                        order.status === 'cancelled' ? (
                          <button
                            onClick={() => markRefunded(order)}
                            disabled={isUpdating}
                            style={{
                              padding: '5px 10px', borderRadius: 6, border: '1px solid #c084fc',
                              background: '#faf5ff', color: '#7c3aed', cursor: 'pointer',
                              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                            }}
                          >
                            ↩ Đánh hoàn tiền
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✅ Đã thanh toán</span>
                        )

                      ) : order.status === 'cancelled' ? (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>

                      ) : (
                        // Chưa thanh toán + chưa hủy → nút xác nhận
                        <button
                          onClick={() => confirmPayment(order)}
                          disabled={confirmingId === order.id}
                          style={{
                            padding: '5px 10px', borderRadius: 6, border: 'none',
                            background: confirmingId === order.id ? '#94a3b8' : '#10b981',
                            color: '#fff', cursor: confirmingId === order.id ? 'wait' : 'pointer',
                            fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        >
                          {confirmingId === order.id
                            ? '...'
                            : `✅ Nhận TT (${PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method})`}
                        </button>
                      )}
                    </td>
                    <td>
                      <button 
                        className="action-btn"
                        onClick={() => openOrderDetails(order.id)}
                        disabled={loadingDetails}
                      >
                        <i className="bi bi-eye"></i> Xem
                      </button>
                    </td>
                  </tr>
                );
              })
            }
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  Không có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Chi tiết Đơn hàng #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#374151' }}>Thông tin Khách hàng</h3>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Tên KH:</strong> {selectedOrder.user?.name}</p>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Email:</strong> {selectedOrder.user?.email}</p>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Người nhận:</strong> {selectedOrder.recipient_name}</p>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>SĐT:</strong> {selectedOrder.recipient_phone}</p>
                </div>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#374151' }}>Địa chỉ Giao hàng</h3>
                  <p style={{ margin: '4px 0', fontSize: '13px' }}>{selectedOrder.shipping_address}</p>
                  {selectedOrder.note && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#b45309' }}><strong>Ghi chú:</strong> {selectedOrder.note}</p>}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#374151' }}>Danh sách Sản phẩm</h3>
                <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}>
                      <th style={{ padding: '8px' }}>Sản phẩm</th>
                      <th style={{ padding: '8px' }}>Dung tích</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>SL</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.order_items?.map(item => (
                      <tr key={item.id}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: 600 }}>{item.variant?.product?.name}</div>
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                          {item.variant?.capacity?.value} {item.variant?.capacity?.unit}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{formatPrice(item.price)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>x{item.quantity}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <div style={{ width: '300px', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span>Tạm tính:</span>
                    <span>{formatPrice(selectedOrder.total_amount - selectedOrder.shipping_fee + (selectedOrder.voucher ? selectedOrder.voucher.discount_amount : 0))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span>Phí vận chuyển:</span>
                    <span>{formatPrice(selectedOrder.shipping_fee)}</span>
                  </div>
                  {selectedOrder.voucher && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#059669' }}>
                      <span>Voucher giảm:</span>
                      <span>-{formatPrice(selectedOrder.voucher.discount_amount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontWeight: 700, fontSize: '15px' }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#ef4444' }}>{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', background: '#f9fafb' }}>
              <button onClick={() => setSelectedOrder(null)} className="action-btn" style={{ padding: '8px 16px', fontWeight: 600 }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
