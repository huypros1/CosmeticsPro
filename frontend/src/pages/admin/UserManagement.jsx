import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // axiosClient returns response.data directly (res = paginate object)
      const res = await adminApi.getUsers({ search, role: roleFilter, status: statusFilter });
      setUsers(res?.data || (Array.isArray(res) ? res : []));
    } catch (error) {
      console.error('Error fetching users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  const updateRole = async (id, newRole) => {
    try {
      await adminApi.updateUserRole(id, newRole);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role', error);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateUserStatus(id, newStatus);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status', error);
    }
  };

  if (loading) return <div>Đang tải danh sách người dùng...</div>;

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Khách hàng</h1>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ width: '250px' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Vai trò</option>
          <option value="admin">Quản trị viên (Admin)</option>
          <option value="user">Khách hàng (User)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
          style={{ width: '180px' }}
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="active">Hoạt động (Active)</option>
          <option value="blocked">Khóa (Blocked)</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="user">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={user.status} 
                    onChange={(e) => updateStatus(user.id, e.target.value)}
                    style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc',
                             color: user.status === 'blocked' ? 'red' : 'inherit' }}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="blocked">Đã khóa</option>
                  </select>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Chưa có người dùng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
