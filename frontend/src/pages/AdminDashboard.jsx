import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab navigation: 'analytics' | 'catalog' | 'orders' | 'add-product' | 'users'
  const [activeTab, setActiveTab] = useState('analytics');

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
  });

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
      const response = await API.get('/api/orders/admin/all');
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
      await API.post('/api/products', {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stockQuantity: Math.floor(Number(formData.stockQuantity)),
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      });

      setSuccessMsg('Product Added Successfully!');
      alert('Product Added Successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        imageUrl: '',
      });
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
      await API.put(`/api/orders/${orderId}/status`, { status: newStatus });
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
      await API.put(`/api/products/${editingProduct.id}`, editingProduct);
      alert('Product updated successfully!');
      setEditingProduct(null);
      fetchProducts();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update product details.');
    }
  };

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
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-full border-b-2 font-medium text-sm flex items-center shrink-0 cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
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
        {activeTab === 'catalog' && (
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

            {productsLoading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="bg-surface-card border border-border p-12 text-center rounded-2xl">
                <p className="text-text-secondary text-base">No products found inside database. Click &apos;Add New Product&apos; to create one.</p>
              </div>
            ) : (
              <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface text-text-muted text-xs uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Product Name</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4 text-center">Stock Level</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-6 py-4 text-text-secondary font-mono">{p.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=40&q=80'}
                                alt=""
                                className="w-10 h-10 object-cover rounded-lg border border-border"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-text-primary truncate">{p.name}</p>
                                <p className="text-text-muted text-xs truncate max-w-xs">{p.description || 'No description'}</p>
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
                          <td className="px-6 py-4 text-right space-x-2">
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
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Fulfillment & Order History</h2>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-surface-input border border-border hover:border-primary/50 rounded-xl text-xs font-semibold text-text-primary transition-all cursor-pointer"
              >
                Refresh Orders
              </button>
            </div>

            {ordersLoading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface-card border border-border p-12 text-center rounded-2xl">
                <p className="text-text-secondary text-base">No orders placed on the system yet.</p>
              </div>
            ) : (
              <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface text-text-muted text-xs uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Fulfillment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-surface/30 transition-colors">
                          <td className="px-6 py-4 text-text-secondary font-mono">#{o.id}</td>
                          <td className="px-6 py-4">
                            <p className="text-text-primary font-bold">{o.user?.username}</p>
                            <p className="text-text-muted text-xs">{o.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {new Date(o.orderDate).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-primary font-bold">
                            ₹{Number(o.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-border bg-surface-input text-text-primary cursor-pointer transition-colors focus:border-primary ${
                                o.status === 'PAID'
                                  ? 'text-success border-success/30 bg-success-bg/10'
                                  : o.status === 'SHIPPED'
                                  ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5'
                                  : o.status === 'DELIVERED'
                                  ? 'text-teal-400 border-teal-400/30 bg-teal-400/5'
                                  : 'text-amber-500 border-amber-500/30 bg-amber-500/5'
                              }`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PAID">PAID</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="FAILED">FAILED</option>
                            </select>
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
    </div>
  );
}
