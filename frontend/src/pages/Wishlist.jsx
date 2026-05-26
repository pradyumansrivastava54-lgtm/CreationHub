import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ShoppingCart, ArrowLeft, ShoppingBag, Trash2, Eye, Plus, Minus, User, LogOut } from 'lucide-react';

export default function Wishlist() {
  const { user, logout } = useAuth();
  const { cartItems, addToCart, updateQuantity, totalCartItems } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

  // Load wishlist from local storage
  const loadWishlist = () => {
    const saved = localStorage.getItem('wishlist');
    const ids = saved ? JSON.parse(saved) : [];
    setWishlistIds(ids);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch products and sync wishlist
  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get('/api/products', {
          params: { page: 0, size: 100, sort: 'id,asc' },
        });
        setProducts(response.data.content);
      } catch (err) {
        console.error('Failed to load products for wishlist:', err);
        setError(err.response?.data?.message || 'Failed to connect to the store catalog.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
    loadWishlist();

    // Listen for wishlist updates
    const handleUpdate = () => loadWishlist();
    window.addEventListener('wishlist-update', handleUpdate);
    return () => window.removeEventListener('wishlist-update', handleUpdate);
  }, []);

  const removeFromWishlist = (productId) => {
    const saved = localStorage.getItem('wishlist');
    let wishlist = saved ? JSON.parse(saved) : [];
    wishlist = wishlist.filter((id) => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setWishlistIds(wishlist);
    window.dispatchEvent(new Event('wishlist-update'));
  };

  // Filter products that exist in the wishlist IDs list
  const wishlistedProducts = products.filter((product) => wishlistIds.includes(product.id));

  // Framer Motion entry animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navigation Bar ─────────────────────── */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-45 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Back button */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <ArrowLeft className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <span className="text-lg font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">Back to Store</span>
            </Link>

            {/* Header Right */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Cart Link */}
              <Link 
                to="/cart"
                className="relative p-2.5 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-sm bg-slate-50 border border-slate-100/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-white">
                    {totalCartItems}
                  </span>
                )}
              </Link>

              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="w-8.5 h-8.5 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
                      <span className="text-xs font-bold text-indigo-600">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left leading-none">
                      <p className="text-xs font-bold text-slate-800">{user.username}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{user.role?.replace('ROLE_', '')}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors shadow-sm bg-slate-50 border border-slate-100/50"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50/50 bg-white rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            My Wishlist
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Your saved premium collections and items ready for checkout.
          </p>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden animate-pulse shadow-sm h-96" />
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-5 text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && wishlistedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-3xl shadow-sm px-4"
          >
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100/50">
              <Heart className="w-10 h-10 text-rose-400 fill-rose-50/20" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Your CreationHub Wishlist is empty.</h2>
            <p className="text-slate-400 text-center max-w-sm mb-8 text-xs leading-relaxed">
              Explore our high-end boutique gear and add your favorite smart devices, audio gear, and setups to your saved collection.
            </p>
            <Link
              to="/"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Browse Catalog
            </Link>
          </motion.div>
        )}

        {/* ── Wishlist Grid ── */}
        {!loading && !error && wishlistedProducts.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
          >
            <AnimatePresence>
              {wishlistedProducts.map((product) => {
                const cartItem = cartItems.find((item) => item.product.id === product.id);

                return (
                  <motion.div
                    key={product.id}
                    variants={cardVariants}
                    exit="exit"
                    layout
                    whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                    className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-200 flex flex-col h-full relative transition-all duration-300"
                  >
                    {/* Delete Cross Button */}
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-rose-500 text-slate-400 hover:text-white shadow-sm hover:shadow backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-slate-50 border-b border-slate-100">
                      <Link to={`/product/${product.id}`} className="w-full h-full block">
                        <img
                          src={product.imageUrl || fallbackImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImage;
                          }}
                        />
                      </Link>

                      {/* Stock Badge */}
                      {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                        <span className="absolute top-4 left-4 px-2 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded shadow-sm">
                          ONLY {product.stockQuantity} LEFT
                        </span>
                      )}
                      {product.stockQuantity === 0 && (
                        <span className="absolute top-4 left-4 px-2 py-0.5 bg-rose-500/90 text-white text-[9px] font-bold rounded shadow-sm">
                          OUT OF STOCK
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="mb-2">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {product.category || 'General'}
                        </span>
                      </div>

                      <Link to={`/product/${product.id}`} className="block mb-2">
                        <h3 className="text-slate-800 font-bold text-sm leading-snug line-clamp-2 hover:text-indigo-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price & Cart Actions */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400">Price</span>
                          <span className="text-sm font-extrabold text-slate-900 leading-tight">
                            ₹{Number(product.price).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {/* Add to Cart Control Block */}
                        <div className="relative">
                          {cartItem ? (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 rounded-xl p-0.5 shadow-sm">
                              <button
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                disabled={cartItem.quantity <= 1}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-bold shadow-sm"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-4 text-center text-xs font-bold text-slate-800">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                disabled={cartItem.quantity >= product.stockQuantity}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-bold shadow-sm"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product.id, 1)}
                              disabled={product.stockQuantity === 0}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer transition-all"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
