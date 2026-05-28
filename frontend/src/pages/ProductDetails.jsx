import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import Navbar from '../components/Navbar';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, addToCart, updateQuantity, totalCartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Failed to fetch product details:', err);
        setError(err.response?.data?.message || 'Product not found or offline server connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const cartItem = cartItems.find((item) => item.product.id === product?.id);

  const handleAddToCart = async () => {
    if (!product) return;
    const success = await addToCart(product.id, quantity);
    if (success) {
      setQuantity(1); // Reset local selector quantity
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Failed to load product</h2>
        <p className="text-text-secondary mb-6 text-center max-w-md">{error || 'The requested product does not exist.'}</p>
        <Link to="/" className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-all">
          Go Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24 sm:pb-8">
      {/* ── Navigation Bar ── */}
      <Navbar />

      {/* ── Main Layout ───────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start bg-surface-card border border-border rounded-3xl p-8 lg:p-12 shadow-2xl">
          {/* Left Column: Product Image */}
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-surface relative border border-border">
            <img
              src={product.imageUrl || fallbackImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackImage;
              }}
            />

            {/* Floating Stock Badge */}
            {product.stockQuantity === 0 ? (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-danger text-white text-xs font-bold rounded-lg shadow-lg">
                Out of Stock
              </span>
            ) : product.stockQuantity <= 5 ? (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg">
                Only {product.stockQuantity} Left
              </span>
            ) : (
              <span className="absolute top-4 left-4 px-3.5 py-1.5 bg-success text-white text-xs font-bold rounded-lg shadow-lg">
                In Stock
              </span>
            )}
          </div>

          {/* Right Column: Details & Adding Workflow */}
          <div className="space-y-6 flex flex-col justify-between h-full">
            <div>
              {/* Name */}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-text-primary leading-tight">
                {product.name}
              </h1>

              {/* Price Tags */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-primary">
                  ₹{Number(product.price).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-text-muted">Incl. of all taxes</span>
              </div>

              {/* Description */}
              <div className="mt-8 pt-8 border-t border-border space-y-3">
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Product Details</h3>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {product.description || 'No description has been added for this product yet.'}
                </p>
              </div>
            </div>

            {/* Add to Cart Layout Box */}
            <div className="mt-8 pt-8 border-t border-border space-y-6">
              {user?.role === 'ROLE_ADMIN' ? (
                <div className="flex items-center justify-center py-4 px-6 bg-slate-100 border border-slate-200 text-slate-400 text-sm font-bold rounded-2xl shadow-inner select-none tracking-wide text-center">
                  Admin View Only
                </div>
              ) : cartItem ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border">
                    <div>
                      <p className="text-sm text-text-muted">Already in Cart</p>
                      <p className="text-base font-bold text-text-primary">{cartItem.quantity} unit{cartItem.quantity > 1 ? 's' : ''}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-surface-input rounded-xl p-1.5">
                      <button
                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                        disabled={cartItem.quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface-card rounded-lg disabled:opacity-40 transition-colors cursor-pointer text-lg font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-base font-bold">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                        disabled={cartItem.quantity >= product.stockQuantity}
                        className="w-10 h-10 flex items-center justify-center text-text-primary hover:bg-surface-card rounded-lg disabled:opacity-40 transition-colors cursor-pointer text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <Link
                    to="/cart"
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    View Cart & Checkout
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  {product.stockQuantity > 0 && (
                    <div className="flex items-center justify-between border border-border rounded-xl p-1 bg-surface-input min-w-32">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-text-primary disabled:opacity-40 cursor-pointer text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-base font-bold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                        disabled={quantity >= product.stockQuantity}
                        className="w-10 h-10 flex items-center justify-center text-text-primary disabled:opacity-40 cursor-pointer text-lg"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleAddToCart}
                    disabled={product.stockQuantity === 0}
                    className="flex-1 py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>

                  {product.stockQuantity > 0 && (
                    <button
                      onClick={async () => {
                        await addToCart(product.id, quantity);
                        navigate('/cart');
                      }}
                      className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
