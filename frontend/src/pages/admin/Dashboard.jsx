import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboard,
  getRevenueAnalytics,
  getAllPayments,
  getAllUsers,
} from "../../services/adminService";
import { getTeacherTestSeries } from "../../services/teacherService";
import {
  Users, IndianRupee, Layers, Newspaper, PenSquare, CreditCard,
  ArrowUpRight, RefreshCw, TrendingUp, Sparkles, Activity, Clock, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// ─── Sub-components ─────────────────────────────────────────────────────────
const ACCENTS = {
  primary: { glow: "bg-brand-primary/15", chip: "bg-brand-primary/15 text-brand-primary" },
  accent:  { glow: "bg-brand-accent/15",  chip: "bg-brand-accent/15 text-brand-accent" },
};

function KpiCard({ icon: Icon, label, value, trend, accent = "primary", to }) {
  const a = ACCENTS[accent] || ACCENTS.primary;
  const inner = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="glass-card glass-card-hover relative overflow-hidden rounded-2xl p-6 cursor-pointer h-full"
    >
      <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full ${a.glow} blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-white tabular-nums">{value}</p>
          {trend !== undefined && trend !== null && (
            <p className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.chip}`}>
          <Icon size={20} />
        </div>
      </div>
      {to && (
        <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50">
          View <ArrowUpRight size={12} />
        </div>
      )}
    </motion.div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

function ListRow({ left, right }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors">
      <div className="min-w-0 flex-1">{left}</div>
      <div className="ml-3 shrink-0">{right}</div>
    </div>
  );
}

function statusPill(status) {
  const ok = status === "SUCCESS" || status === "COMPLETED";
  const pending = status === "PENDING";
  const cls = ok
    ? "bg-emerald-500/15 text-emerald-300"
    : pending
    ? "bg-amber-500/15 text-amber-300"
    : "bg-red-500/15 text-red-300";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>{status || "—"}</span>;
}

// ─── Main ───────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [seriesTotal, setSeriesTotal] = useState({ topics: 0, tests: 0 });
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    // Payments and analytics/users are permission-gated on the backend for
    // plain admins (payments is superadmin-only, never grantable). Skip the
    // request entirely rather than firing one guaranteed to 403 — the global
    // API client toasts every non-401/422 error, which otherwise shows a
    // confusing "no permission" toast on every dashboard load.
    let currentUser = {};
    try { currentUser = JSON.parse(localStorage.getItem("user") || "{}"); } catch { /* ignore */ }
    const isSuperadmin = currentUser.role === "superadmin";
    const perms = Array.isArray(currentUser.permissions) ? currentUser.permissions : [];
    const canViewAnalytics = isSuperadmin || perms.includes("analytics.view");
    const canViewUsers = isSuperadmin || perms.includes("users.view");

    try {
      const [dashRes, revRes, paymentsRes, usersRes, seriesRes] = await Promise.allSettled([
        getAdminDashboard(),
        canViewAnalytics ? getRevenueAnalytics(period) : Promise.resolve(null),
        isSuperadmin ? getAllPayments() : Promise.resolve(null),
        canViewUsers ? getAllUsers({ limit: 5, sort: "-createdAt", role: "student" }) : Promise.resolve(null),
        getTeacherTestSeries(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) setStats(dashRes.value.data);

      if (revRes.status === "fulfilled") {
        const raw = revRes.value?.data || revRes.value || [];
        setRevenueData(transformRevenue(raw));
      } else {
        setRevenueData([]);
      }

      if (paymentsRes.status === "fulfilled") {
        const list = paymentsRes.value?.data || paymentsRes.value?.payments || paymentsRes.value || [];
        setRecentPayments(Array.isArray(list) ? list.slice(0, 5) : []);
      }

      if (usersRes.status === "fulfilled") setRecentUsers(usersRes.value?.users || []);

      if (seriesRes.status === "fulfilled") {
        const topics = seriesRes.value?.topics || [];
        let tests = 0;
        topics.forEach((t) => t.subjects?.forEach((s) => s.chapters?.forEach((c) => { tests += c.tests?.length || 0; })));
        setSeriesTotal({ topics: topics.length, tests });
      }
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = async () => {
    await fetchAll(true);
    toast.success("Dashboard refreshed");
  };

  const adminName = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")?.name || "Admin"; } catch { return "Admin"; }
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl glass-panel ambient-glow p-7 md:p-8"
      >
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/70">
              <Sparkles size={12} className="text-brand-primary" />
              Admin Insights
            </span>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Welcome back, {adminName}</h1>
            <p className="mt-1.5 text-sm text-white/60">Snapshot of platform health, revenue, and student activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl glass-pill px-3 py-2 text-xs font-semibold text-white/80 focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-dark-400 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
              trend={stats?.revenueGrowth}
            />
            <KpiCard
              icon={Users}
              label="Total Students"
              value={(stats?.totalStudents || 0).toLocaleString()}
              trend={stats?.userGrowth}
              to="/admin/users"
            />
            <KpiCard
              icon={Layers}
              label="Test Series"
              value={`${seriesTotal.topics} • ${seriesTotal.tests} tests`}
              accent="accent"
              to="/admin/test-series"
            />
            <KpiCard
              icon={CreditCard}
              label="Pending Payments"
              value={(recentPayments.filter((p) => p.status === "PENDING").length).toLocaleString()}
              to="/admin/payments"
            />
          </>
        )}
      </div>

      {/* Revenue chart + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Revenue trend</p>
              <h2 className="mt-1 text-lg font-bold text-white inline-flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" />
                Earnings over time
              </h2>
            </div>
          </div>
          <div className="h-64 -mx-2">
            {revenueData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/40">
                No revenue data yet — earnings will chart here as payments arrive.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00BA7C" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#00BA7C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                    contentStyle={{ background: "#0E1420", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#00BA7C" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Quick actions</p>
          <h2 className="mt-1 text-lg font-bold text-white inline-flex items-center gap-2">
            <Activity size={16} className="text-brand-primary" />
            Manage platform
          </h2>
          <div className="mt-5 space-y-2">
            {[
              { label: "Create test series",  to: "/admin/test-series",  icon: Layers },
              { label: "Publish an article",  to: "/admin/blogs",        icon: PenSquare },
              { label: "Post a news item",    to: "/admin/news",         icon: Newspaper },
              { label: "Review students",     to: "/admin/users",        icon: Users },
              { label: "Review payments",     to: "/admin/payments",     icon: CreditCard },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 hover:border-brand-primary/30 hover:bg-white/5 transition-all"
              >
                <span className="flex items-center gap-3 text-sm text-white/85">
                  <a.icon size={15} className="text-brand-primary" />
                  {a.label}
                </span>
                <ChevronRight size={14} className="text-white/30 group-hover:text-brand-primary transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white inline-flex items-center gap-2">
              <Users size={15} className="text-brand-primary" /> Recent students
            </h2>
            <Link to="/admin/users" className="text-[11px] font-semibold text-brand-primary hover:underline">View all</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/40">No recent students.</p>
          ) : (
            <div className="space-y-1">
              {recentUsers.map((u) => (
                <ListRow
                  key={u._id}
                  left={
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary text-sm font-bold">
                        {u.name?.charAt(0) || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                        <p className="truncate text-xs text-white/50">{u.email}</p>
                      </div>
                    </div>
                  }
                  right={
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                      <Clock size={10} />
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-white inline-flex items-center gap-2">
              <CreditCard size={15} className="text-brand-primary" /> Recent payments
            </h2>
            <Link to="/admin/payments" className="text-[11px] font-semibold text-brand-primary hover:underline">View all</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/40">No recent payments.</p>
          ) : (
            <div className="space-y-1">
              {recentPayments.map((p) => (
                <ListRow
                  key={p._id}
                  left={
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} className="text-brand-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">₹{(p.amount || 0).toLocaleString()}</p>
                        <p className="truncate text-xs text-white/50">
                          {p.plan || "—"} • {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  }
                  right={statusPill(p.status)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-3 w-20 rounded bg-white/10" />
      <div className="mt-3 h-7 w-24 rounded bg-white/10" />
      <div className="mt-2 h-2 w-16 rounded bg-white/10" />
    </div>
  );
}

function transformRevenue(rawData) {
  if (!rawData || !Array.isArray(rawData)) return [];
  return rawData.map((row) => ({
    month: row.month || row._id || row.label || "—",
    amount: Number(row.amount || row.total || row.revenue || 0),
  }));
}
