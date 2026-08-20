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
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã khôi phục không hợp lệ hoặc đã hết hạn.');
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

          {success ? (
            /* ── Success State ── */
            <div className="forgot-pw-success">
              <div className="forgot-pw-success__icon forgot-pw-success__icon--check">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="forgot-pw-success__title">Đặt lại thành công!</h2>
              <p className="forgot-pw-success__text">
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="auth-page__header">
                <h1 className="auth-page__title">Đặt lại mật khẩu</h1>
                <p className="auth-page__subtitle">
                  Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>
                </p>
              </div>

              <form className="auth-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* New Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Mật khẩu mới</label>
                  <div className="form-input-wrap">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className={`form-input${errors.password ? ' form-input--error' : ''}`}
                      placeholder="Tối thiểu 8 ký tự"
                      {...register('password', {
                        required: 'Vui lòng nhập mật khẩu mới',
                        minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                      })}
                    />
                    <button
                      type="button"
                      className="form-pw-toggle"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span className="form-error">{errors.password.message}</span>}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password_confirmation">Xác nhận mật khẩu mới</label>
                  <div className="form-input-wrap">
                    <input
                      id="password_confirmation"
                      type={showPwConfirm ? 'text' : 'password'}
                      className={`form-input${errors.password_confirmation ? ' form-input--error' : ''}`}
                      placeholder="Nhập lại mật khẩu mới"
                      {...register('password_confirmation', {
                        required: 'Vui lòng xác nhận mật khẩu',
                        validate: (val) => val === watch('password') || 'Mật khẩu xác nhận không khớp',
                      })}
                    />
                    <button
                      type="button"
                      className="form-pw-toggle"
                      onClick={() => setShowPwConfirm(!showPwConfirm)}
                      aria-label={showPwConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPwConfirm ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && <span className="form-error">{errors.password_confirmation.message}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="spinner-sm" />
                      Đang lưu...
                    </span>
                  ) : 'Lưu mật khẩu mới'}
                </button>
              </form>

              <p className="auth-page__switch">
                <Link to="/login">← Quay lại đăng nhập</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
