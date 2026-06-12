import { useEffect, useState } from "react";
import {
  getAllUsers,
  getUserContentAccess,
  setCourseAccessDisabled,
  setTopicAccessDisabled,
  extendCourseAccess,
  extendTopicAccess,
} from "../../services/adminService";
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  BookOpen,
  ListChecks,
  CalendarPlus,
  Settings2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";

const daysLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const d = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  return d;
};

// Status chip for a single course/series access record.
const accessStatusChip = (item) => {
  if (item.disabled || item.status === "DISABLED")
    return { label: "Disabled", cls: "bg-orange-500/10 text-orange-400 border-orange-500/30" };
  if (item.status === "EXPIRED" || (item.expiresAt && new Date(item.expiresAt) <= new Date()))
    return { label: "Expired", cls: "bg-red-500/10 text-red-400 border-red-500/30" };
  return { label: "Active", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    subStatus: "",
    expiringInDays: "",
    purchasedWithinMonths: "",
  });
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

  // Active modal: { type: 'content', user }
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [limit, filters.subStatus, filters.expiringInDays, filters.purchasedWithinMonths]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, limit, filters.subStatus, filters.expiringInDays, filters.purchasedWithinMonths]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        role: "student",
        search: debouncedSearch,
        subStatus: filters.subStatus || undefined,
        expiringInDays: filters.expiringInDays || undefined,
        purchasedWithinMonths: filters.purchasedWithinMonths || undefined,
        page,
        limit,
      });
      setUsers(res.users || []);
      setPagination(res.pagination || pagination);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <UsersRound size={28} className="text-brand-primary" />
            Students
          </h1>
          <p className="text-grayCustom-medium mt-1 text-sm font-medium">
            Per-course and per-test-series access. Extend, reactivate, or revoke purchases without deleting accounts.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-sm text-gray-300">
          Total Students: <span className="text-white font-bold">{pagination.total || 0}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-wrap gap-4 items-center shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        <div className="relative min-w-70 flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-grayCustom-medium w-4 h-4" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full bg-dark-300 border border-dark-100 text-white pl-11 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-grayCustom-medium/50"
          />
        </div>
        <select
          value={filters.subStatus}
          onChange={(e) => setFilters({ ...filters, subStatus: e.target.value })}
          className="bg-dark-300 border border-dark-100 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">All subscriptions</option>
          <option value="active">Active subscriptions</option>
          <option value="expired">Expired subscriptions</option>
          <option value="disabled">Disabled</option>
          <option value="none">No purchases</option>
        </select>
        <select
          value={filters.expiringInDays}
          onChange={(e) => setFilters({ ...filters, expiringInDays: e.target.value })}
          className="bg-dark-300 border border-dark-100 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">Expiring within…</option>
          <option value="7">≤ 7 days</option>
          <option value="30">≤ 30 days</option>
        </select>
        <select
          value={filters.purchasedWithinMonths}
          onChange={(e) => setFilters({ ...filters, purchasedWithinMonths: e.target.value })}
          className="bg-dark-300 border border-dark-100 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="">Purchased within…</option>
          <option value="3">Last 3 months</option>
          <option value="6">Last 6 months</option>
          <option value="9">Last 9 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-300/50 border-b border-dark-100">
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Student</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-center">Courses</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-center">Test Series</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-center">Active</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest text-center">Expired</th>
                <th className="px-6 py-5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Last Purchase</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-grayCustom-medium uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                      <span className="text-grayCustom-medium text-sm">Fetching user records...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center text-grayCustom-medium">
                    No users match your current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-dark-100/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-dark-300 flex items-center justify-center text-brand-primary border border-dark-100">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name}</p>
                          <p className="text-xs text-grayCustom-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-semibold text-gray-200">
                      {user.purchasedCoursesCount || 0}
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-semibold text-gray-200">
                      {user.purchasedTestSeriesCount || 0}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-emerald-400">{user.activeSubscriptions || 0}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-red-400">{user.expiredSubscriptions || 0}</span>
                    </td>
                    <td className="px-6 py-5 text-xs text-grayCustom-medium">
                      {fmtDate(user.lastPurchaseDate)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setModal({ type: "content", user })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-grayCustom-medium hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all border border-white/10"
                          title="Manage course / test series access"
                        >
                          <Settings2 size={14} /> Manage Access
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-3 bg-dark-300/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            Showing <span className="text-white font-semibold">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total || 0)}</span>
            -<span className="text-white font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total || 0)}</span> of <span className="text-white font-semibold">{pagination.total}</span>
          </p>
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-white/80">{pagination.page}/{pagination.totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modal?.type === "content" && (
        <ContentModal user={modal.user} onClose={() => setModal(null)} onChanged={fetchUsers} />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Modals
