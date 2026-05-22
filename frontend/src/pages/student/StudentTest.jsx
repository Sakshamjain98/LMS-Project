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
  GraduationCap,
  Tag,
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
  let total = 0, live = 0, chapters = 0;
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
  const [activeTab, setActiveTab] = useState("series");

  const [categories, setCategories] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drill-down: null = top level
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);

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
        getAvailableTests().catch(() => ({ topics: [], categories: [] })),
        getMyAttempts().catch(() => ({ data: [] })),
        getStudentSubscription().catch(() => null),
      ]);
      setCategories(testsRes.categories || []);
      setAttempts(attemptsRes.data || []);
      setSubscription(sub || null);
    } catch {
      setError("Failed to load test center data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const subActive =
    subscription?.status === "ACTIVE" &&
    subscription?.plan &&
    subscription.plan !== "FREE";

  const isTopicUnlocked = (topic) => {
    if (!topic?.isPaid) return true;
    if (topic.isUnlocked) return true;
    if (subActive) return true;
    return false;
  };

  // Aggregate stats
  const totalExams = useMemo(
    () => categories.reduce((sum, c) => sum + (c.exams?.length || 0), 0),
    [categories]
  );
  const { totalTests, totalLive } = useMemo(() => {
    let tests = 0, live = 0;
    categories.forEach((cat) =>
      (cat.exams || []).forEach((exam) =>
        (exam.testSeries || []).forEach((ts) => {
          const s = getSeriesStats(ts);
          tests += s.total;
          live += s.live;
        })
      )
    );
    return { totalTests: tests, totalLive: live };
  }, [categories]);

  // Current drill-down nodes
  const currentCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );
  const currentExam = useMemo(
    () => (currentCategory?.exams || []).find((e) => e._id === selectedExamId) || null,
    [currentCategory, selectedExamId]
  );

  const drillLevel = !selectedCategoryId ? 0 : !selectedExamId ? 1 : 2;

  // Items at current level, filtered by search
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filter = (arr) =>
      !q
        ? arr
        : arr.filter((item) =>
            [item.title, item.description]
              .filter(Boolean)
              .some((s) => s.toLowerCase().includes(q))
          );
    if (drillLevel === 0) return filter(categories);
    if (drillLevel === 1) return filter(currentCategory?.exams || []);
    return filter(currentExam?.testSeries || []);
  }, [categories, currentCategory, currentExam, drillLevel, search]);

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, page]);

  const paginatedAttempts = useMemo(() => {
    const start = (resultsPage - 1) * PAGE_SIZE;
    return attempts.slice(start, start + PAGE_SIZE);
  }, [attempts, resultsPage]);
  const resultsTotalPages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE));

  useEffect(() => { setPage(1); }, [search, selectedCategoryId, selectedExamId]);
  useEffect(() => {
    if (attempts.length === 0 && activeTab === "results") setActiveTab("series");
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

  // Breadcrumb trail
  const breadcrumbs = [];
  if (selectedCategoryId) {
    breadcrumbs.push({
      label: "All Categories",
      onClick: () => { setSelectedCategoryId(null); setSelectedExamId(null); setSearch(""); },
    });
    if (currentCategory) {
      breadcrumbs.push({
        label: currentCategory.title,
        onClick: selectedExamId ? () => { setSelectedExamId(null); setSearch(""); } : null,
      });
    }
    if (selectedExamId && currentExam) {
      breadcrumbs.push({ label: currentExam.title, onClick: null });
    }
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>
        {/* HERO */}
        <div className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-brand-primary/10 blur-3xl" />
          <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles size={12} className="text-brand-primary" />
              Curated by exam faculty
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Test Series Hub</h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              Browse by exam category, drill into a series, and start practising.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatPill label="Categories" value={categories.length} />
              <StatPill label="Exams" value={totalExams} />
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
          {/* Tabs */}
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
            <BrowseView
              drillLevel={drillLevel}
              items={paginatedItems}
              totalCount={visibleItems.length}
              search={search}
              onSearch={setSearch}
              breadcrumbs={breadcrumbs}
              onSelectCategory={(id) => { setSelectedCategoryId(id); setSelectedExamId(null); setSearch(""); }}
              onSelectExam={(id) => { setSelectedExamId(id); setSearch(""); }}
              onOpenSeries={(ts) => navigate(`/student/tests/${ts._id}`)}
              isUnlocked={isTopicUnlocked}
              unlockingId={unlockingId}
              onUnlock={handleUnlock}
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

function BrowseView({
  drillLevel,
  items,
  totalCount,
  search,
  onSearch,
  breadcrumbs,
  onSelectCategory,
  onSelectExam,
  onOpenSeries,
  isUnlocked,
  unlockingId,
  onUnlock,
  page,
  totalPages,
  onPageChange,
}) {
  const levelLabel = ["Exam Categories", "Exams", "Test Series"][drillLevel];

  return (
    <div className="space-y-4">
      {/* Breadcrumb + search bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl glass-card p-4">
        {breadcrumbs.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1 text-xs text-white/50 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight size={11} className="shrink-0 text-white/30" />}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-brand-primary transition-colors truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-white font-semibold truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="relative min-w-52 flex-1 ml-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={`Search ${levelLabel.toLowerCase()}…`}
            className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>
      </div>

      {/* Level label */}
      <div className="flex items-center gap-2 px-1">
        <LevelIcon level={drillLevel} />
        <h2 className="text-base font-bold text-white">{levelLabel}</h2>
        <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">{totalCount}</span>
      </div>

      {/* Categories and exams as cards; test series as table */}
      {drillLevel < 2 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/40">
              <FileText size={36} className="mb-3 text-white/20" />
              <p className="text-sm">
                {totalCount === 0
                  ? `No ${levelLabel.toLowerCase()} available yet — check back soon.`
                  : "No results match your search."}
              </p>
            </div>
          ) : (
            items.map((item, idx) =>
              drillLevel === 0 ? (
                <CategoryCard key={item._id} category={item} idx={idx} onClick={() => onSelectCategory(item._id)} />
              ) : (
                <ExamCard key={item._id} exam={item} idx={idx} onClick={() => onSelectExam(item._id)} />
              )
            )
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl glass-card">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Test Series</th>
                  <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50 md:table-cell">Description</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Stats</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Access</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">
                      <FileText className="mx-auto mb-3 text-white/20" size={36} />
                      {totalCount === 0 ? "No test series in this exam." : "No series match your search."}
                    </td>
                  </tr>
                ) : (
                  items.map((ts, idx) => {
                    const stats = getSeriesStats(ts);
                    const unlocked = isUnlocked(ts);
                    const isUnlocking = unlockingId === ts._id;
                    return (
                      <tr
                        key={ts._id}
                        className="transition-colors hover:bg-white/4 animate-fade-up"
                        style={{ animationDelay: `${idx * 25}ms` }}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          <button
                            onClick={() => onOpenSeries(ts)}
                            className="flex items-center gap-2 text-left hover:text-brand-primary"
                          >
                            <Layers size={14} className="text-brand-primary shrink-0" />
                            <span className="wrap-break-word">{ts.title}</span>
                          </button>
                        </td>
                        <td className="hidden px-6 py-4 text-sm text-white/50 md:table-cell">
                          <span className="line-clamp-2 wrap-break-word">{ts.description || "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
                          <span className="font-bold text-white">{stats.subjects}</span> subj ·{" "}
                          <span className="font-bold text-white">{stats.chapters}</span> ch ·{" "}
                          <span className="font-bold text-white">{stats.total}</span> tests
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {ts.isPaid ? (
                            unlocked ? (
                              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-300">
                                Unlocked
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
                                <Lock size={10} /> ₹{Number(ts.price || 0).toLocaleString()}
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
                            {ts.isPaid && !unlocked && (
                              <button
                                disabled={isUnlocking}
                                onClick={() => onUnlock(ts)}
                                className="inline-flex items-center gap-1.5 rounded-lg btn-gradient px-3 py-2 text-xs font-bold disabled:opacity-50"
                              >
                                {isUnlocking ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                                {isUnlocking ? "Processing…" : `Unlock ₹${Number(ts.price || 0).toLocaleString()}`}
                              </button>
                            )}
                            <button
                              onClick={() => onOpenSeries(ts)}
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
      )}

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} totalCount={totalCount} pageSize={PAGE_SIZE} />
    </div>
  );
}

function LevelIcon({ level }) {
  if (level === 0) return <Tag size={16} className="text-purple-400" />;
  if (level === 1) return <GraduationCap size={16} className="text-sky-400" />;
  return <Layers size={16} className="text-brand-primary" />;
}

function CategoryCard({ category, idx, onClick }) {
  const examCount = category.exams?.length || 0;
  const seriesCount = (category.exams || []).reduce(
    (sum, e) => sum + (e.testSeries?.length || 0),
    0
  );
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl glass-card p-5 transition-all hover:border-brand-primary/30 hover:bg-white/5 animate-fade-up"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
          <Tag size={18} />
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
          {examCount} exam{examCount !== 1 ? "s" : ""}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2">
        {category.title}
      </h3>
      {category.description && (
        <p className="mt-1 text-xs text-white/50 line-clamp-2">{category.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
        <span>{seriesCount} series</span>
        <span className="flex items-center gap-1 text-brand-primary group-hover:gap-2 transition-all">
          Explore <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

function ExamCard({ exam, idx, onClick }) {
  const seriesCount = exam.testSeries?.length || 0;
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl glass-card p-5 transition-all hover:border-brand-primary/30 hover:bg-white/5 animate-fade-up"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
          <GraduationCap size={18} />
        </div>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">
          {seriesCount} series
        </span>
      </div>
      <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2">
        {exam.title}
      </h3>
      {exam.description && (
        <p className="mt-1 text-xs text-white/50 line-clamp-2">{exam.description}</p>
      )}
      <div className="mt-3 flex items-center justify-end text-[11px] text-brand-primary">
        <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
          View Series <ArrowRight size={11} />
        </span>
      </div>
    </button>
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

function ResultsTable({ attempts, totalCount, page, totalPages, onPageChange, onView }) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl glass-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Test</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Score</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Accuracy</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attempts.map((a) => (
                <tr key={a._id} className="transition-colors hover:bg-white/4">
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
