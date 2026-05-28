import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Home, Heart, ShoppingBag, ClipboardList, Menu, X, MoreVertical, User, LogOut, Info, Search } from 'lucide-react';
import { HiArrowLeft, HiOutlineCollection } from 'react-icons/hi';

export default function Navbar({ backToStore = false }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalCartItems, searchQuery, setSearchQuery } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);

  const updateWishlistCount = () => {
    const saved = localStorage.getItem('wishlist');
    const wishlist = saved ? JSON.parse(saved) : [];
    setWishlistCount(wishlist.length);
  };

  useEffect(() => {
    updateWishlistCount();
    window.addEventListener('wishlist-update', updateWishlistCount);
    return () => window.removeEventListener('wishlist-update', updateWishlistCount);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── TOP HEADER / NAVBAR (Desktop + Mobile Strip) ── */}
      <nav className="border-b border-zinc-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Left: Minimalist Text Brand Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {location.pathname !== '/' && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all cursor-pointer mr-1"
                  aria-label="Go Back"
                >
                  <HiArrowLeft className="w-5 h-5" />
                </button>
              )}
              <Link to="/" className="flex items-center gap-2 group">
                <span className="font-serif tracking-wider text-xl font-bold text-zinc-900 transition-colors">
                  CreationHub
                </span>
              </Link>
            </div>

            {/* Desktop Minimalist Search Bar component directly inside navigation row */}
            {location.pathname === '/' && (
              <div className="hidden md:flex flex-1 max-w-md mx-auto px-4 relative">
                <div className="flex items-center gap-2 w-full bg-zinc-50 border border-zinc-200/80 rounded-full px-4 py-2 hover:bg-white hover:border-zinc-300 transition-all duration-300">
                  <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search premium products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none text-zinc-800 placeholder-zinc-400 text-xs focus:ring-0 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-all cursor-pointer flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Actions Matrix (md:flex) */}
            <div className="hidden md:flex items-center gap-4">
              {backToStore && (
                <Link to="/" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors mr-2">
                  Back to Store
                </Link>
              )}

              {/* Wishlist Link */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/wishlist"
                  className="relative p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-zinc-100 bg-white shadow-xs"
                  title="Wishlist"
                >
                  <Heart className="w-4.5 h-4.5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* My Orders Link */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/orders"
                  className="relative p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all border border-zinc-100 bg-white shadow-xs"
                  title="My Orders"
                >
                  <HiOutlineCollection className="w-4.5 h-4.5" />
                </Link>
              )}

              {/* Cart Link */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/cart"
                  className="relative p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-zinc-100 bg-white shadow-xs"
                  title="Cart"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-white">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              )}

              {/* Admin Console Navigation link */}
              {user?.role === 'ROLE_ADMIN' && (
                <Link
                  to="/admin"
                  className="px-3.5 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 rounded-xl transition-all"
                >
                  Admin Console
                </Link>
              )}

              {/* User Profile circle badge & Mapped 3-Dots Dropdown */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3 pl-2 border-l border-zinc-200">
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 rounded-full flex items-center justify-center text-white text-xs font-bold font-serif shadow-xs cursor-pointer transition-colors"
                    title="My Profile"
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        desktopDropdownOpen ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800'
                      }`}
                      title="Account Menu"
                    >
                      <MoreVertical className="w-4.5 h-4.5" />
                    </button>

                    {/* Absolute-positioned Desktop Dropdown Card */}
                    {desktopDropdownOpen && (
                      <div className="absolute right-0 top-10 w-44 bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-1.5 z-50 animate-slide-up flex flex-col gap-0.5">
                        <button
                          onClick={() => {
                            setDesktopDropdownOpen(false);
                            document.getElementById("brand-story")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <Info className="w-4 h-4 text-zinc-450" />
                          About Brand
                        </button>
                        <button
                          onClick={() => {
                            setDesktopDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-zinc-900 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Header: Far Right sleek menu toggle */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Wishlist Link */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/wishlist"
                  className="relative p-2 text-zinc-500 hover:text-rose-500 rounded-xl transition-all"
                  title="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile Cart Link */}
              {user?.role !== 'ROLE_ADMIN' && (
                <Link
                  to="/cart"
                  className="relative p-2 text-zinc-500 hover:text-indigo-600 rounded-xl transition-all"
                  title="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalCartItems > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-white">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer relative"
              >
                {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <MoreVertical className="w-5.5 h-5.5" />}
              </button>

              {/* Absolute-positioned Floating Dropdown */}
              {mobileMenuOpen && (
                <div className="absolute right-4 top-14 w-48 bg-white border border-zinc-200/80 shadow-2xl rounded-2xl p-2 z-50 animate-slide-up flex flex-col gap-1">
                  {isAuthenticated ? (
                    <>
                      <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Session</p>
                        <p className="text-xs font-bold text-zinc-800 truncate">@{user?.username}</p>
                      </div>
                      
                      <button
                        onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-zinc-400" />
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setTimeout(() => {
                            document.getElementById("brand-story")?.scrollIntoView({ behavior: "smooth" });
                          }, 50);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 font-bold rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Info className="w-4 h-4 text-zinc-400" />
                        About Brand
                      </button>

                      {user?.role === 'ROLE_ADMIN' && (
                        <button
                          onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50/50 font-extrabold rounded-xl transition-colors text-left"
                        >
                          <ClipboardList className="w-4 h-4" />
                          Admin Console
                        </button>
                      )}

                      <button
                        onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-800 hover:bg-zinc-50 font-bold rounded-xl transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      Sign In
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* ── STICKY FLOATING PINTEREST-STYLE BOTTOM NAVBAR (Mobile Viewports Only) ── */}
      <div className="md:hidden">
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] bg-white/75 backdrop-blur-lg border border-zinc-200/40 shadow-2xl rounded-full px-6 py-3.5 z-50 flex items-center justify-around">
          
          {user?.role === 'ROLE_ADMIN' ? (
            <>
              {/* Home Icon */}
              <Link
                to="/"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all ${
                  location.pathname === '/' ? 'text-zinc-900 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Storefront"
              >
                <Home className="w-5.5 h-5.5" />
              </Link>

              {/* Admin Dashboard Console */}
              <Link
                to="/admin"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all ${
                  location.pathname.startsWith('/admin') && !location.hash.includes('orders') ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Admin Console"
              >
                <ClipboardList className="w-5.5 h-5.5" />
              </Link>

              {/* Orders Fulfillment Quick Link */}
              <button
                onClick={() => {
                  navigate('/admin', { state: { activeTab: 'orders' } });
                }}
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all cursor-pointer ${
                  location.pathname.startsWith('/admin') && location.hash.includes('orders') ? 'text-zinc-900 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                title="Fulfillment"
              >
                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 014 0m10 0a2 2 0 104 0m-4 0a2 2 0 014 0" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {/* Home Icon */}
              <Link
                to="/"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all ${
                  location.pathname === '/' ? 'text-zinc-900 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Home className="w-5.5 h-5.5" />
              </Link>

              {/* Wishlist Icon */}
              <Link
                to="/wishlist"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all ${
                  location.pathname === '/wishlist' ? 'text-rose-500 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Heart className="w-5.5 h-5.5" />
              </Link>

              {/* Cart Icon with notification bubble count */}
              <Link
                to="/cart"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all relative ${
                  location.pathname === '/cart' ? 'text-indigo-600 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <ShoppingBag className="w-5.5 h-5.5" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white ring-2 ring-white">
                    {totalCartItems}
                  </span>
                )}
              </Link>

              {/* My Orders Icon */}
              <Link
                to="/orders"
                className={`flex flex-col items-center justify-center p-1.5 rounded-full transition-all ${
                  location.pathname === '/orders' || location.pathname === '/order-success' ? 'text-zinc-900 scale-110' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <ClipboardList className="w-5.5 h-5.5" />
              </Link>
            </>
          )}

        </div>
      </div>
    </>
  );
}