function ModalShell({ title, subtitle, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} bg-dark-300 border border-white/10 rounded-2xl shadow-2xl`}>
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-grayCustom-medium mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-grayCustom-medium hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// Extend / change-expiry sub-modal for a single course or test series grant.
function ExtendAccessModal({ item, kind, userId, onClose, onDone }) {
  const [mode, setMode] = useState("days"); // 'days' | 'until'
  const [days, setDays] = useState(30);
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const payload =
      mode === "until"
        ? { until }
        : { days: parseInt(days, 10) };
    if (mode === "until" && !until) return toast.error("Pick a date");
    if (mode === "days" && (!payload.days || payload.days <= 0))
      return toast.error("Enter a positive number of days");
    try {
      setSaving(true);
      if (kind === "course") await extendCourseAccess(userId, item.courseId, payload);
      else await extendTopicAccess(userId, item.topicId, payload);
      toast.success("Access updated");
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Extend / Change Expiry" subtitle={item.title} onClose={onClose}>
      <p className="text-xs text-grayCustom-medium">
        Adds to remaining time if still active, otherwise counts from today. Reactivates a disabled or expired grant.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setMode("days")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "days" ? "bg-brand-primary/20 text-brand-primary border-brand-primary/40" : "bg-white/5 text-gray-300 border-white/10"}`}
        >
          By days
        </button>
        <button
          onClick={() => setMode("until")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${mode === "until" ? "bg-brand-primary/20 text-brand-primary border-brand-primary/40" : "bg-white/5 text-gray-300 border-white/10"}`}
        >
          Specific date
        </button>
      </div>
      {mode === "days" ? (
        <>
          <div className="flex gap-2">
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${Number(days) === d ? "bg-brand-primary/20 text-brand-primary border-brand-primary/40" : "bg-white/5 text-gray-300 border-white/10"}`}
              >
                +{d}d
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full bg-dark-100 border border-white/10 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </>
      ) : (
        <input
          type="date"
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          className="w-full bg-dark-100 border border-white/10 text-white px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        />
      )}
      <button
        onClick={submit}
        disabled={saving}
        className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
      >
        {saving ? "Saving…" : "Update Access"}
      </button>
    </ModalShell>
  );
}

// Manage a user's per-course / per-test-series access. Revoke forces a repay
// to regain access; Extend changes/renews the expiry. Records and progress are
// always preserved. COURSE_UNLOCK series follow their parent course.
function ContentModal({ user, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ courses: [], topics: [] });
  const [busyKey, setBusyKey] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null); // { item, kind }

  const load = async () => {
    try {
      setLoading(true);
      const res = await getUserContentAccess(user._id);
      setData({ courses: res.courses || [], topics: res.topics || [] });
    } catch {
      toast.error("Failed to load content access");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    load();
    onChanged?.();
  };

  const toggleCourse = async (c) => {
    const key = `c:${c.courseId}`;
    try {
      setBusyKey(key);
      await setCourseAccessDisabled(user._id, c.courseId, !c.disabled);
      toast.success(!c.disabled ? "Course access revoked" : "Course access restored");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  const toggleTopic = async (t) => {
    const key = `t:${t.topicId}`;
    try {
      setBusyKey(key);
      await setTopicAccessDisabled(user._id, t.topicId, !t.disabled);
      toast.success(!t.disabled ? "Series access revoked" : "Series access restored");
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  const AccessRow = ({ item, kind, onToggle, fromCourse }) => {
    const chip = accessStatusChip(item);
    const dl = daysLeft(item.expiresAt);
    const busy = busyKey === `${kind === "course" ? "c" : "t"}:${kind === "course" ? item.courseId : item.topicId}`;
    return (
      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white font-medium truncate">{item.title}</p>
            {fromCourse && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                via course
              </span>
            )}
          </div>
          <p className="text-[11px] text-grayCustom-medium">
            Bought {fmtDate(item.purchasedAt)}
            {item.expiresAt ? ` · expires ${fmtDate(item.expiresAt)}${dl != null && dl > 0 ? ` (${dl}d)` : ""}` : " · lifetime"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${chip.cls}`}>{chip.label}</span>
          {fromCourse ? (
            <span className="text-[10px] text-grayCustom-medium px-1">follows course</span>
          ) : (
            <>
              <button
                onClick={() => setExtendTarget({ item, kind })}
                disabled={busy}
                className="p-1.5 rounded-lg text-grayCustom-medium hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
                title="Extend / change expiry / reactivate"
              >
                <CalendarPlus size={15} />
              </button>
              <button
                onClick={onToggle}
                disabled={busy}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                  item.disabled
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20"
                }`}
              >
                {busy ? "…" : item.disabled ? "Restore" : "Revoke"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <ModalShell
        title="Course & Test Series Access"
        subtitle={`${user.name} · ${user.email}`}
        onClose={onClose}
        wide
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-primary" />
          </div>
        ) : (
          <div className="max-h-112 overflow-y-auto -mr-1 pr-1 space-y-5">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest mb-1">
                <BookOpen size={13} /> Courses ({data.courses.length})
              </p>
              {data.courses.length === 0 ? (
                <p className="text-xs text-grayCustom-medium py-2">No course purchases.</p>
              ) : (
                data.courses.map((c) => (
                  <AccessRow key={c.courseId} item={c} kind="course" onToggle={() => toggleCourse(c)} />
                ))
              )}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-grayCustom-medium uppercase tracking-widest mb-1">
                <ListChecks size={13} /> Test Series ({data.topics.length})
              </p>
              {data.topics.length === 0 ? (
                <p className="text-xs text-grayCustom-medium py-2">No test series purchases.</p>
              ) : (
                data.topics.map((t) => (
                  <AccessRow
                    key={t.topicId}
                    item={t}
                    kind="topic"
                    fromCourse={t.source === "COURSE_UNLOCK"}
                    onToggle={() => toggleTopic(t)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </ModalShell>

      {extendTarget && (
        <ExtendAccessModal
          item={extendTarget.item}
          kind={extendTarget.kind}
          userId={user._id}
          onClose={() => setExtendTarget(null)}
          onDone={() => {
            setExtendTarget(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
