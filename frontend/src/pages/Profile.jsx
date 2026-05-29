import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Trash2, Edit2, Plus, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API from '../services/api';

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Tab state: 'info' | 'addresses'
  const [activeTab, setActiveTab] = useState('info');

  // Personal Info Form state
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState({ type: '', text: '' });

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: ''
  });

  // Sync profile details if user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Load saved Addresses on mount
  useEffect(() => {
    if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const res = await API.get('/api/addresses');
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMsg({ type: '', text: '' });
    try {
      const res = await API.put('/api/auth/profile', profileForm);
      setInfoMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update Auth context user state by refreshing session details
      if (user) {
        const updatedUser = { ...user, username: res.data.username, email: res.data.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('storage')); // Broadcast storage update
      }
    } catch (err) {
      console.error('Failed to update profile details:', err);
      setInfoMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update credentials.' });
    } finally {
      setInfoLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await API.put(`/api/addresses/${editingAddressId}`, addressForm);
      } else {
        await API.post('/api/addresses', addressForm);
      }
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' });
      fetchAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Failed to save address details.');
    }
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      fullName: addr.fullName,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phoneNumber: addr.phoneNumber
    });
    setEditingAddressId(addr.id);
    setIsAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to permanently delete this delivery address?')) return;
    try {
      await API.delete(`/api/addresses/${addressId}`);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Failed to delete address.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-24 sm:pb-8 flex flex-col justify-between font-sans">
      <div>
        <Navbar />

        <main className="flex-grow w-full max-w-md mx-auto px-4 box-border md:max-w-2xl pt-3 pb-12">
          {/* Header strip */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-zinc-200/60 shadow-xs text-zinc-800 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-xl font-bold text-zinc-955 font-serif tracking-tight">My Profile</h1>
            <div className="w-10" />
          </div>

          {/* Premium Dual Tab Switch */}
          <div className="flex bg-white/70 border border-zinc-200/50 p-1.5 rounded-full mb-8 shadow-xs">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-zinc-950 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              My Addresses
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB 1: PERSONAL INFO */}
            {activeTab === 'info' && (
              <motion.div
                key="tab-info"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-xs space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center text-white text-base font-serif font-black shadow-xs">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-950 font-serif">Credentials Console</h2>
                    <p className="text-[10px] text-zinc-400">View and update active session parameters</p>
                  </div>
                </div>

                {infoMsg.text && (
                  <div className={`p-3 border rounded-2xl text-xs text-center font-bold ${
                    infoMsg.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : 'bg-red-50 border-red-200 text-rose-700'
                  }`}>
                    {infoMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Username Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      placeholder="Your unique handle"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-850 font-bold focus:border-zinc-800 transition-all focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs text-zinc-850 font-bold focus:border-zinc-800 transition-all focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={infoLoading}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full py-4 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {infoLoading ? 'Saving Credentials...' : 'Save Profile Changes'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB 2: MY ADDRESSES */}
            {activeTab === 'addresses' && (
              <motion.div
                key="tab-addresses"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                {/* DELIVER TO PANEL WITH FULL CRUD LISTING & SELECTOR CHECKS */}
                <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-xs">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-xs font-bold text-zinc-950 font-serif tracking-wide uppercase tracking-widest">Saved Addresses</span>
                    {!isAddressFormOpen && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setEditingAddressId(null);
                          setAddressForm({ fullName: '', addressLine: '', city: '', state: '', pincode: '', phoneNumber: '' });
                          setIsAddressFormOpen(true);
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add New
                      </motion.button>
                    )}
                  </div>

                  {/* Add / Edit Address form inline */}
                  {isAddressFormOpen && (
                    <form onSubmit={handleAddressSubmit} className="bg-zinc-50 border border-zinc-200/80 p-4 rounded-3xl space-y-3 mb-6 animate-slide-up">
                      <h3 className="text-xs font-bold text-zinc-900 font-serif uppercase tracking-wider">{editingAddressId ? 'Edit saved address' : 'Add new address'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" required placeholder="Full Name *" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                        <input type="tel" required placeholder="Phone Number *" value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                        <input type="text" required placeholder="Address Line *" value={addressForm.addressLine} onChange={e => setAddressForm({...addressForm, addressLine: e.target.value})} className="col-span-1 sm:col-span-2 w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                        <input type="text" required placeholder="City *" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                        <div className="flex gap-2">
                          <input type="text" required placeholder="State *" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                          <input type="text" required placeholder="Pincode *" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} className="w-1/2 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => { setIsAddressFormOpen(false); setEditingAddressId(null); }} className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-200 rounded-full cursor-pointer">Cancel</button>
                        <button type="submit" className="px-3.5 py-1.5 text-[10px] font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-full cursor-pointer uppercase tracking-wider">Save Address</button>
                      </div>
                    </form>
                  )}

                  {/* Loop saved Addresses */}
                  {addressLoading ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="p-8 border border-dashed border-zinc-200 rounded-3xl text-center text-xs text-zinc-400 leading-relaxed font-serif italic">
                      No saved delivery addresses yet. Add one above to get started!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map(addr => (
                        <div
                          key={addr.id}
                          className="flex items-start gap-4 p-4 rounded-3xl border border-zinc-150 bg-[#FDFBF7]/30 hover:border-zinc-300 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center text-zinc-800 shrink-0 mt-0.5 border border-zinc-200/50">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-900">{addr.fullName}</span>
                              
                              {/* Edit & Delete Action Nodes */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleEditAddress(addr)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                  title="Edit Address"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-55/70 transition-all cursor-pointer"
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-550 leading-relaxed">
                              {addr.addressLine}, {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-400">Phone: {addr.phoneNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <Footer />
    </div>
  );
}
