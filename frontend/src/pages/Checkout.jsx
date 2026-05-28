import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, CheckCircle2, ShieldCheck, Edit3 } from 'lucide-react';
import { HiArrowLeft } from 'react-icons/hi';
import Navbar from '../components/Navbar';

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
  const deliveryFee = selectedOrderTotal > 0 ? 30 : 0;
  const orderTotal = selectedOrderTotal + deliveryFee;

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  const [addressForm, setAddressForm] = useState({
    fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: ''
  });

  // Selected payment channel state
  const [paymentOption, setPaymentOption] = useState('online');

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

    if (paymentOption !== 'online') {
      setErrorMessage("Selected payment method is unavailable.");
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
      // 1. Create order token on our backend
      const tokenResponse = await API.post('/api/orders/razorpay/create', {
        amount: orderTotal
      });

      const { id: razorpayOrderId, keyId } = tokenResponse.data;

      // 2. Open Razorpay Widget modal options
      const options = {
        key: keyId,
        amount: orderTotal * 100, // in paise
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
          color: '#18181b',
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
    <div className="min-h-screen bg-[#FAF6F0] pb-24 sm:pb-8 flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <main className="flex-grow w-full max-w-md mx-auto px-4 box-border md:max-w-2xl pt-3 pb-8">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between mb-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200/60 shadow-xs text-zinc-800 cursor-pointer"
          >
            <HiArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-xl font-bold text-zinc-950 font-serif tracking-tight">Checkout</h1>
          <div className="w-10" />
        </div>

        <div className="space-y-6">
          
          {/* DELIVER TO PANEL WITH FULL CRUD LISTING & SELECTOR CHECKS */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-xs"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-zinc-950 font-serif tracking-wide uppercase tracking-wider">Deliver to</span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' });
                  setIsAddressFormOpen(true);
                }}
                className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer"
              >
                Add Address
              </motion.button>
            </div>

            {/* Address Selection / Form Area */}
            {isAddressFormOpen ? (
              <form onSubmit={handleAddressSubmit} className="bg-zinc-50/50 border border-zinc-200/80 p-4 rounded-2xl space-y-3 mb-4">
                <h3 className="text-xs font-bold text-zinc-900">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" required placeholder="Full Name" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                  <input type="tel" required placeholder="Phone Number" value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                  <input type="text" required placeholder="Address Line" value={addressForm.addressLine} onChange={e => setAddressForm({...addressForm, addressLine: e.target.value})} className="col-span-1 sm:col-span-2 w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                  <input type="text" required placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                  <div className="flex gap-2">
                    <input type="text" required placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                    <input type="text" required placeholder="Pincode" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => { setIsAddressFormOpen(false); setEditingAddressId(null); setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' }); }} className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-200 rounded-full cursor-pointer">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-[10px] font-semibold text-white bg-zinc-900 rounded-full cursor-pointer">Save Address</button>
                </div>
              </form>
            ) : null}

            {/* Complete Relational saved Addresses stack with active selectors */}
            <div className="space-y-3">
              {addresses.map(addr => (
                <div 
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`flex items-start gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedAddressId === addr.id ? 'border-zinc-950 bg-zinc-50/20' : 'border-zinc-200/60 hover:border-zinc-400'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-zinc-800 shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-900">{addr.fullName}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {addr.addressLine}, {addr.city}, {addr.state} {addr.pincode}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400">Phone: {addr.phoneNumber}</p>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && !isAddressFormOpen && (
                <div className="p-6 border border-dashed border-zinc-200 rounded-3xl text-center text-xs text-zinc-400 leading-relaxed">
                  Please add a shipping address above to complete your transaction.
                </div>
              )}
            </div>
          </motion.div>

          {/* payment option list using radio selector nodes */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-xs space-y-4"
          >
            <span className="text-sm font-bold text-zinc-950 font-serif tracking-wide uppercase tracking-wider block">Payment Method</span>
            
            <div className="space-y-3">
              {/* Option 1: Pay Online (Razorpay Secure) Checked by default */}
              <label 
                className={`flex items-center justify-between p-4 rounded-3xl border cursor-pointer transition-all ${
                  paymentOption === 'online' ? 'border-zinc-950 bg-zinc-50/20' : 'border-zinc-200/60'
                }`}
                onClick={() => setPaymentOption('online')}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="online" 
                    checked={paymentOption === 'online'} 
                    onChange={() => setPaymentOption('online')}
                    className="accent-zinc-950 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Pay Online (Razorpay Secure)</span>
                    <span className="text-[10px] text-zinc-400">Visa / Mastercard / UPI Instantly verified</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-zinc-800 shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
              </label>

              {/* Option 2: Cash on Delivery (COD) Grayed-out */}
              <div className="flex items-center justify-between p-4 rounded-3xl border border-zinc-100 bg-zinc-50/40 opacity-50 select-none">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    disabled 
                    className="accent-zinc-900 cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-400 block">Cash on Delivery (COD)</span>
                    <span className="text-[10px] text-zinc-400">Currently Not Available</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SUMMARY AMOUNT PANEL */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-xs space-y-4"
          >
            <h2 className="text-sm font-bold text-zinc-900 font-serif tracking-wide uppercase tracking-wider mb-2">Amount</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Item total</span>
                <span className="font-bold text-zinc-900">₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Delivery fee</span>
                <span className="font-bold text-zinc-900">₹{deliveryFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-zinc-100 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-bold text-zinc-900 font-serif">Total</span>
              <span className="text-lg font-black text-zinc-950">₹{orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </motion.div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-rose-700 font-semibold text-center">{errorMessage}</div>
          )}

          {/* Place Your Order Solid Charcoal button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={handlePay}
            disabled={isProcessing || !selectedAddressId}
            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-medium py-4 rounded-full shadow-xl transition-all cursor-pointer text-center text-sm tracking-wider font-serif uppercase tracking-widest mt-6"
          >
            {isProcessing ? 'Processing Transaction...' : 'Place Your Order'}
          </motion.button>
        </div>
      </main>

      {/* INTERACTIVE MODALS */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md"
          >
            <div className="w-72 p-6 bg-white rounded-[32px] shadow-2xl flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-4" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900 font-serif">Processing Payment</h3>
              <p className="text-[10px] text-zinc-400 mt-2 text-center leading-relaxed">Verifying transaction securely via Razorpay gateway panel...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-zinc-950 font-serif">Order Confirmed!</h2>
              <p className="text-xs text-zinc-400 mt-1">Receipt ID: <span className="font-mono text-zinc-900">{receiptKey}</span></p>
              <p className="text-[10px] text-zinc-400 mt-4">Redirecting to order dashboard...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
