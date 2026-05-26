import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';

export default function Cart() {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, totalCartItems, fetchCart } = useCart();
  const navigate = useNavigate();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const grandTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart', proceedToCheckout: true } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Navigation Bar ── */}
      <nav className="border-b border-border bg-surface-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary hidden sm:block">Back to Store</span>
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-text-primary font-medium">{user.username}</p>
                      <p className="text-text-muted text-xs">{user.role?.replace('ROLE_', '')}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg rounded-lg cursor-pointer transition-colors">Logout</button>
                </>
              ) : (
                <Link
                  to="/login"
                  state={{ from: '/cart' }}
                  className="px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50/50 bg-white rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95 animate-fade-in"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>



      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">Shopping Cart</h1>
          <p className="text-text-secondary mt-2">
            You have {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} in your cart.
          </p>
        </div>

        {checkoutSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface-card border border-border rounded-2xl shadow-sm animate-fade-in">
            <div className="w-24 h-24 bg-success-bg rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Payment Successful!</h2>
            <p className="text-text-secondary text-center max-w-md mb-8">
              Your order has been placed and paid for successfully. We're getting it ready for shipment!
            </p>
            <div className="flex gap-4">
              <button onClick={() => navigate('/orders')} className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors cursor-pointer">
                View My Orders
              </button>
              <Link to="/" className="px-8 py-3.5 bg-surface-input hover:bg-surface-card border border-border text-text-primary font-semibold rounded-xl transition-colors cursor-pointer">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface-card border border-border rounded-2xl shadow-sm">
            <div className="w-24 h-24 bg-surface-input rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Your cart is empty</h2>
            <p className="text-text-secondary text-center max-w-md mb-8">
              Looks like you haven't added anything to your cart yet. Browse our products and discover something amazing!
            </p>
            <Link to="/" className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors cursor-pointer">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-6 p-6 bg-surface-card border border-border rounded-2xl shadow-sm group hover:border-primary/50 transition-colors">
                  <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-surface-input shrink-0">
                    <img
                      src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">{item.product.name}</h3>
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.product.description}</p>
                      </div>
                      <span className="text-lg font-bold text-text-primary shrink-0">
                        ₹{Number(item.product.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-1 bg-surface-input rounded-xl p-1 w-fit">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface-card rounded-lg disabled:opacity-40 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.product.stockQuantity} className="w-9 h-9 flex items-center justify-center text-text-primary hover:bg-surface-card rounded-lg disabled:opacity-40 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg rounded-xl transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-surface-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal</span>
                    <span className="font-medium text-text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Shipping estimate</span>
                    <span className="font-medium text-text-primary">Free</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Tax estimate</span>
                    <span className="font-medium text-text-primary">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t border-border pt-6 mb-6">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-text-primary">Order Total</span>
                    <span className="text-2xl font-black text-primary">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                {checkoutError && (
                  <div className="mb-4 p-3 bg-danger-bg border border-danger/30 rounded-lg text-sm text-danger font-medium text-center">{checkoutError}</div>
                )}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Order...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
                <p className="text-center text-text-muted text-xs mt-3 flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Secured by Creation Payment Gateway
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
