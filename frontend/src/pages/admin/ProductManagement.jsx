import { useState, useEffect } from 'react';
import axios from 'axios';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data); // Assuming pagination
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product', error);
    }
  };

  if (loading) return <div>Đang tải danh sách sản phẩm...</div>;

  return (
    <div className="management-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Quản lý Sản phẩm</h1>
        <button style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          + Thêm sản phẩm
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>#{product.id}</td>
                <td>
                  {product.image ? (
                    <img src={`http://localhost:8000${product.image}`} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  ) : (
                    <div style={{ width: 50, height: 50, background: '#e2e8f0', borderRadius: 4 }}></div>
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.category?.name}</td>
                <td>{product.brand?.name}</td>
                <td>
                  <span className={product.status === 'active' ? 'status-badge status-delivered' : 'status-badge status-cancelled'}>
                    {product.status === 'active' ? 'Hoạt động' : 'Đã ẩn'}
                  </span>
                </td>
                <td>
                  <button style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}>Sửa</button>
                  <button onClick={() => deleteProduct(product.id)} style={{ color: 'red', padding: '4px 8px', cursor: 'pointer' }}>Xóa</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Chưa có sản phẩm nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;
