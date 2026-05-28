import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Heart, SlidersHorizontal, ShoppingBag, User, LogOut, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { RiAppsLine, RiSmartphoneLine, RiHeadphoneLine, RiGamepadLine, RiWirelessChargingLine } from 'react-icons/ri';
import { categories } from '../data/mockData';

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
  const { totalCartItems, searchQuery, setSearchQuery } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting & selection states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

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
      return 0;
    });

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
    <div className="min-h-screen bg-[#FAF6F0] pb-24 sm:pb-8 flex flex-col justify-between">
      <div>
        {/* Shared Luxury Minimalist Header and Floating Bottom Navbar */}
        <Navbar />

        {/* ── Hero Section ── */}
        <Hero />

        {/* ── MAIN CONTENT ── */}
        <motion.main 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6"
        >

        {/* ── Filter & Sort Bar (Integrated Categories Bar) ── */}
        <motion.div
          id="catalog-section"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-200/60 py-4 sm:py-5 mb-8 sm:mb-10"
        >
          {/* Category Pills showing dynamic circular pods capped by viewport checks */}
          <div className="relative w-full sm:w-auto overflow-hidden">
            {/* Mobile category layout capped to exactly 4 circular pods with sub-header See All */}
            <div className="md:hidden flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center px-4">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-widest font-serif">Categories</span>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-850 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  See All
                </button>
              </div>
              <div className="flex overflow-x-auto scrollbar-none gap-4 py-3 px-4 text-center justify-start items-center">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-2 text-xs font-bold rounded-full border transition-all cursor-pointer whitespace-nowrap shadow-xs flex-shrink-0 w-16 h-16 ${
                      selectedCategory === cat.name
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    {cat.icon}
                    <span className="text-[8px] tracking-wider mt-0.5 max-w-[50px] truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop category layout showing 6 circular category pods with dynamic See All action trigger */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-4 py-3 px-4">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex flex-col items-center justify-center px-4 py-2.5 text-xs font-bold rounded-full border transition-all cursor-pointer whitespace-nowrap shadow-xs flex-shrink-0 min-w-[100px] ${
                      selectedCategory === cat.name
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    {cat.icon}
                    <span className="text-[10px] tracking-wider mt-1">{cat.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider pl-2 border-l border-zinc-200 cursor-pointer"
                >
                  See All
                </button>
              </div>
            </div>
            
            {/* Right fade mask for scroll hint */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-[#FAF6F0] to-transparent sm:hidden" />
          </div>

          {/* Right: count + sort */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0 px-4 sm:px-0">
            <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">
              {filteredProducts.length} Items
            </span>

            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-0 text-xs font-bold text-zinc-600 outline-none focus:ring-0 focus:outline-none cursor-pointer pr-0.5"
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
          <div className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            className="grid grid-cols-2 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
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
        </motion.main>
      </div>

      {/* Premium Footer section */}
      <Footer />

      {/* ── Full Category Responsive Modal ── */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-zinc-200/85 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 font-serif">Explore Categories</h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid listing ALL categories with vector icons */}
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      setIsCategoryModalOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                      selectedCategory === cat.name
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-md scale-102 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.icon}</div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-center">{cat.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
