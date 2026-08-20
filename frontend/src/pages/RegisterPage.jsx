import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      login(res.token, res.user);
      toast.success('Đăng ký thành công! Chào mừng bạn đến với HQCosmetic.');
      navigate('/');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstMsg = Object.values(errors)[0]?.[0];
        toast.error(firstMsg || 'Đăng ký thất bại');
      } else {
        toast.error(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__right">
        <div className="auth-page__box">

          <div className="auth-page__header">
            <h1 className="auth-page__title">Đăng ký</h1>
            <p className="auth-page__subtitle">Tạo tài khoản mới</p>
          </div>

          <form className="auth-page__form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Họ tên</label>
              <input
                id="name"
                type="text"
                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                placeholder="Nguyễn Văn A"
                {...register('name', {
                  required: 'Họ tên là bắt buộc',
                  minLength: { value: 2, message: 'Tên tối thiểu 2 ký tự' },
                })}
              />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>

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
              <label className="form-label" htmlFor="password">Mật khẩu</label>
              <div className="form-input-wrap">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className={`form-input${errors.password ? ' form-input--error' : ''}`}
                  placeholder="Tối thiểu 8 ký tự"
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: { value: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                  })}
                />
                <button type="button" className="form-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw
                    ? <i className="bi bi-eye-slash" style={{ fontSize: 16 }} />
                    : <i className="bi bi-eye" style={{ fontSize: 16 }} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password_confirmation">Xác nhận mật khẩu</label>
              <input
                id="password_confirmation"
                type="password"
                className={`form-input${errors.password_confirmation ? ' form-input--error' : ''}`}
                placeholder="Nhập lại mật khẩu"
                {...register('password_confirmation', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (val) => val === password || 'Mật khẩu không khớp',
                })}
              />
              {errors.password_confirmation && (
                <span className="form-error">{errors.password_confirmation.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>

          <p className="auth-page__switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
