import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authApi.login(data);
      login(res.token, res.user);
      toast.success(`Chào mừng, ${res.user.name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__right">
        <div className="auth-page__box">

          <div className="auth-page__header">
            <h1 className="auth-page__title">Đăng nhập</h1>
            <p className="auth-page__subtitle">Chào mừng trở lại</p>
          </div>

          <form className="auth-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`form-input${errors.email ? ' form-input--error' : ''}`}
                placeholder="your@email.com"
                {...register('email', {
                  required: 'Email là bắt buộc',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ' },
                })}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Mật khẩu</label>
                <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>Quên mật khẩu?</Link>
              </div>
              <div className="form-input-wrap">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' form-input--error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                  })}
                />
                <button
                  type="button"
                  className="form-pw-toggle"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw
                    ? <i className="bi bi-eye-slash" style={{ fontSize: 16 }} />
                    : <i className="bi bi-eye" style={{ fontSize: 16 }} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="auth-page__switch">
            Chưa có tài khoản?{' '}
            <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
