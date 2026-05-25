import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ProductCard({ product, onQuickView }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

  // Self-contained Wishlist state synced with localStorage
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    const wishlist = saved ? JSON.parse(saved) : [];
    setIsWishlisted(wishlist.includes(product.id));
  }, [product.id]);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = localStorage.getItem('wishlist');
    let wishlist = saved ? JSON.parse(saved) : [];
    
    if (wishlist.includes(product.id)) {
      wishlist = wishlist.filter(id => id !== product.id);
      setIsWishlisted(false);
    } else {
      wishlist.push(product.id);
      setIsWishlisted(true);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new Event('wishlist-update'));
  };

  // Framer Motion staggered child motion variables
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -8, transition: { duration: 0.25, ease: 'easeOut' } }}
      className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-200 flex flex-col h-full relative transition-all duration-300"
    >
      {/* Wishlist Heart Icon */}
      <button
        onClick={toggleWishlist}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/70 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm hover:shadow backdrop-blur-md transition-all active:scale-90 cursor-pointer"
      >
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Image Container with Hover Actions */}
      <div className="relative aspect-square overflow-hidden bg-slate-50 border-b border-slate-100">
        <Link to={`/product/${product.id}`} className="w-full h-full block">
          <img
            src={product.imageUrl || fallbackImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImage;
            }}
          />
        </Link>

        {/* Stock Badge */}
        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <span className="absolute top-4 left-4 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm shadow-sm tracking-wide">
            ONLY {product.stockQuantity} LEFT
          </span>
        )}
        {product.stockQuantity === 0 && (
          <span className="absolute top-4 left-4 px-2.5 py-1 bg-rose-500/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm shadow-sm tracking-wide">
            OUT OF STOCK
          </span>
        )}

        {/* Quick View Button (Glassmorphic) */}
        <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
          <button
            onClick={() => onQuickView(product)}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-lg border border-slate-100 backdrop-blur-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
            {product.category || 'General'}
          </span>
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span className="text-xs font-bold text-slate-700">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-slate-800 font-bold text-base leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4 flex-grow">
          {product.description || 'Premium lifestyle electronic product curated for you.'}
        </p>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-auto">
          {/* Price */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400">Price</span>
            <span className="text-lg font-extrabold text-slate-900 leading-tight">
              ₹{Number(product.price).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Add to Cart or Quantity Controls */}
          <div className="relative">
            {cartItem ? (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 rounded-xl p-0.5 shadow-sm">
                <button
                  onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                  disabled={cartItem.quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-slate-800">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                  disabled={cartItem.quantity >= product.stockQuantity}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer font-semibold shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product.id, 1)}
                disabled={product.stockQuantity === 0}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer shadow-md shadow-indigo-600/10 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
