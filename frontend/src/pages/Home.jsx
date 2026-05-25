import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Heart, SlidersHorizontal, ShoppingBag, Eye, User, LogOut, ShieldAlert } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Navigation Bar ─────────────────────── */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">CreationHub</span>
            </div>

            {/* Right side — Wishlist + Cart + Admin + Logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Wishlist Button */}
              <div className="relative p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-sm bg-slate-50 border border-slate-100/50">
                <Heart className="w-4 h-4 fill-transparent" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white">
                    {wishlistCount}
                  </span>
                )}
              </div>

              {/* Cart Button */}
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

              {/* Admin Console Link */}
              {user?.role === 'ROLE_ADMIN' && (
                <Link
                  to="/admin"
                  className="hidden md:flex px-3.5 py-2 text-xs font-bold text-indigo-600 border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl cursor-pointer items-center gap-1.5 transition-all shadow-inner"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
              )}

              {/* My Orders Link */}
              <Link
                to="/orders"
                className="hidden sm:flex px-3.5 py-2 text-xs font-bold text-slate-600 border border-slate-200/60 hover:bg-slate-50 bg-white rounded-xl cursor-pointer items-center gap-1.5 transition-all shadow-sm"
              >
                My Orders
              </Link>

              {/* Separator */}
              <span className="hidden sm:inline w-px h-5 bg-slate-200/80" />

              {/* User Avatar Info */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8.5 h-8.5 bg-indigo-600/10 rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
                  <span className="text-xs font-bold text-indigo-600">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left leading-none">
                  <p className="text-xs font-bold text-slate-800">{user?.username}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{user?.role?.replace('ROLE_', '')}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 cursor-pointer transition-colors shadow-sm bg-slate-50 border border-slate-100/50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Interactive Filter Header Panel */}
        <div className="flex flex-col items-center justify-center text-center mb-12 mt-4">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4"
          >
            Discover Premium <span className="text-indigo-600 bg-indigo-50/80 border border-indigo-100/40 px-3.5 py-1.5 rounded-3xl shadow-inner">Lifestyle</span> Gear
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-slate-500 max-w-xl text-sm leading-relaxed mb-8"
          >
            A high-end curated collection of next-generation smart devices, audio gear, premium wearables, and state-of-the-art gaming setups.
          </motion.p>

          {/* Centered Glassmorphic Search Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="w-full max-w-2xl relative shadow-lg hover:shadow-xl rounded-2xl border border-slate-200/50 bg-white/70 backdrop-blur-xl p-2.5 flex items-center gap-2.5 mb-8 focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600 focus-within:bg-white transition-all duration-300"
          >
            <div className="pl-3.5 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by product name, category, specs, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 text-sm py-1.5 focus:ring-0 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>

          {/* Interactive Filtering & Sorting Bar */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200/50 pb-6 mb-8">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
              {['All', 'Smart Devices', 'Audio Gear', 'Premium Wearables', 'Gaming Setup'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4.5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                    selectedCategory === category
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sorting Select and Product Count */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                {filteredProducts.length} Items Found
              </span>

              <div className="relative flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-0 text-xs font-bold text-slate-600 outline-none focus:ring-0 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="default">Sort: Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Best Rating</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error State ──── */}
        {error && !loading && (
          <ErrorFallback message={error} onRetry={() => fetchProducts(page)} />
        )}

        {/* ── Loading Skeleton Grid ──── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* ── Products Grid with Staggered Cascading entrance ──── */}
        {!loading && !error && filteredProducts.length > 0 && (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
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

        {/* ── Empty State ──── */}
        {!loading && !error && filteredProducts.length === 0 && (
          <EmptyState onClear={handleResetFilters} />
        )}
      </main>

      {/* ── Quick View Modal ─────────────────────── */}
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
