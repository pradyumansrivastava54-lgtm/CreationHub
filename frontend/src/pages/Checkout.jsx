import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';

export default function Checkout() {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const orderData = location.state?.orderData;
  const selectedOrderTotal = orderData ? orderData.amount / 100 : 0;

  // Tabs
  const [activeTab, setActiveTab] = useState('card');

  // Input states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [upiId, setUpiId] = useState('');

  // Transaction States
  const [isProcessing, setIsProcessing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [error, setError] = useState(null);
  const [verificationFailed, setVerificationFailed] = useState(false);

  const axios = API;

  // Protect path if no order details
  useEffect(() => {
    if (!orderData) {
      navigate('/cart');
    }
  }, [orderData, navigate]);

  // Card formatting
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Add spacing after every 4 digits
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)} / ${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCvv(value);
  };

  const handlePay = (e) => {
    e.preventDefault();

    // Basic Validation
    if (activeTab === 'card') {
      if (cardNumber.length < 19) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (expiry.length < 7) {
        setErrorMessage('Please enter card expiry (MM / YY).');
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVV.');
        return;
      }
      if (!cardName.trim()) {
        setErrorMessage("Please enter the cardholder's name.");
        return;
      }
    } else if (activeTab === 'netbanking' && !selectedBank) {
      setErrorMessage('Please select a banking partner to proceed.');
      return;
    } else if (activeTab === 'wallet' && !selectedWallet) {
      setErrorMessage('Please select an active e-wallet wallet.');
      return;
    } else if (activeTab === 'upi' && (!upiId.trim() || !upiId.includes('@'))) {
      setErrorMessage('Please enter a valid UPI address (e.g. name@bank).');
      return;
    }

    setErrorMessage('');
    setError(null);
    setIsProcessing(true);
    setSuccess(false);
    setIsSuccess(false);
    setVerificationFailed(false);
    setTerminalLogs(['Connecting securely to payment gateway...']);

    // Log streaming simulation
    const logs = [
      'Establishing secure handshake using SSL TLS v1.3...',
      'Encrypting payment tokens & card attributes...',
      'Authorizing Security Transaction with Bank...',
      'Awaiting banking settlement authorization logs...',
      'Transaction approved. Settlement recorded!'
    ];

    logs.forEach((logText, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, logText]);
      }, (index + 1) * 300);
    });

    const payload = {
      razorpayOrderId: orderData.razorpayOrderId,
      razorpayPaymentId: 'pay_mock_' + Date.now(),
      razorpaySignature: 'sig_mock_' + Math.random().toString(36).substring(2, 12)
    };

    // Standard try-catch sequence wrapping the verification
    const executeVerification = async () => {
      try {
        const response = await axios.post('/api/orders/verify', payload);

        // 2. Handle Success & Block Stale Renders:
        // First, immediately enforce:
        setError(null);
        setErrorMessage('');
        setVerificationFailed(false);

        // Next, set the success overlay state and stop processing animation:
        setSuccess(true);
        setIsSuccess(true);
        setIsProcessing(false);
        fetchCart();

        // Implement a mandatory layout hold using a setTimeout clock set for exactly 2500 milliseconds
        setTimeout(() => {
          navigate('/orders', { replace: true });
        }, 2500);

      } catch (err) {
        // 3. Correct the Error/Catch Sequence:
        // Move any setError(...) trigger strictly inside the catch (err) block.
        console.error('Payment verification failed:', err);
        setIsProcessing(false);
        setSuccess(false);
        setIsSuccess(false);
        setVerificationFailed(true);
        
        const failureMessage = 'Bank Verification Failed: ' + (err.response?.data?.message || err.message || 'Unexpected Error');
        setError(new Error(failureMessage));
        setErrorMessage(failureMessage);
      }
    };

    executeVerification();
  };

  if (!orderData) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Mini Razorpay Navbar */}
      <nav className="bg-white border-b border-slate-200 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-extrabold text-lg shadow-sm">R</div>
            <span className="font-bold text-slate-900 tracking-tight">razorpay <span className="text-blue-500 font-semibold text-xs border border-blue-200 px-1 rounded ml-1">Hosted</span></span>
          </div>
          <Link to="/cart" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Cancel & Return
          </Link>
        </div>
      </nav>

      {/* Main Replication Window */}
      <main className="flex-1 flex items-center justify-center p-4 py-8 md:py-16">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* LEFT OPTION PANEL */}
          <div className="w-full md:w-2/5 bg-slate-100/70 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">Fit Fusion HUB</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{user?.username}</p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">ALL PAYMENT OPTIONS</span>
              <div className="mt-4 space-y-2.5">
                {/* Credit/Debit Card Option */}
                <button
                  onClick={() => { setActiveTab('card'); setErrorMessage(''); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    activeTab === 'card'
                      ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'bg-transparent border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === 'card' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">Credit/Debit Card</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-none">Visa, Mastercard, Maestro, Rupay</p>
                  </div>
                </button>

                {/* Netbanking Option */}
                <button
                  onClick={() => { setActiveTab('netbanking'); setErrorMessage(''); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    activeTab === 'netbanking'
                      ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'bg-transparent border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === 'netbanking' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">Netbanking</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-none">Pay with Internet Banking Account</p>
                  </div>
                </button>

                {/* Wallet Option */}
                <button
                  onClick={() => { setActiveTab('wallet'); setErrorMessage(''); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    activeTab === 'wallet'
                      ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'bg-transparent border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === 'wallet' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">Wallet</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-none">Pay using a Wallet</p>
                  </div>
                </button>

                {/* UPI Option */}
                <button
                  onClick={() => { setActiveTab('upi'); setErrorMessage(''); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 cursor-pointer ${
                    activeTab === 'upi'
                      ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/10'
                      : 'bg-transparent border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === 'upi' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                    <span className="font-black text-xs text-blue-500 border border-blue-400 rounded px-0.5 tracking-tighter">UPI</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">UPI</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-none">Pay using BHIM, Tez and other UPI apps</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 hidden md:block">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 justify-center">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                100% PCI-DSS Secure Compliance
              </span>
            </div>
          </div>

          {/* RIGHT CONTEXT PANEL */}
          <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between">
            {/* Amount Payable Title */}
            <div className="pb-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-slate-400 font-semibold text-xs tracking-wide uppercase">Amount payable</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
              </div>
              <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Test Mode
              </div>
            </div>

            {/* Error Message banner */}
            {(errorMessage || error) && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                {error ? (error.message || String(error)) : errorMessage}
              </div>
            )}

            {/* Forms mapped to selection */}
            <form onSubmit={handlePay} className="flex-1 mt-6">
              {activeTab === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                        <span className="text-[10px] text-slate-400 font-bold border border-slate-200 rounded px-1 py-0.5">VISA</span>
                        <span className="text-[10px] text-slate-400 font-bold border border-slate-200 rounded px-1 py-0.5">MC</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">CVV Code</label>
                      <input
                        type="password"
                        placeholder="***"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 font-mono tracking-widest focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Cardholder's Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {activeTab === 'netbanking' && (
                <div className="space-y-4">
                  <span className="block text-slate-400 text-xs font-medium uppercase tracking-wide">Popular Banks</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'sbi', name: 'SBI', code: 'State Bank of India' },
                      { id: 'hdfc', name: 'HDFC', code: 'HDFC Bank' },
                      { id: 'icici', name: 'ICICI', code: 'ICICI Bank' },
                      { id: 'axis', name: 'AXIS', code: 'Axis Bank' },
                      { id: 'kotak', name: 'KOTAK', code: 'Kotak Mahindra' },
                      { id: 'pnb', name: 'PNB', code: 'Punjab National Bank' }
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`p-3 border rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          selectedBank === bank.id
                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px] shadow-2xs">
                          {bank.name}
                        </div>
                        <span className="text-[10px] font-bold text-center mt-1.5 leading-none">{bank.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Or Choose another Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-xs font-semibold cursor-pointer"
                    >
                      <option value="">Select Bank Account</option>
                      <option value="yes">Yes Bank</option>
                      <option value="indusind">IndusInd Bank</option>
                      <option value="boi">Bank of India</option>
                      <option value="canara">Canara Bank</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-4">
                  <span className="block text-slate-400 text-xs font-medium uppercase tracking-wide">Popular E-Wallets</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'phonepe', name: 'PhonePe', details: 'Direct Linked Wallet' },
                      { id: 'paytm', name: 'Paytm Wallet', details: 'Pay using Paytm balance' },
                      { id: 'amazon', name: 'Amazon Pay', details: 'Requires Amazon Sign-in' },
                      { id: 'mobikwik', name: 'MobiKwik', details: 'SuperCash & wallet funds' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w.id)}
                        className={`p-4 border rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                          selectedWallet === w.id
                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px]">W</div>
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-800">{w.name}</h5>
                          <p className="text-[9px] text-slate-500 font-medium leading-none mt-0.5">{w.details}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'upi' && (
                <div className="space-y-5 text-center">
                  <div className="flex justify-center mb-1">
                    <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center relative group p-3 shadow-inner">
                      {/* Fake QR code vector representation */}
                      <div className="grid grid-cols-4 gap-1 w-full h-full opacity-60">
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-transparent"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-transparent"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-transparent"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-transparent"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                        <div className="bg-transparent"></div>
                        <div className="bg-slate-800 rounded-xs"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">SCAN ME</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs leading-normal max-w-sm mx-auto font-medium">Scan QR code using any UPI app or type your UPI ID address below.</p>

                  <div className="text-left">
                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Enter Virtual Payment Address (VPA)</label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@ybl or user@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white placeholder-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* PAY NOW Hex Blue Tint CTA */}
              <button
                type="submit"
                className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-8 cursor-pointer border border-blue-700"
              >
                <svg className="w-4 h-4 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                PAY NOW ₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* TRANSACTION STATE OVERLAYS */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md transition-all duration-300">
          <div className="w-80 p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
            {/* Spinner */}
            <div className="relative w-14 h-14 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-l-blue-500 animate-spin"></div>
            </div>
            
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">Processing Secure Payment</h3>
            <p className="text-slate-400 text-xs text-center mt-1 leading-normal font-medium">Please do not refresh or close this tab...</p>

            {/* Terminal logs streaming block */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-5 font-mono text-[9px] text-blue-400 leading-normal h-24 overflow-y-auto shadow-inner select-none">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="flex gap-1.5 items-start mt-0.5 first:mt-0">
                  <span className="text-slate-600 font-bold shrink-0">&gt;</span>
                  <span className="animate-fade-in">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(isSuccess || success) && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs transition-all duration-300 animate-fade-in">
          <div className="w-full max-w-sm p-8 text-center flex flex-col items-center">
            
            {/* Concentric success checks */}
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative animate-bounce">
              <div className="absolute inset-2 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Successful! 🎉</h2>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-xs font-semibold">
              Thank you for your purchase. We are completing database sync and transferring you to your order receipt logbook...
            </p>

            {/* Mini invoice block */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4.5 mt-8 text-left space-y-2 select-none shadow-2xs">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Receipt Key</span>
                <span className="text-slate-700 font-mono">pay_mock_{orderData.razorpayOrderId.split('_')[1]}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Verification Order ID</span>
                <span className="text-slate-700 font-mono">{orderData.razorpayOrderId}</span>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex justify-between text-xs text-slate-500 font-extrabold uppercase">
                <span>Settled Amount</span>
                <span className="text-blue-600 font-black">₹{selectedOrderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
