import { useEffect, useMemo, useState } from "react";
import { getAllPayments, forceGrantPayment, deletePendingPayment, exportPayments } from "../../services/adminService";
import {
  IndianRupee, User, Hash, Calendar, Loader2,
  CheckCircle2, Clock, AlertCircle, History, Search, Filter, ShieldAlert, Trash2, Download
} from "lucide-react";
import toast from "react-hot-toast";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ status: "", search: "", forced: false });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.forced, limit]);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.forced, debouncedSearch, page, limit]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAllPayments({
        status: filters.status,
        search: debouncedSearch,
        forced: filters.forced || undefined,
        page,
        limit,
      });
      setPayments(res.payments || []);
      setPagination(res.pagination || pagination);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  // Exports whatever is currently filtered — e.g. check "Forced access only"
  // first to download just the force-granted payments.
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPayments({
        status: filters.status,
        search: debouncedSearch,
        forced: filters.forced || undefined,
      });
      toast.success("Payments exported");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to export payments");
    } finally {
      setExporting(false);
    }
  };

  const [grantingId, setGrantingId] = useState(null);

  // Bypass for a stuck PENDING order: skips the Razorpay re-check entirely.
  // Only use once the payment's been confirmed some other way (bank
  // statement, Razorpay dashboard, support conversation).
  const handleForceGrant = async (payment) => {
    const reason = window.prompt(
      `Grant access to ${payment.userId?.email || "this user"} WITHOUT checking Razorpay?\n\n` +
      `This should only be done if you've already confirmed the payment some other way.\n` +
      `Reason (saved to the audit log):`
    );
    if (reason === null) return;
    setGrantingId(payment._id);
    try {
      await forceGrantPayment(payment._id, reason);
      toast.success("Access granted");
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to grant access");
    } finally {
      setGrantingId(null);
    }
  };

  const [deletingId, setDeletingId] = useState(null);

  // Only ever offered for PENDING rows (backend enforces this too) — cleans
  // up an abandoned checkout: deletes the payment, and the user account with
  // it unless they have some other completed payment.
  const handleDeletePending = async (payment) => {
    const ok = window.confirm(
      `Delete this pending payment for ${payment.userId?.email || "this user"}?\n\n` +
      `Their account will also be deleted, unless they have another completed payment. This cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(payment._id);
    try {
      const res = await deletePendingPayment(payment._id);
      toast.success(res.userDeleted ? "Payment and user deleted" : "Payment deleted (user kept — other completed payments exist)");
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const summaryText = useMemo(() => {
    if (!pagination.total) return "No transactions found";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Showing ${start}-${end} of ${pagination.total}`;
  }, [pagination]);

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-dark-200 border border-dark-100 p-4 rounded-2xl shadow-lg">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <IndianRupee className="text-brand-primary w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-widest leading-none">Total Logs</p>
              <p className="text-xl font-bold text-white">{pagination.total || 0}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            title="Download the currently filtered payments as CSV, with financial details"
            className="inline-flex items-center gap-2 h-full px-4 py-2.5 rounded-xl bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wide hover:bg-brand-primary/20 disabled:opacity-40 transition-colors"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Exporting" : "Download Excel"}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-200 border border-dark-100 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="relative min-w-72 flex-1">
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

        <label className="flex items-center gap-2 cursor-pointer bg-dark-300 border border-dark-100 px-4 py-2.5 rounded-xl text-sm">
          <input
            type="checkbox"
            checked={filters.forced}
            onChange={(e) => setFilters({ ...filters, forced: e.target.checked })}
            className="accent-brand-primary w-4 h-4"
          />
          <span className="flex items-center gap-1.5 text-white/80 font-semibold">
            <ShieldAlert size={14} className="text-yellow-500" /> Forced access only
          </span>
        </label>
      </div>

      <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-3 bg-dark-300/30 sm:flex-row sm:items-center sm:justify-between rounded-xl">
        <p className="text-xs text-gray-400">{summaryText}</p>
        <div className="flex items-center justify-end gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={15}>15 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-white/80">{pagination.page}/{pagination.totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white disabled:opacity-40"
          >
            Next
          </button>
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
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Type</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">
                  <div className="flex items-center gap-2"><User size={14} /> Customer</div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">
                  <div className="flex items-center gap-2"><Calendar size={14} /> Date</div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin text-brand-primary" size={32} />
                      <span className="text-grayCustom-medium text-sm font-medium">Filtering records...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-grayCustom-medium font-medium">
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
                          {payment.orderId || payment.paymentId || payment._id.slice(-10).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-white/80">{payment.kind || "SUBSCRIPTION"}</div>
                        <div className="text-[11px] text-grayCustom-medium mt-0.5">{payment.description || payment.plan}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-37.5">
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
                      <td className="px-6 py-5">
                        {payment.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleForceGrant(payment)}
                              disabled={grantingId === payment._id || deletingId === payment._id}
                              title="Grant access without waiting for Razorpay confirmation"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 disabled:opacity-40 transition-colors"
                            >
                              {grantingId === payment._id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <ShieldAlert size={12} />
                              )}
                              Force Grant
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePending(payment)}
                              disabled={grantingId === payment._id || deletingId === payment._id}
                              title="Delete this pending payment and the user's account"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                            >
                              {deletingId === payment._id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                              Delete
                            </button>
                          </div>
                        )}
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