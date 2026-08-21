import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const SePayCallbackPage = ({ type }) => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      axiosClient.get(`/orders/${orderId}`)
        .then(res => setOrder(res.data ?? res))
        .catch(() => {});

      // Nếu thành công, gọi backend cập nhật payment_status
      if (type === 'success') {
        axiosClient.post(`/payment/sepay/callback`, {
          order_id: orderId,
          status: 'paid',
        }).catch(() => {});
      }
    }
  }, [orderId, type]);

  const config = {
    success: {
      icon: '✅',
      color: '#10b981',
      bg: '#d1fae5',
      title: 'Thanh toán thành công!',
      desc: 'Đơn hàng của bạn đã được thanh toán. Chúng tôi sẽ xử lý và giao hàng sớm nhất.',
    },
    error: {
      icon: '❌',
      color: '#ef4444',
      bg: '#fee2e2',
      title: 'Thanh toán thất bại',
      desc: 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.',
    },
    cancel: {
      icon: '⚠️',
      color: '#f59e0b',
      bg: '#fef3c7',
      title: 'Đã hủy thanh toán',
      desc: 'Bạn đã hủy giao dịch. Đơn hàng vẫn được lưu, bạn có thể thanh toán sau.',
    },
  };

  const c = config[type] || config.error;

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '48px 40px',
        maxWidth: 500, width: '100%', textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>{c.icon}</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>
          {c.title}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          {c.desc}
        </p>

        {orderId && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Mã đơn hàng</p>
            <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#111827', fontFamily: 'monospace', fontSize: 16 }}>
              #{orderId}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              style={{
                padding: '11px 24px', background: '#1a1a1a', color: '#fff',
                borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
              }}
            >
              Xem đơn hàng
            </Link>
          )}
          <Link
            to="/"
            style={{
              padding: '11px 24px', background: '#f3f4f6', color: '#374151',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SePayCallbackPage;
