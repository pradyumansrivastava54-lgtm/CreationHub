import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Heart, SlidersHorizontal, ShoppingBag, User, LogOut, ShieldAlert, LayoutDashboard } from 'lucide-react';

/* ──────────────────────────────────────────
   Skeleton Card — shown while loading
   ────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden animate-pulse shadow-sm">
      <div className="aspect-square bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 rounded-lg w-full" />
        <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
        <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-4">
          <div className="h-6 bg-slate-100 rounded-lg w-16" />
          <div className="h-9 bg-slate-100 rounded-xl w-20" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Error Fallback — shown when backend is down
   ────────────────────────────────────────── */
function ErrorFallback({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
        <ShieldAlert className="w-10 h-10 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Products</h2>
      <p className="text-slate-500 text-center max-w-sm mb-6 text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-2xl cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all"
      >
        Try Again
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────
   Empty State — no products matching search
   ────────────────────────────────────────── */
function EmptyState({ onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 bg-indigo-50/50 rounded-full flex items-center justify-center mb-6 border border-indigo-50">
        <ShoppingBag className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No Matching Products</h2>
      <p className="text-slate-500 text-center max-w-sm mb-6 text-sm">
        We couldn't find anything matching your filters or query. Try adjusting your search query or selecting a different category.
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl cursor-pointer transition-all"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   HOME PAGE — Main Component
   ══════════════════════════════════════════ */
export default function Home() {
  const { user, logout } = useAuth();
  const { totalCartItems } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, sorting & selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Wishlist count state
  const [wishlistCount, setWishlistCount] = useState(0);

  // Pagination properties
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchProducts = useCallback(async (pageNum = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch size=100 so all 20 premium products are loaded locally for ultra-fast, zero-latency immediate filters
      const response = await API.get('/api/products', {
        params: { page: pageNum, size: 100, sort: 'id,asc' },
      });
      setProducts(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setPage(pageNum);
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('The server appears to be offline. Please ensure the backend is running on localhost:8080.');
      } else {
        setError(err.response?.data?.message || 'Failed to load products. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWishlistCount = () => {
    const saved = localStorage.getItem('wishlist');
    const wishlist = saved ? JSON.parse(saved) : [];
    setWishlistCount(wishlist.length);
  };

  useEffect(() => {
    fetchProducts(0);
    updateWishlistCount();
    window.addEventListener('wishlist-update', updateWishlistCount);
    return () => window.removeEventListener('wishlist-update', updateWishlistCount);
  }, [fetchProducts]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('default');
  };

  // Client-side immediate filtering & sorting logic
  const filteredProducts = products
    .filter((product) => {
      const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = product.name?.toLowerCase().includes(query);
      const descMatch = product.description?.toLowerCase().includes(query);
      const categoryTextMatch = product.category?.toLowerCase().includes(query);
      return categoryMatch && (nameMatch || descMatch || categoryTextMatch);
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      return 0; // default order
    });

  // Framer Motion grid variants
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const categories = ['All', 'Smart Devices', 'Audio Gear', 'Premium Wearables', 'Gaming Setup'];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══════════════════════════════════════════
          NAVIGATION BAR — Sticky, Glassmorphic
          ══════════════════════════════════════════ */}
      <nav className="border-b border-slate-100/80 bg-white/85 backdrop-blur-2xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16 gap-3">

            {/* ── Brand Logo ── */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner group-hover:border-indigo-200 transition-all">
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight">
                Creation<span className="text-indigo-600">Hub</span>
              </span>
            </Link>

            {/* ── Right Actions ── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">

              {/* Wishlist — hidden for Admins */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/wishlist"
                  className="relative p-2 sm:p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer transition-all shadow-sm bg-white border border-slate-100/80"
                  title="Wishlist"
                >
                  <Heart className="w-4 h-4" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart — hidden for Admins */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/cart"
                  className="relative p-2 sm:p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 cursor-pointer transition-all shadow-sm bg-white border border-slate-100/80"
                  title="Cart"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-white">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              )}

              {/* Admin Console — icon-only on mobile, full label on md+ */}
              {user?.role === 'ROLE_ADMIN' && (
                <Link
                  to="/admin"
                  title="Admin Console"
                  className="flex items-center gap-1.5 px-2.5 md:px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden md:inline tracking-wide">Admin Console</span>
                </Link>
              )}

              {/* My Orders — hidden for Admins */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/orders"
                  className="hidden sm:flex px-3 md:px-3.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 bg-white rounded-xl cursor-pointer items-center gap-1.5 transition-all shadow-sm"
                >
                  My Orders
                </Link>
              )}

              {/* Divider */}
              <span className="w-px h-5 bg-slate-200 flex-shrink-0" />

              {/* User session block */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  {/* Avatar circle — always visible */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-600/20 to-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-100 shadow-sm flex-shrink-0 ring-2 ring-white">
                      <span className="text-xs font-extrabold text-indigo-600">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Name + role — only on sm+ */}
                    <div className="hidden sm:block text-left leading-tight">
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[80px]">{user.username}</p>
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                        {user.role?.replace('ROLE_', '')}
                      </p>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 sm:p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer transition-all shadow-sm bg-white border border-slate-100/80 flex-shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 bg-white rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                >
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden xs:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ── Hero Section ── */}
        <section className="flex flex-col items-center justify-center text-center pt-10 sm:pt-14 pb-6 sm:pb-8">

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-5"
          >
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold rounded-full tracking-widest uppercase shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Curated Premium Collection
            </span>
          </motion.div>

          {/* Main H1 — fluid responsive scale */}
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-snug text-center px-2 mb-4 sm:mb-5"
          >
            Discover Premium{' '}
            <span className="relative inline-block">
              <span className="text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-2xl sm:rounded-3xl shadow-inner">
                Lifestyle
              </span>
            </span>
            {' '}Gear
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="text-slate-500 max-w-lg sm:max-w-xl text-sm sm:text-base leading-relaxed mb-7 sm:mb-9 px-2"
          >
            A curated collection of next-generation smart devices, premium audio gear,{' '}
            wearables, and state-of-the-art gaming setups.
          </motion.p>

          {/* ── Search Bar ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="w-full max-w-2xl relative"
          >
            <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-md hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all duration-300">
              <Search className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, category, or specs…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 text-sm focus:ring-0 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Filter & Sort Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-t border-b border-slate-200/60 py-4 sm:py-5 mb-8 sm:mb-10"
        >
          {/* Category Pills with fade-edge scroll */}
          <div className="relative w-full sm:w-auto">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap shadow-sm flex-shrink-0 ${
                    selectedCategory === category
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/15'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {/* Right fade mask for scroll hint */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-slate-50 to-transparent sm:hidden" />
          </div>

          {/* Right: count + sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              {filteredProducts.length} Items
            </span>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-slate-600 outline-none focus:ring-0 focus:outline-none cursor-pointer pr-0.5"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating-desc">Best Rating</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* ── Error State ── */}
        {error && !loading && (
          <ErrorFallback message={error} onRetry={() => fetchProducts(page)} />
        )}

        {/* ── Loading Skeleton Grid ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Products Grid with Staggered Entrance ── */}
        {!loading && !error && filteredProducts.length > 0 && (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setSelectedProduct(p)}
              />
            ))}
          </motion.div>
        )}

        {/* ── Empty State ── */}
        {!loading && !error && filteredProducts.length === 0 && (
          <EmptyState onClear={handleResetFilters} />
        )}
      </main>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {selectedProduct && (
          <QuickViewModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
