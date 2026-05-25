import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      const response = await API.get('/api/cart');
      setCartItems(response.data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await API.post('/api/cart/add', { productId, quantity });
      fetchCart();
      return true;
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        showToast('Sorry, requested item quantity exceeds warehouse availability.');
      } else {
        showToast(err.response?.data?.message || 'Failed to add to cart');
      }
      return false;
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return false;
    try {
      await API.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      fetchCart();
      return true;
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        showToast('Sorry, requested item quantity exceeds warehouse availability.');
      } else {
        showToast(err.response?.data?.message || 'Failed to update quantity');
      }
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await API.delete(`/api/cart/${itemId}`);
      fetchCart();
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to remove item');
      return false;
    }
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        totalCartItems
      }}
    >
      {children}
      {/* Global Error/Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-surface-card border border-border rounded-xl p-4 shadow-2xl shadow-black/30 flex items-center gap-3 min-w-72">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
