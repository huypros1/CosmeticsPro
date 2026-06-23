import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { profileApi } from '../../api/profileApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('info');
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [showAddAddr, setShowAddAddr] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '' },
  });
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch: watchPw } = useForm();
  const { register: regAddr, handleSubmit: handleAddr, reset: resetAddr } = useForm();

  const newPassword = watchPw('password');

  useEffect(() => {
    profileApi.getAddresses()
      .then((d) => setAddresses(d.data || d || []))
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  }, []);

  const onSaveProfile = async (data) => {
    try {
      setSavingProfile(true);
      const res = await profileApi.updateProfile(data);
      const token = localStorage.getItem('token');
      login(token, res.user || { ...user, name: data.name });
      toast.success('Cập nhật thông tin thành công');
    } catch { toast.error('Không thể cập nhật thông tin'); }
    finally { setSavingProfile(false); }
  };

  const onChangePassword = async (data) => {
    try {
      setSavingPw(true);
      await profileApi.changePassword(data);
      toast.success('Đổi mật khẩu thành công');
      resetPw();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mật khẩu cũ không đúng');
    } finally { setSavingPw(false); }
  };

  const onAddAddress = async (data) => {
    try {
      setAddingAddr(true);
      const res = await profileApi.addAddress(data);
      setAddresses((prev) => [...prev, res.address || res]);
      setShowAddAddr(false);
      resetAddr();
      toast.success('Thêm địa chỉ thành công');
    } catch { toast.error('Không thể thêm địa chỉ'); }
    finally { setAddingAddr(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      await profileApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Đã xóa địa chỉ');
    } catch { toast.error('Không thể xóa địa chỉ'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await profileApi.setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, status: a.id === id })));
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch { toast.error('Có lỗi xảy ra'); }
  };

  const tabs = [
    { key: 'info', label: 'Thông tin cá nhân' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'security', label: 'Bảo mật' },
  ];

  return (
    <div className="profile-page">
      <div className="container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>Tài khoản của tôi</h1>

        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-user">
              <div className="profile-avatar">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} />
                  : <span>{user?.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="profile-user__name">{user?.name}</p>
                <p className="profile-user__email">{user?.email}</p>
              </div>
            </div>
            <nav className="profile-nav">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`profile-nav__item${tab === t.key ? ' active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="profile-content">
            {/* Info Tab */}
            {tab === 'info' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Thông tin cá nhân</h3>
                <form onSubmit={handleSubmit(onSaveProfile)}>
                  <div style={{ display: 'grid', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Họ tên</label>
                      <input className={`form-input${errors.name ? ' form-input--error' : ''}`}
                        {...register('name', { required: 'Họ tên là bắt buộc' })} />
                      {errors.name && <span className="form-error">{errors.name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" value={user?.email || ''} disabled
                        style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={savingProfile}>
                      {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Address Tab */}
            {tab === 'address' && (
              <div className="profile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 className="profile-card__title" style={{ margin: 0 }}>Địa chỉ giao hàng</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowAddAddr(!showAddAddr)}>
                    + Thêm địa chỉ
                  </button>
                </div>

                {showAddAddr && (
                  <form onSubmit={handleAddr(onAddAddress)} className="add-address-form" style={{ marginBottom: 24 }}>
                    <div className="form-group">
                      <label className="form-label">Địa chỉ</label>
                      <input className="form-input" placeholder="Số nhà, đường, phường, quận, tỉnh"
                        {...regAddr('address_line', { required: true })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Số điện thoại</label>
                      <input className="form-input" placeholder="0909 123 456" type="tel"
                        {...regAddr('phone', { required: true })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={addingAddr}>
                        {addingAddr ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddAddr(false)}>Hủy</button>
                    </div>
                  </form>
                )}

                {addrLoading ? (
                  <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
                ) : addresses.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    <div className="empty-state__icon">📍</div>
                    <p className="empty-state__title">Chưa có địa chỉ</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {addresses.map((addr) => (
                      <div key={addr.id} className="address-card">
                        <div className="address-card__info">
                          <p className="address-card__line">{addr.address_line}</p>
                          <p className="address-card__phone">{addr.phone}</p>
                          {addr.status && <span className="badge badge-accent">Mặc định</span>}
                        </div>
                        <div className="address-card__actions">
                          {!addr.status && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleSetDefault(addr.id)}>
                              Đặt mặc định
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }}
                            onClick={() => handleDelete(addr.id)}>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {tab === 'security' && (
              <div className="profile-card">
                <h3 className="profile-card__title">Đổi mật khẩu</h3>
                <form onSubmit={handlePw(onChangePassword)}>
                  <div style={{ display: 'grid', gap: 20, maxWidth: 400 }}>
                    <div className="form-group">
                      <label className="form-label">Mật khẩu hiện tại</label>
                      <input type="password" className="form-input"
                        {...regPw('current_password', { required: 'Bắt buộc' })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mật khẩu mới</label>
                      <input type="password" className="form-input"
                        {...regPw('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Xác nhận mật khẩu mới</label>
                      <input type="password" className="form-input"
                        {...regPw('password_confirmation', {
                          required: 'Bắt buộc',
                          validate: (v) => v === newPassword || 'Mật khẩu không khớp',
                        })} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={savingPw}>
                      {savingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
