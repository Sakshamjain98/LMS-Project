import { useEffect, useState } from "react";
import { getAllPayments } from "../../services/adminService";
import { 
  DollarSign, User, Hash, Calendar, Loader2, 
  CheckCircle2, Clock, AlertCircle, History, Search, Filter 
} from "lucide-react";
import toast from "react-hot-toast";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", search: "" });

  useEffect(() => {
    fetchPayments();
  }, [filters]); // Refetch whenever filters change

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAllPayments(filters);
      setPayments(res.payments || []);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "SUCCESS": 
        return { bg: "bg-brand-primary/10", text: "text-brand-primary", icon: <CheckCircle2 size={12} /> };
      case "PENDING": 
        return { bg: "bg-yellow-500/10", text: "text-yellow-500", icon: <Clock size={12} /> };
      case "FAILED": 
        return { bg: "bg-red-500/10", text: "text-red-500", icon: <AlertCircle size={12} /> };
      case "REFUNDED": 
        return { bg: "bg-grayCustom-medium/10", text: "text-grayCustom-medium", icon: <History size={12} /> };
      default: 
        return { bg: "bg-dark-300", text: "text-white", icon: null };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transaction History</h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">Detailed log of all platform financial activities.</p>
        </div>
        <div className="flex items-center gap-3 bg-dark-200 border border-dark-100 p-4 rounded-2xl shadow-lg">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <DollarSign className="text-brand-primary w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest leading-none">Total Logs</p>
            <p className="text-xl font-bold text-white">{payments.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            placeholder="Search by ID or Email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-dark-300 border border-dark-100 text-white pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-grayCustom-medium/40 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="text-brand-primary w-4 h-4" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-dark-300 border border-dark-100 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer text-sm font-bold uppercase tracking-wider"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-300/50 border-b border-dark-100">
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Hash size={14} /> ID</div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">
                  <div className="flex items-center gap-2"><User size={14} /> Customer</div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Calendar size={14} /> Date</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-brand-primary" size={32} />
                      <span className="text-grayCustom-medium text-sm font-medium">Filtering records...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-grayCustom-medium font-medium">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const style = getStatusStyles(payment.status);
                  return (
                    <tr key={payment._id} className="hover:bg-dark-100/50 transition-colors group">
                      <td className="px-6 py-5">
                        <span className="font-mono text-[10px] text-brand-primary bg-brand-primary/5 px-2 py-1 rounded border border-brand-primary/10 tracking-wider">
                          {payment.razorpayOrderId || payment._id.slice(-10).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-[150px]">
                          <div className="text-sm font-bold text-white leading-tight">{payment.userId?.name || "Anonymous User"}</div>
                          <div className="text-[11px] text-grayCustom-medium mt-0.5">{payment.userId?.email || "N/A"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-extrabold text-white">
                        ₹{payment.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {style.icon}
                          {payment.status}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-grayCustom-medium font-medium">
                        {new Date(payment.createdAt).toLocaleDateString()}
                        <span className="block text-[10px] opacity-50 mt-1 uppercase font-bold">
                          {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}