import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import UserManagement from './pages/admin/UserManagement';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User Pages
import HomePage from './pages/user/HomePage';
import ProductListPage from './pages/user/ProductListPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrderListPage from './pages/user/OrderListPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import WishlistPage from './pages/user/WishlistPage';
import BlogPage from './pages/user/BlogPage';
import BlogDetailPage from './pages/user/BlogDetailPage';
import ProfilePage from './pages/user/ProfilePage';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{
        width: 36, height: 36, border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

// Admin Route wrapper
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a spinner
  return (user && user.role === 'admin') ? children : <Navigate to="/" replace />;
};

// Guest Route (redirect if already logged in)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

              {/* User / Main */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />

                {/* Protected */}
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderListPage /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              </Route>

              {/* Admin */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="categories" element={<div>Categories Management</div>} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="users" element={<UserManagement />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
