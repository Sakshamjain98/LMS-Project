import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  BarChart2,
  Clock,
  Lock,
  Loader2,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  getMyAttempts,
  getAvailableTests,
  getStudentSubscription,
  createTopicOrder,
  verifyTopicPayment,
} from "../../services/studentService";
import TestResult from "./TestResult";

const PAGE_SIZE = 8;

const isLiveTest = (test) => {
  const now = Date.now();
  const startOk = !test.startTime || new Date(test.startTime).getTime() <= now;
  const endOk = !test.endTime || new Date(test.endTime).getTime() >= now;
  return startOk && endOk;
};

const getSeriesStats = (topic) => {
  if (!topic) return { total: 0, live: 0, subjects: 0, chapters: 0 };
  let total = 0;
  let live = 0;
  let chapters = 0;
  const subjects = topic.subjects?.length || 0;
  topic.subjects?.forEach((subject) => {
    chapters += subject.chapters?.length || 0;
    subject.chapters?.forEach((chapter) => {
      chapter.tests?.forEach((test) => {
        total += 1;
        if (isLiveTest(test)) live += 1;
      });
    });
  });
  return { total, live, subjects, chapters };
};

const ensureRazorpayLoaded = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });

export default function StudentTests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("series"); // 'series' | 'results'

  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resultsPage, setResultsPage] = useState(1);
  const [unlockingId, setUnlockingId] = useState(null);

  const [activeResultId, setActiveResultId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [testsRes, attemptsRes, sub] = await Promise.all([
        getAvailableTests().catch(() => ({ topics: [] })),
        getMyAttempts().catch(() => ({ data: [] })),
        getStudentSubscription().catch(() => null),
      ]);
      setTopics(testsRes.topics || []);
      setAttempts(attemptsRes.data || []);
      setSubscription(sub || null);
    } catch {
      setError("Failed to load test center data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const subActive =
    subscription?.status === "ACTIVE" &&
    subscription?.plan &&
    subscription.plan !== "FREE";

  const isTopicUnlocked = (topic) => {
    if (!topic?.isPaid) return true;
    if (topic.isUnlocked) return true; // server-annotated
    if (subActive) return true;
    return false;
  };

  const totalTests = useMemo(
    () => topics.reduce((sum, t) => sum + getSeriesStats(t).total, 0),
    [topics]
  );
  const totalLive = useMemo(
    () => topics.reduce((sum, t) => sum + getSeriesStats(t).live, 0),
    [topics]
  );
  const freeSeriesCount = useMemo(
    () => topics.filter((t) => !t.isPaid).length,
    [topics]
  );

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) =>
      [t.title, t.description].filter(Boolean).some((s) => s.toLowerCase().includes(q))
    );
  }, [topics, search]);

  const paginatedTopics = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTopics.slice(start, start + PAGE_SIZE);
  }, [filteredTopics, page]);
  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE));

  const paginatedAttempts = useMemo(() => {
    const start = (resultsPage - 1) * PAGE_SIZE;
    return attempts.slice(start, start + PAGE_SIZE);
  }, [attempts, resultsPage]);
  const resultsTotalPages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE));

  // Reset to page 1 when search changes.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Force the user away from "results" if they have nothing to show.
  useEffect(() => {
    if (attempts.length === 0 && activeTab === "results") {
      setActiveTab("series");
    }
  }, [attempts.length, activeTab]);

  const hasAttempts = attempts.length > 0;

  const handleUnlock = async (topic) => {
    if (!topic?._id) return;
    setUnlockingId(topic._id);
    setError("");
    try {
      await ensureRazorpayLoaded();
      const order = await createTopicOrder(topic._id);

      if (order?.alreadyUnlocked) {
        await loadData();
        return;
      }

      const onSuccess = async (response) => {
        try {
          await verifyTopicPayment(topic._id, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await loadData();
        } catch (err) {
          setError(err.message || "Payment verification failed.");
        } finally {
          setUnlockingId(null);
        }
      };

      // Dev mode: bypass real Razorpay UI.
      if (typeof order.orderId === "string" && order.orderId.startsWith("dev_")) {
        return onSuccess({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `DEV_PAY_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
      }

      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency || "INR",
        name: "PS Classes",
        description: order.topicTitle ? `Unlock: ${order.topicTitle}` : "Test Series Unlock",
        order_id: order.orderId,
        prefill: {
          email: localStorage.getItem("userEmail") || "",
          contact: localStorage.getItem("userPhone") || "",
        },
        theme: { color: "#00c885" },
        handler: onSuccess,
        modal: { ondismiss: () => setUnlockingId(null) },
      });
      rzp.open();
    } catch (err) {
      setUnlockingId(null);
      setError(err?.message || "Failed to start unlock flow.");
    }
  };

  if (activeResultId) {
    return <TestResult attemptId={activeResultId} onBack={() => setActiveResultId(null)} />;
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>
        {/* HERO */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-brand-primary/10 blur-3xl"></div>
          <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles size={12} className="text-brand-primary" />
              Curated by exam faculty
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Test Series Hub</h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              Browse the full hierarchy and start practising. Drill into a series to see its subjects, chapters, and tests.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatPill label="Series Available" value={topics.length} />
              <StatPill label="Free Series" value={freeSeriesCount} />
              <StatPill label="Total Tests" value={totalTests} />
              <StatPill label="Live Now" value={totalLive} />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-6 w-full max-w-7xl px-4 md:px-8">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
              <AlertCircle size={18} /> {error}
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
          {/* Tabs — analytics tab is hidden until the student has at least one attempt */}
          <div className="mb-8 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
            <TabBtn icon={ClipboardList} active={activeTab === "series"} onClick={() => setActiveTab("series")}>
              Browse Series
            </TabBtn>
            {hasAttempts && (
              <TabBtn icon={BarChart2} active={activeTab === "results"} onClick={() => setActiveTab("results")}>
                My Results
              </TabBtn>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center text-white/60">
              <Loader2 size={20} className="animate-spin text-brand-primary mr-2" /> Loading…
            </div>
          ) : activeTab === "series" ? (
            <SeriesTable
              topics={paginatedTopics}
              totalCount={filteredTopics.length}
              search={search}
              onSearch={setSearch}
              isUnlocked={isTopicUnlocked}
              unlockingId={unlockingId}
              onUnlock={handleUnlock}
              onOpen={(topic) => navigate(`/student/tests/${topic._id}`)}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          ) : (
            <ResultsTable
              attempts={paginatedAttempts}
              totalCount={attempts.length}
              page={resultsPage}
              totalPages={resultsTotalPages}
              onPageChange={setResultsPage}
              onView={setActiveResultId}
            />
          )}
        </div>
      </div>
    </>
  );
}

function TabBtn({ icon: Icon, active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 ${
        active ? "btn-gradient" : "text-gray-300 hover:text-white"
      }`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function SeriesTable({
  topics,
  totalCount,
  search,
  onSearch,
  isUnlocked,
  unlockingId,
  onUnlock,
  onOpen,
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="space-y-4">
      {/* Search bar — mirrors the admin TestSeries search */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl glass-card p-4">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search test series..."
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
      </div>

      {/* Hierarchy table */}
      <div className="overflow-hidden rounded-2xl glass-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Test Series</th>
                <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50 md:table-cell">Description</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Stats</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Access</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">
                    <FileText className="mx-auto mb-3 text-white/20" size={36} />
                    {totalCount === 0
                      ? "No test series available yet — check back soon."
                      : "No series match your search."}
                  </td>
                </tr>
              ) : (
                topics.map((topic, idx) => {
                  const stats = getSeriesStats(topic);
                  const unlocked = isUnlocked(topic);
                  const isUnlocking = unlockingId === topic._id;
                  return (
                    <tr
                      key={topic._id}
                      className="transition-colors hover:bg-white/[0.04] animate-fade-up"
                      style={{ animationDelay: `${idx * 25}ms` }}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-white">
                        <button
                          onClick={() => onOpen(topic)}
                          className="flex items-center gap-2 text-left hover:text-brand-primary"
                        >
                          <Layers size={14} className="text-brand-primary shrink-0" />
                          <span className="break-words">{topic.title}</span>
                        </button>
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-white/50 md:table-cell">
                        <span className="line-clamp-2 break-words">{topic.description || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
                        <span className="font-bold text-white">{stats.subjects}</span> subj ·{" "}
                        <span className="font-bold text-white">{stats.chapters}</span> ch ·{" "}
                        <span className="font-bold text-white">{stats.total}</span> tests
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {topic.isPaid ? (
                          unlocked ? (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-300">
                              Unlocked
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
                              <Lock size={10} /> ₹{Number(topic.price || 0).toLocaleString()}
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-300">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {topic.isPaid && !unlocked && (
                            <button
                              disabled={isUnlocking}
                              onClick={() => onUnlock(topic)}
                              className="inline-flex items-center gap-1.5 rounded-lg btn-gradient px-3 py-2 text-xs font-bold disabled:opacity-50"
                            >
                              {isUnlocking ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                              {isUnlocking ? "Processing…" : `Unlock ₹${Number(topic.price || 0).toLocaleString()}`}
                            </button>
                          )}
                          <button
                            onClick={() => onOpen(topic)}
                            className="inline-flex items-center gap-1.5 rounded-lg glass-pill px-3 py-2 text-xs font-bold text-white/80 hover:text-white"
                          >
                            View <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} totalCount={totalCount} pageSize={PAGE_SIZE} />
    </div>
  );
}

function ResultsTable({ attempts, totalCount, page, totalPages, onPageChange, onView }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl glass-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Test</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Accuracy</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attempts.map((a) => (
                <tr key={a._id} className="transition-colors hover:bg-white/[0.04]">
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    {a.testId?.title || `Test Attempt #${a._id.slice(0, 6)}`}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={11} />
                      {new Date(a.submittedAt || a.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-white whitespace-nowrap">
                    {a.marksObtained || 0}/{a.totalMarks || 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-brand-primary whitespace-nowrap">
                    {(a.percentage || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onView(a._id)}
                      className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 hover:text-brand-primary"
                    >
                      View Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} totalCount={totalCount} pageSize={PAGE_SIZE} />
    </div>
  );
}

function Pagination({ page, totalPages, onChange, totalCount, pageSize }) {
  if (totalCount <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
      <span>
        Showing <span className="font-bold text-white">{start}</span>–
        <span className="font-bold text-white">{end}</span> of{" "}
        <span className="font-bold text-white">{totalCount}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="px-2 font-semibold text-white">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg glass-pill px-3 py-1.5 font-semibold disabled:opacity-30"
        >
          Next <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
