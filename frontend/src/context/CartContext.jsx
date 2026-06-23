import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi } from '../api/cartApi';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartItems([]);
      return;
    }
    try {
      setCartLoading(true);
      const data = await cartApi.getCart();
      // Backend returns ResourceCollection: { data: [...] }
      setCartItems(data.data || data || []);
    } catch {
      setCartItems([]);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Fetch cart on mount if user is logged in
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <CartContext.Provider value={{ cartItems, setCartItems, cartLoading, fetchCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
