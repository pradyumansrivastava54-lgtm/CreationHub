import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import { MapPin, Plus, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { fetchCart, cartItems } = useCart();
  const navigate = useNavigate();

  // Redirection guard
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { state: { from: '/checkout' } });
    if (cartItems.length === 0) navigate('/cart');
  }, [isAuthenticated, cartItems, navigate]);

  const selectedOrderTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  const [addressForm, setAddressForm] = useState({
    fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: ''
  });

  // Payment UI State
  const [activeTab, setActiveTab] = useState('online');
  
  // Transaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptKey, setReceiptKey] = useState('');

  // Initial Fetch Addresses
  useEffect(() => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const res = await API.get('/api/addresses');
      setAddresses(res.data);
      if (res.data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(res.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await API.put(`/api/addresses/${editingAddressId}`, addressForm);
      } else {
        const res = await API.post('/api/addresses', addressForm);
        setSelectedAddressId(res.data.id);
      }
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' });
      fetchAddresses();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to save address");
    }
  };

  const handleEditAddress = (addr) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setIsAddressFormOpen(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (e) => {
    e.preventDefault();

    if (!selectedAddressId) {
      setErrorMessage("Please select or add a delivery address first.");
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setIsProcessing(false);
      setErrorMessage("Failed to load Razorpay SDK. Please check your network connection.");
      return;
    }

    try {
      // 1. Create order token on our backend (call /api/orders/razorpay/create)
      const tokenResponse = await API.post('/api/orders/razorpay/create', {
        amount: selectedOrderTotal
      });

      const { id: razorpayOrderId, keyId } = tokenResponse.data;

      // 2. Open Razorpay Widget modal options
      const options = {
        key: keyId || 'rzp_test_mockKey123',
        amount: selectedOrderTotal * 100, // in paise
        currency: 'INR',
        name: 'CreationHub',
        description: 'Premium Lifestyle Gear Purchase',
        order_id: razorpayOrderId,
        handler: async function (response) {
          setIsProcessing(true);
          try {
            // 3. Hit our /api/orders/place to place order, clear cart and mark PAID
            const placeRes = await API.post('/api/orders/place', {
              addressId: selectedAddressId,
              paymentStatus: 'PAID'
            });

            setReceiptKey(placeRes.data.razorpayOrderId || response.razorpay_order_id);
            setIsSuccess(true);
            setIsProcessing(false);
            fetchCart();

            setTimeout(() => {
              navigate('/order-success', { replace: true });
            }, 2500);

          } catch (placeErr) {
            setIsProcessing(false);
            setErrorMessage('Order placement failed: ' + (placeErr.response?.data?.message || placeErr.message));
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setIsProcessing(false);
      setErrorMessage('Failed to initiate transaction: ' + (err.response?.data?.message || err.message));
    }
  };

  if (cartItems.length === 0) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 py-3 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-slate-900 tracking-tight">Secure Checkout</span>
          </div>
          <Link to="/cart" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Return to Cart
          </Link>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Addresses & Forms */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* ADDRESS MANAGER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Delivery Address
              </h2>
              {!isAddressFormOpen && (
                <button 
                  onClick={() => setIsAddressFormOpen(true)}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {/* Address Form */}
            {isAddressFormOpen ? (
              <form onSubmit={handleAddressSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 mb-6">
                <h3 className="text-sm font-bold">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input type="text" required placeholder="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  <input type="tel" required placeholder="Phone Number" value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  <input type="text" required placeholder="Address Line (House, Street)" value={addressForm.addressLine} onChange={e => setAddressForm({...addressForm, addressLine: e.target.value})} className="col-span-1 sm:col-span-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  <input type="text" required placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  <div className="flex gap-4">
                    <input type="text" required placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                    <input type="text" required placeholder="Pincode" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => { setIsAddressFormOpen(false); setEditingAddressId(null); setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' }); }} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer">Save Address</button>
                </div>
              </form>
            ) : null}

            {/* Address List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedAddressId === addr.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {selectedAddressId === addr.id && (
                    <div className="absolute -top-2.5 -right-2.5 bg-white rounded-full">
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-600/10" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-slate-800">{addr.fullName}</h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                      className="text-slate-400 hover:text-indigo-600 p-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[90%]">
                    {addr.addressLine}<br/>
                    {addr.city}, {addr.state} {addr.pincode}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 mt-2">📞 {addr.phoneNumber}</p>
                </div>
              ))}
              {addresses.length === 0 && !isAddressFormOpen && (
                <div className="col-span-full p-6 border-2 border-dashed border-slate-300 rounded-xl text-center">
                  <p className="text-sm text-slate-500 font-medium">No saved addresses found.</p>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT OPTIONS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6">Payment Method</h2>
            
            <div className="p-6 border-2 border-indigo-600 bg-indigo-50/40 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Pay Online</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Secure payment via Razorpay checkout panel</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            
            <div className="max-h-64 overflow-y-auto mb-4 pr-2 space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" onError={e=>{e.target.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-sm text-slate-800 shrink-0">
                    ₹{Number(item.product.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Shipping</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100 mt-2">
                <span>Total to Pay</span>
                <span>₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isProcessing || !selectedAddressId}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PAY NOW
            </button>
          </div>
        </div>
      </main>

      {/* OVERLAYS */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <div className="w-80 p-6 bg-white rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <h3 className="font-bold text-sm uppercase tracking-wide">Processing Payment</h3>
            <p className="text-xs text-slate-500 mt-2 text-center">Verifying transaction securely via Razorpay...</p>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Order Confirmed!</h2>
            <p className="text-sm font-semibold text-slate-500 mb-6">Receipt ID: <span className="font-mono text-slate-800">{receiptKey}</span></p>
            <p className="text-xs text-slate-400">Redirecting to your orders...</p>
          </div>
        </div>
      )}
    </div>
  );
}
