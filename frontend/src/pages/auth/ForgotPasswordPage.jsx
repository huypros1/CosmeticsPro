import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const toast = useToast();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authApi.forgotPassword(data);
      setSuccessMessage(res.message || 'Đường dẫn khôi phục mật khẩu đã được gửi đến email của bạn.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: 480 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="page-title">Quên mật khẩu?</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
          Nhập email bạn đã đăng ký, chúng tôi sẽ gửi cho bạn đường dẫn để đặt lại mật khẩu.
        </p>
      </div>

      {successMessage ? (
        <div style={{ 
          padding: 24, 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          borderRadius: 8, 
          color: '#166534',
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>Kiểm tra email của bạn</p>
          <p style={{ fontSize: 14 }}>{successMessage}</p>
          <Link to="/login" className="btn btn-outline" style={{ marginTop: 24, display: 'inline-flex' }}>
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="Nhập email của bạn"
              {...register('email', { required: 'Vui lòng nhập email' })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Gửi link khôi phục'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
            <Link to="/login" style={{ color: 'var(--color-text-secondary)' }}>
              ← Quay lại trang đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
