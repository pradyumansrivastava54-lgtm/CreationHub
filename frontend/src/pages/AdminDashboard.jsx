import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OrdersFulfillmentTab from '../components/OrdersFulfillmentTab';
import API from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab navigation: 'analytics' | 'catalog' | 'orders' | 'add-product' | 'users'
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    if (location.state?.activeTab === 'orders') {
      setActiveTab('orders');
    }
  }, [location.state]);

  // Users state (for user role management)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Products state (for catalog tab)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    lowStockProducts: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Add Product Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    category: '',
  });

  const DEFAULT_CATEGORIES = ['Smart Devices', 'Audio Gear', 'Premium Wearables', 'Gaming Setup'];

  const getUniqueCategories = () => {
    const set = new Set(DEFAULT_CATEGORIES);
    products.forEach(p => {
      if (p.category && p.category.trim() !== '') {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  };

  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [showEditNewCategoryField, setShowEditNewCategoryField] = useState(false);
  const [editNewCategoryName, setEditNewCategoryName] = useState('');

  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogSelectedCategory, setCatalogSelectedCategory] = useState('All');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);

  // Customer History State
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleViewUserHistory = async (userObj) => {
    setSelectedUserForHistory(userObj);
    setHistoryLoading(true);
    setUserHistory([]);
    try {
      const response = await API.get(`/api/admin/users/${userObj.id}/history`);
      setUserHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch user history:', err);
      alert('Failed to load customer history logs.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const handleBroadcastCampaign = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert('Please fill out both Subject and Message fields.');
      return;
    }
    setBroadcastLoading(true);
    try {
      await API.post('/api/admin/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
      });
      alert('Campaign successfully broadcasted to all active users!');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error('Failed to dispatch campaign:', err);
      alert(err.response?.data?.error || 'Failed to dispatch broadcast marketing campaign.');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch functions
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await API.get('/api/admin/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to fetch admin analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      // Fetch products without page limit for admin panel
      const response = await API.get('/api/products', {
        params: { page: 0, size: 100 },
      });
      setProducts(response.data.content);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const response = await API.get('/api/admin/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await API.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, [fetchAnalytics, fetchProducts, fetchOrders, fetchUsers]);

  useEffect(() => {
    if (location.pathname === '/admin/users') {
      setActiveTab('users');
    }
  }, [location.pathname]);

  const handleUpdateUserRole = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await API.put(`/api/admin/users/${userId}/role`, { role: newRole }, {
        params: { role: newRole }
      });
      alert('User role updated successfully!');
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert(err.response?.data?.error || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const activeCategory = showNewCategoryField && newCategoryName.trim() !== '' 
        ? newCategoryName.trim() 
        : formData.category;

      await API.post('/api/products', {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stockQuantity: Math.floor(Number(formData.stockQuantity)),
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        category: activeCategory,
      });

      setSuccessMsg('Product Added Successfully!');
      alert('Product Added Successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        imageUrl: '',
        category: '',
      });
      setNewCategoryName('');
      setShowNewCategoryField(false);
      fetchProducts();
      fetchAnalytics();
      setActiveTab('catalog'); // Switch to catalog to see it
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this product?')) return;
    try {
      await API.delete(`/api/products/${productId}`);
      alert('Product Deleted Successfully!');
      fetchProducts();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    }
  };

  const handleUpdateStock = async (productId, quantityChange) => {
    try {
      await API.patch(`/api/products/${productId}/stock`, { quantityChange });
      fetchProducts();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update stock quantity.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    }
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const activeCategory = showEditNewCategoryField && editNewCategoryName.trim() !== ''
        ? editNewCategoryName.trim()
        : editingProduct.category;

      const payload = {
        ...editingProduct,
        category: activeCategory,
      };

      await API.put(`/api/products/${editingProduct.id}`, payload);
      alert('Product updated successfully!');
      setEditingProduct(null);
      setEditNewCategoryName('');
      setShowEditNewCategoryField(false);
      fetchProducts();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update product details.');
    }
  };

  const hasPlacedOrders = orders.some(o => (o.orderStatus || 'PLACED') === 'PLACED');

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Navbar ────────────────────────────── */}
      <nav className="border-b border-border bg-surface-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="text-lg font-bold text-text-primary">Back to Store</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-text-primary font-medium">{user?.username}</p>
                  <p className="text-text-muted text-xs">Admin Console</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg rounded-lg cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Sub Navigation Tabs ───────────────── */}
      <div className="bg-surface-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 h-12 overflow-x-auto">
          {[
            { id: 'analytics', label: 'Dashboard & Analytics' },
            { id: 'catalog', label: 'Manage Catalog' },
            { id: 'orders', label: 'Orders Fulfillment' },
            { id: 'add-product', label: 'Add New Product' },
            { id: 'users', label: 'User Roles (RBAC)' },
            { id: 'marketing', label: 'Marketing & Announcements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-full border-b-2 font-medium text-sm flex items-center shrink-0 cursor-pointer transition-all relative ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.id === 'orders' && hasPlacedOrders && (
                <span className="bg-red-500 rounded-full absolute top-1 right-2 w-2.5 h-2.5 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard Content ─────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* TAB 1: ANALYTICS & DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-slide-up">
            {/* Summary Widget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Card */}
              <div className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-lg">
                <div className="w-14 h-14 bg-success-bg text-success rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Total Sales (Paid)</p>
                  <h3 className="text-3xl font-black text-text-primary mt-1">
                    ₹{Number(analytics.totalRevenue || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </div>
              </div>

              {/* Orders count */}
              <div className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-lg">
                <div className="w-14 h-14 bg-primary/25 text-primary rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Total Transactions</p>
                  <h3 className="text-3xl font-black text-text-primary mt-1">{analytics.totalOrders}</h3>
                </div>
              </div>

              {/* Low stock indicators */}
              <div className="bg-surface-card border border-border p-6 rounded-2xl flex items-center gap-5 shadow-lg">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                  analytics.lowStockProducts?.length > 0 ? 'bg-danger-bg text-danger animate-pulse' : 'bg-success-bg text-success'
                }`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">Low Stock Items</p>
                  <h3 className="text-3xl font-black text-text-primary mt-1">{analytics.lowStockProducts?.length || 0}</h3>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {analytics.lowStockProducts?.length > 0 && (
              <div className="bg-danger-bg/25 border border-danger/35 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-danger flex items-center gap-2 mb-4">
                  ⚠️ Live Warehouse Re-Order Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.lowStockProducts.map((p) => (
                    <div key={p.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-text-primary font-bold truncate text-sm">{p.name}</p>
                        <p className="text-text-muted text-xs mt-0.5">Current Stock: <span className="text-danger font-bold">{p.stockQuantity}</span></p>
                      </div>
                      <button
                        onClick={() => handleUpdateStock(p.id, 10)}
                        className="px-3 py-1.5 bg-primary/20 hover:bg-primary/45 text-primary font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Quick Restock +10
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface-card border border-border rounded-3xl p-6 lg:p-8">
              <h3 className="text-xl font-extrabold text-text-primary mb-6">Consolidated Operations Overview</h3>
              <p className="text-text-secondary leading-relaxed max-w-3xl">
                Welcome to the CreationHub Administration Engine. This dashboard allows real-time execution of product lifecycle parameters,
                warehouse catalog updates, transaction fulfillment tracking, and sales analytics. Use the tabs above to manage the live cluster.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE CATALOG */}
        {activeTab === 'catalog' && (() => {
          const filteredCatalogProducts = products.filter(p => {
            const categoryMatch = catalogSelectedCategory === 'All' || p.category === catalogSelectedCategory;
            const query = catalogSearchQuery.toLowerCase().trim();
            const nameMatch = p.name?.toLowerCase().includes(query);
            const descMatch = p.description?.toLowerCase().includes(query);
            const catMatch = p.category?.toLowerCase().includes(query);
            return categoryMatch && (nameMatch || descMatch || catMatch);
          });

          const groups = {};
          filteredCatalogProducts.forEach(p => {
            const cat = p.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
          });

          return (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text-primary">Warehouse Catalog Management</h2>
                <button
                  onClick={fetchProducts}
                  className="px-4 py-2 bg-surface-input border border-border hover:border-primary/50 rounded-xl text-xs font-semibold text-text-primary transition-all cursor-pointer"
                >
                  Refresh Data
                </button>
              </div>

              {/* Dynamic Filter and Search Control Row */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="w-full sm:w-64">
                  <select
                    value={catalogSelectedCategory}
                    onChange={(e) => setCatalogSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary text-xs font-bold cursor-pointer focus:border-primary transition-all"
                  >
                    <option value="All">All Categories</option>
                    {getUniqueCategories().map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Search product name or category..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary text-xs focus:border-primary placeholder-text-muted transition-all"
                  />
                </div>
              </div>

              {productsLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredCatalogProducts.length === 0 ? (
                <div className="bg-surface-card border border-border p-12 text-center rounded-2xl">
                  <p className="text-text-secondary text-base">No matching products found inside database.</p>
                </div>
              ) : (
                <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-surface text-text-muted text-xs uppercase font-bold tracking-wider">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Product Details</th>
                          <th className="px-6 py-4">Price</th>
                          <th className="px-6 py-4 text-center">Stock Level</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {Object.keys(groups).sort().map((catName) => (
                          <React.Fragment key={catName}>
                            {/* Structured Category divider header row block with item count badge */}
                            <tr className="bg-slate-50 border-y border-border">
                              <td colSpan="5" className="px-6 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 rounded-full px-3 py-1 shadow-xs">
                                    {catName}
                                  </span>
                                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    ({groups[catName].length} item{groups[catName].length > 1 ? 's' : ''})
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {groups[catName].map((p) => (
                              <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                                <td className="px-6 py-4 text-text-secondary font-mono">#{p.id}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=40&q=80'}
                                      alt=""
                                      className="w-10 h-10 object-cover rounded-lg border border-border"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-text-primary truncate max-w-xs">{p.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded uppercase">
                                          {p.category || 'General'}
                                        </span>
                                        <p className="text-text-muted text-xs truncate max-w-[200px]">{p.description || 'No description'}</p>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-primary font-bold">₹{Number(p.price).toFixed(2)}</td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-3">
                                    <button
                                      onClick={() => handleUpdateStock(p.id, -1)}
                                      className="w-7 h-7 flex items-center justify-center bg-surface-input border border-border hover:bg-surface-card rounded-md font-bold text-text-primary cursor-pointer active:scale-90"
                                    >
                                      -
                                    </button>
                                    <span className={`w-10 text-center font-extrabold ${p.stockQuantity < 5 ? 'text-danger' : 'text-text-primary'}`}>
                                      {p.stockQuantity}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateStock(p.id, 1)}
                                      className="w-7 h-7 flex items-center justify-center bg-surface-input border border-border hover:bg-surface-card rounded-md font-bold text-text-primary cursor-pointer active:scale-90"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  <button
                                    onClick={() => setEditingProduct(p)}
                                    className="px-3 py-1.5 bg-primary/20 hover:bg-primary/35 text-primary font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-3 py-1.5 bg-danger-bg hover:bg-danger/35 text-danger font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <OrdersFulfillmentTab orders={orders} ordersLoading={ordersLoading} fetchOrders={fetchOrders} handleUpdateOrderStatus={handleUpdateOrderStatus} />
        )}

        {/* TAB 4: ADD NEW PRODUCT */}
        {activeTab === 'add-product' && (
          <div className="max-w-3xl mx-auto py-6 animate-slide-up">
            <div className="bg-surface-card border border-border rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-text-primary mb-6">Create New Catalog Product</h3>
              
              {errorMsg && (
                <div className="mb-6 p-4 bg-danger-bg border border-danger/30 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-danger text-sm">{errorMsg}</p>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 bg-success-bg border border-success/30 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-success text-sm">{successMsg}</p>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Wireless Headset"
                    className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Select Category *</label>
                  {!showNewCategoryField ? (
                    <div className="space-y-2">
                      <select
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary focus:border-primary transition-all cursor-pointer font-medium"
                      >
                        <option value="">-- Choose Category --</option>
                        {getUniqueCategories().map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryField(true)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer block mt-1"
                      >
                        + Add New Category
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-slate-50 border border-slate-200/50 p-4 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-secondary">Type Custom Category Name</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryField(false);
                            setNewCategoryName('');
                          }}
                          className="text-xs font-bold text-danger hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Mechanical Keyboards"
                        className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-text-primary focus:border-primary transition-all"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Describe product details..."
                    className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Price (INR) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-text-secondary font-medium">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        name="price"
                        required
                        value={formData.price}
                        onChange={handleFormChange}
                        placeholder="299.99"
                        className="w-full pl-8 pr-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Stock Quantity *</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      required
                      value={formData.stockQuantity}
                      onChange={handleFormChange}
                      placeholder="50"
                      className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">Image URL / base64 string</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    placeholder="https://example.com/product.jpg"
                    className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: USER ROLE MANAGEMENT (RBAC) */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Enterprise Role-Based Access Control (RBAC)</h2>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-surface-input border border-border hover:border-primary/50 rounded-xl text-xs font-semibold text-text-primary transition-all cursor-pointer"
              >
                Refresh Users
              </button>
            </div>

            {usersLoading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="bg-surface-card border border-border p-12 text-center rounded-2xl">
                <p className="text-text-secondary text-base">No registered users found inside database.</p>
              </div>
            ) : (
              <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface text-text-muted text-xs uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">User ID</th>
                        <th className="px-6 py-4">Username</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4 text-right">Administrative Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-6 py-4 text-text-secondary font-mono">#{u.id}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-text-primary">{u.username}</span>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleViewUserHistory(u)}
                                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                View History
                              </button>
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-border bg-surface-input text-text-primary cursor-pointer transition-colors focus:border-primary ${
                                  u.role === 'ROLE_ADMIN'
                                    ? 'text-primary border-primary/30 bg-primary/5'
                                    : 'text-text-secondary border-border bg-surface'
                                }`}
                              >
                                <option value="ROLE_USER">USER</option>
                                <option value="ROLE_ADMIN">ADMIN</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MARKETING & ANNOUNCEMENTS */}
        {activeTab === 'marketing' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Admin Broadcast Marketing Console</h2>
            </div>

            <div className="bg-surface-card border border-border p-6 rounded-2xl shadow-lg max-w-2xl">
              <h3 className="text-lg font-bold text-text-primary mb-4">Create System-wide Broadcast</h3>
              <p className="text-xs text-text-secondary mb-6">
                Draft a promotional campaign or emergency announcement. Clicking broadcast will trigger an asynchronous background parallel loop to email all active consumers directly in a single stroke.
              </p>

              <form onSubmit={handleBroadcastCampaign} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Campaign Subject / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exclusive Weekend Sale: Get 25% Off Premium Gear!"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Offer Message Context</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Provide detailed campaign body text or promotional announcement message context..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-input border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-primary transition-all resize-none text-sm leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcastLoading}
                  className="px-6 py-3 bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 text-sm shadow-md"
                >
                  {broadcastLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    'Broadcast Campaign Live'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ── EDIT PRODUCT MODAL DIALOG ──────────── */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-border w-full max-w-lg rounded-2xl p-6 space-y-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-bold text-text-primary">Edit Product Parameters</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Product Category</label>
                {!showEditNewCategoryField ? (
                  <div className="space-y-1">
                    <select
                      required
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary cursor-pointer focus:border-primary transition-all font-medium"
                    >
                      <option value="">-- Select Category --</option>
                      {getUniqueCategories().map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowEditNewCategoryField(true)}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer block mt-1"
                    >
                      + Add New Category
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">Type Custom Category Name</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditNewCategoryField(false);
                          setEditNewCategoryName('');
                        }}
                        className="text-[10px] font-bold text-danger hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={editNewCategoryName}
                      onChange={(e) => setEditNewCategoryName(e.target.value)}
                      placeholder="e.g. Mechanical Keyboards"
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-text-primary focus:border-primary transition-all"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: Math.floor(Number(e.target.value)) })}
                    className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Image URL / base64 string</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-input border border-border rounded-xl text-text-primary"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-surface-input hover:bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Customer Purchase History Modal */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred Backdrop */}
          <div 
            onClick={() => setSelectedUserForHistory(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Modal Content */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden z-10 flex flex-col animate-scale-up">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Customer Purchase History</h3>
                <p className="text-xs text-slate-500 mt-1">Viewing order trail for <span className="font-bold text-indigo-600">@{selectedUserForHistory.username}</span> ({selectedUserForHistory.email})</p>
              </div>
              <button 
                onClick={() => setSelectedUserForHistory(null)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6 max-h-[60vh]">
              {historyLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 mt-3 font-semibold tracking-wide uppercase">Retrieving Order Logs...</p>
                </div>
              ) : userHistory.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 p-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <p className="text-sm font-bold text-slate-700">No Orders Placed Yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">This customer account has not initialized any online purchases on the storefront.</p>
                </div>
              ) : (
                <>
                  {/* Top Metrics Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders Placed</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{userHistory.length}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Lifetime Value (LTV)</p>
                      <p className="text-2xl font-black text-indigo-600 mt-1">
                        ₹{userHistory.reduce((sum, o) => sum + (o.totalOrderCost || 0), 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Vertical History Stream */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Historical Order Stream</h4>
                    <div className="space-y-3">
                      {userHistory.map((o) => (
                        <div key={o.orderId} className="p-4 border border-slate-100 bg-white hover:border-slate-200 rounded-2xl shadow-xs transition-all space-y-3">
                          
                          {/* Top Row: Order ID & Date */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#{o.orderId}</span>
                              <span className="text-[11px] text-slate-400 ml-2 font-medium">{new Date(o.executionTimestamp).toLocaleString()}</span>
                            </div>
                            <span className="text-sm font-black text-slate-800">
                              ₹{Number(o.totalOrderCost).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </span>
                          </div>

                          {/* Middle Row: Products */}
                          <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchased Products</p>
                            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                              {o.productNames && o.productNames.length > 0 
                                ? o.productNames.join(', ') 
                                : 'No products found'}
                            </p>
                          </div>

                          {/* Bottom Row: Status Badges */}
                          <div className="flex gap-2">
                            {/* Payment Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              o.paymentStatus === 'PAID'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              PAYMENT: {o.paymentStatus || 'PENDING'}
                            </span>
                            {/* Fulfillment Status Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              o.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : o.orderStatus === 'SHIPPED'
                                ? 'bg-cyan-50 text-cyan-600 border-cyan-100'
                                : o.orderStatus === 'PROCESSING'
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              DELIVERY: {o.orderStatus || 'PLACED'}
                            </span>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
