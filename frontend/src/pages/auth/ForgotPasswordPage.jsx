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
    <div className="auth-page">
      <div className="auth-page__right">
        <div className="auth-page__box">

          {/* Logo */}
          <div className="auth-page__logo">
            <Link to="/">
              <span className="auth-logo-text">HQ</span>
              <span className="auth-logo-accent">COSMETICS</span>
            </Link>
          </div>

          {successMessage ? (
            /* ── Success State ── */
            <div className="forgot-pw-success">
              <div className="forgot-pw-success__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <h2 className="forgot-pw-success__title">Kiểm tra email của bạn</h2>
              <p className="forgot-pw-success__text">{successMessage}</p>
              <p className="forgot-pw-success__note">
                Không thấy email? Kiểm tra thư mục <strong>Spam</strong> hoặc thử lại sau vài phút.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
                ← Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="auth-page__header">
                <h1 className="auth-page__title">Quên mật khẩu?</h1>
                <p className="auth-page__subtitle">
                  Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
                </p>
              </div>

              <form className="auth-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Địa chỉ Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-input${errors.email ? ' form-input--error' : ''}`}
                    placeholder="your@email.com"
                    {...register('email', {
                      required: 'Vui lòng nhập email',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
                    })}
                  />
                  {errors.email && <span className="form-error">{errors.email.message}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="spinner-sm" />
                      Đang gửi...
                    </span>
                  ) : 'Gửi link khôi phục'}
                </button>
              </form>

              <p className="auth-page__switch">
                Nhớ ra rồi?{' '}
                <Link to="/login">Đăng nhập ngay</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
