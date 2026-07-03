import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';

const ResetPasswordPage = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      toast.error('Đường dẫn khôi phục không hợp lệ');
      navigate('/login');
    }
  }, [token, email, navigate, toast]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await authApi.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã khôi phục không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '80px 24px', maxWidth: 480 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="page-title">Đặt lại mật khẩu</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center', padding: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#166534' }}>
          <p style={{ fontWeight: 500, marginBottom: 16 }}>✅ Mật khẩu của bạn đã được đặt lại thành công.</p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email || ''}
              disabled
              style={{ background: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <input
              type="password"
              className="form-input"
              placeholder="Tối thiểu 8 ký tự"
              {...register('password', { 
                required: 'Vui lòng nhập mật khẩu mới',
                minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' }
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              className="form-input"
              placeholder="Nhập lại mật khẩu mới"
              {...register('password_confirmation', { 
                required: 'Vui lòng xác nhận mật khẩu',
                validate: (val) => val === watch('password') || 'Mật khẩu xác nhận không khớp'
              })}
            />
            {errors.password_confirmation && <span className="form-error">{errors.password_confirmation.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPasswordPage;
