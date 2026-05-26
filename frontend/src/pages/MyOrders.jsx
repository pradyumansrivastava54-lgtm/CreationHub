import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get('/api/orders/my-orders');
        // Safely fallback to empty array if response data is missing
        setOrders(response.data || []);
      } catch (err) {
        console.error('Failed to fetch order history:', err);
        setError('Could not retrieve your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary">CreationHub</span>
            </Link>
            <span className="text-sm font-semibold text-text-secondary">My Orders</span>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-text-primary">Order History</h1>
          <p className="text-text-secondary mt-1">Review and track your previous transactions</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          /* Premium Empty State component */
          <div className="bg-surface-card border border-border p-12 text-center rounded-2xl shadow-xl space-y-6 max-w-lg mx-auto mt-8 animate-slide-up">
            <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary shadow-[0_8px_30px_rgb(79,70,229,0.1)]">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1,0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0,1-1.12-1.243l1.264-12A1.125 1.125 0 0,1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Zm7.5 0a.375.375 0 1,1-.75 0 .375.375 0 0,1 .75 0Z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-text-primary tracking-tight">You haven't shopped anything yet!</h3>
              <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                Discover our curated premium collection of top-tier accessories, apparel, and gadgets. Your next favorite item is waiting!
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-primary/25 cursor-pointer text-base uppercase tracking-wider"
            >
              Explore Creation / Start Shopping
            </button>
          </div>
        ) : error ? (
          <div className="bg-surface-card border border-border p-8 rounded-2xl text-center shadow-lg">
            <p className="text-danger font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Orders list */
          <div className="space-y-6 animate-slide-up">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface-card border border-border rounded-2xl p-6 lg:p-8 shadow-xl space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
                  <div className="space-y-1">
                    <p className="text-xs text-text-muted font-mono">ORDER ID: #{order.id}</p>
                    {order.transactionId && (
                      <p className="text-[11px] text-text-muted font-mono">TXN ID: {order.transactionId}</p>
                    )}
                    <p className="text-sm text-text-secondary">Placed on: {new Date(order.orderDate).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-text-secondary">Total Paid:</span>
                    <span className="text-xl font-extrabold text-primary">₹{Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Items Purchased list */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Items Purchased</p>
                  <div className="divide-y divide-border">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=40&q=80'}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary truncate">{item.product?.name}</p>
                            <p className="text-text-muted text-xs">
                              {item.quantity} unit{item.quantity > 1 ? 's' : ''} at ₹{Number(item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-text-primary">
                            ₹{Number(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flipkart-Style Tracking Stepper */}
                <div className="pt-6 border-t border-border mt-4">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">Order Tracking</p>
                  <div className="relative flex items-center justify-between w-full px-2 sm:px-6">
                    {/* Background Line */}
                    <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full" />
                    
                    {/* Active progress bar line fill */}
                    <div 
                      className="absolute left-6 top-4 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${
                          ((order.orderStatus === 'DELIVERED' ? 3 : order.orderStatus === 'SHIPPED' ? 2 : order.orderStatus === 'PROCESSING' ? 1 : 0) / 3) * 85
                        }%` 
                      }}
                    />

                    {['Placed', 'Processing', 'Shipped', 'Delivered'].map((label, index) => {
                      const currentStep = order.orderStatus === 'DELIVERED' ? 3 : order.orderStatus === 'SHIPPED' ? 2 : order.orderStatus === 'PROCESSING' ? 1 : 0;
                      const isCompleted = index <= currentStep;
                      const isActive = index === currentStep;

                      return (
                        <div key={label} className="flex flex-col items-center relative z-10 shrink-0">
                          {/* Circle Node */}
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isActive 
                                ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse'
                                : isCompleted
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isCompleted ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Label Stacked Underneath */}
                          <span 
                            className={`text-[11px] font-bold mt-2 tracking-wide transition-all ${
                              isActive
                                ? 'text-indigo-600'
                                : isCompleted
                                ? 'text-slate-700 font-semibold'
                                : 'text-slate-400 font-medium'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
