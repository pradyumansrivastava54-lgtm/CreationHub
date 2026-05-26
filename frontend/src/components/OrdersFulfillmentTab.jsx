import { useState } from 'react';

export default function OrdersFulfillmentTab({ orders, ordersLoading, fetchOrders, handleUpdateOrderStatus }) {
  const [orderSubTab, setOrderSubTab] = useState('ALL');

  // Filter logic
  const filteredOrders = orders.filter(o => {
    if (orderSubTab === 'ALL') return true;
    return (o.orderStatus || 'PLACED') === orderSubTab;
  });

  return (
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

      {/* Premium Sub-Navigation Status Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setOrderSubTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center ${
              orderSubTab === tab
                ? 'bg-primary text-white border border-primary'
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-input'
            }`}
          >
            {tab === 'PLACED' ? 'New Orders' : tab}
            {tab === 'PLACED' ? (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-xs font-bold ml-1">
                {orders.filter(o => (o.orderStatus || 'PLACED') === 'PLACED').length}
              </span>
            ) : tab !== 'ALL' ? (
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                orderSubTab === tab ? 'bg-white/20 text-white' : 'bg-surface-card text-text-muted border border-border'
              }`}>
                {orders.filter(o => (o.orderStatus || 'PLACED') === tab).length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {ordersLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-surface-card border border-border p-12 text-center rounded-2xl">
          <p className="text-text-secondary text-base">No orders match this status filter.</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-text-muted text-xs uppercase font-bold tracking-wider">
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Shipping Destination</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-text-secondary font-mono mb-1">#{o.id}</p>
                      <p className="text-xs text-text-muted">{new Date(o.orderDate).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-text-primary font-bold">{o.shippingFullName || o.username || o.user?.username || 'N/A'}</p>
                      <p className="text-text-muted text-[11px] font-mono mt-0.5">{o.shippingPhone || o.email || o.user?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-normal break-words min-w-[200px]">
                      <p className="text-text-secondary text-xs" title={o.shippingAddress || 'No Address Provided'}>
                        {o.shippingAddress || 'No Address Provided'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-primary font-bold">
                      ₹{Number(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {o.paymentStatus === 'PAID' ? (
                        <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                          PAID
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold border border-amber-500/20">
                          {o.paymentStatus || 'PENDING'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={o.orderStatus || 'PLACED'}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors focus:ring-2 focus:outline-none ${
                          o.orderStatus === 'PROCESSING'
                            ? 'text-indigo-600 border-indigo-200 bg-indigo-50 focus:ring-indigo-500/30'
                            : o.orderStatus === 'SHIPPED'
                            ? 'text-cyan-600 border-cyan-200 bg-cyan-50 focus:ring-cyan-500/30'
                            : o.orderStatus === 'DELIVERED'
                            ? 'text-emerald-600 border-emerald-200 bg-emerald-50 focus:ring-emerald-500/30'
                            : 'text-amber-600 border-amber-200 bg-amber-50 focus:ring-amber-500/30'
                        }`}
                      >
                        <option value="PLACED">PLACED (New)</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
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
  );
}
