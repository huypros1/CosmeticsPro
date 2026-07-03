import { useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { adminApi } from '../../api/adminApi';

const LOG_TESTS = [
  { key: 'orders', label: 'Đơn hàng', fn: () => adminApi.getOrders({ page: 1 }) },
  { key: 'products', label: 'Sản phẩm', fn: () => adminApi.getProducts({ page: 1 }) },
  { key: 'categories', label: 'Danh mục', fn: () => adminApi.getCategories({ page: 1 }) },
  { key: 'brands', label: 'Thương hiệu', fn: () => adminApi.getBrands({ page: 1 }) },
  { key: 'users', label: 'Người dùng', fn: () => adminApi.getUsers({ page: 1 }) },
  { key: 'posts', label: 'Bài viết', fn: () => adminApi.getPosts({ page: 1 }) },
  { key: 'reviews', label: 'Đánh giá', fn: () => adminApi.getReviews({ page: 1 }) },
  { key: 'flash-sales', label: 'Flash Sale', fn: () => adminApi.getFlashSales({ page: 1 }) },
  { key: 'dashboard', label: 'Dashboard', fn: () => adminApi.getDashboard() },
];

const ReadLog = () => {
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState({});

  const runTest = async (key, fn, label) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    const start = Date.now();
    try {
      const res = await fn();
      const elapsed = Date.now() - start;
      setLogs(prev => ({
        ...prev,
        [key]: {
          status: 'success',
          time: elapsed,
          label,
          type: typeof res,
          isArray: Array.isArray(res),
          keys: res && typeof res === 'object' ? Object.keys(res) : [],
          dataLength: res?.data?.length ?? (Array.isArray(res) ? res.length : null),
          raw: JSON.stringify(res, null, 2).slice(0, 2000),
        }
      }));
    } catch (err) {
      const elapsed = Date.now() - start;
      setLogs(prev => ({
        ...prev,
        [key]: {
          status: 'error',
          time: elapsed,
          label,
          error: err?.response?.status,
          message: err?.response?.data?.message || err?.message || 'Unknown error',
          raw: JSON.stringify(err?.response?.data, null, 2)?.slice(0, 1000) || err?.message,
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const runAll = async () => {
    for (const test of LOG_TESTS) {
      runTest(test.key, test.fn, test.label);
    }
  };

  const clearAll = () => setLogs({});

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>🔍 API Read Log</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Kiểm tra API response thực tế để debug lỗi data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={runAll}
            style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            ▶ Chạy tất cả
          </button>
          <button
            onClick={clearAll}
            style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            🗑 Xóa log
          </button>
        </div>
      </div>

      {/* Token info */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
        <strong>Token:</strong>{' '}
        <code style={{ wordBreak: 'break-all', fontSize: 11, color: '#065f46' }}>
          {localStorage.getItem('token') ? localStorage.getItem('token').slice(0, 50) + '...' : '❌ Không có token!'}
        </code>
      </div>

      {/* API Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LOG_TESTS.map(({ key, label, fn }) => {
          const log = logs[key];
          const isLoading = loading[key];
          return (
            <div key={key} style={{
              background: '#fff',
              border: `1px solid ${log?.status === 'error' ? '#fecaca' : log?.status === 'success' ? '#bbf7d0' : '#e5e7eb'}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                background: log?.status === 'error' ? '#fef2f2' : log?.status === 'success' ? '#f0fdf4' : '#f9fafb',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15 }}>
                    {isLoading ? '⏳' : log?.status === 'success' ? '✅' : log?.status === 'error' ? '❌' : '⚪'}
                  </span>
                  <strong style={{ fontSize: 14, color: '#111827' }}>{label}</strong>
                  <code style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>
                    /admin/{key}
                  </code>
                  {log && (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{log.time}ms</span>
                  )}
                </div>
                <button
                  onClick={() => runTest(key, fn, label)}
                  disabled={isLoading}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 600,
                    background: isLoading ? '#e5e7eb' : '#6366f1',
                    color: isLoading ? '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 6, cursor: isLoading ? 'wait' : 'pointer',
                  }}
                >
                  {isLoading ? 'Đang gọi...' : 'Gọi API'}
                </button>
              </div>

              {/* Result */}
              {log && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
                  {log.status === 'success' ? (
                    <div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: '#374151' }}>
                          <strong>Type:</strong> <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{log.isArray ? 'Array' : `Object`}</code>
                        </span>
                        <span style={{ fontSize: 12, color: '#374151' }}>
                          <strong>Keys:</strong> <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>{log.keys?.join(', ') || 'none'}</code>
                        </span>
                        {log.dataLength !== null && (
                          <span style={{ fontSize: 12, color: '#374151' }}>
                            <strong>data.length:</strong> <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 3, color: '#1d4ed8' }}>{log.dataLength}</code>
                          </span>
                        )}
                      </div>
                      <pre style={{
                        margin: 0, fontSize: 11, background: '#1e1e2e', color: '#cdd6f4',
                        padding: 12, borderRadius: 6, overflowX: 'auto', maxHeight: 300,
                        lineHeight: 1.5,
                      }}>
                        {log.raw}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: 8, display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>HTTP {log.error}</span>
                        <span style={{ fontSize: 12, color: '#7f1d1d' }}>{log.message}</span>
                      </div>
                      <pre style={{
                        margin: 0, fontSize: 11, background: '#fef2f2', color: '#991b1b',
                        padding: 12, borderRadius: 6, overflowX: 'auto', maxHeight: 200,
                      }}>
                        {log.raw}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadLog;
