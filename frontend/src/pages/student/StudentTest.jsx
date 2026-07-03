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
  Zap,
  BookOpen,
  Folder,
  Star,
  TrendingUp,
  Filter,
  X,
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
import { formatValidity } from "../../utils/validity";

const PAGE_SIZE = 8;

const isLiveTest = (test) => {
  const now = Date.now();
  const startOk = !test.startTime || new Date(test.startTime).getTime() <= now;
  const endOk = !test.endTime || new Date(test.endTime).getTime() >= now;
  return startOk && endOk;
};

// Recursively count tests in a topic (subject → chapter → tests)
const countTopicTests = (topic) =>
  (topic?.subjects || []).reduce(
    (sum, s) => sum + (s.chapters || []).reduce((cs, c) => cs + (c.tests?.length || 0), 0),
    0
  );

const countTopicSubjects = (topic) => topic?.subjects?.length || 0;

const countTopicChapters = (topic) =>
  (topic?.subjects || []).reduce((sum, s) => sum + (s.chapters?.length || 0), 0);

// Stats for an exam: aggregate across all testSeries + allIndiaTestSeries
const getExamStats = (exam) => {
  let subjects = 0, chapters = 0, tests = 0, live = 0;
  (exam?.testSeries || []).forEach((ts) => {
    subjects += countTopicSubjects(ts);
    chapters += countTopicChapters(ts);
    (ts.subjects || []).forEach((s) =>
      (s.chapters || []).forEach((c) =>
        (c.tests || []).forEach((t) => {
          tests += 1;
          if (isLiveTest(t)) live += 1;
        })
      )
    );
  });
  (exam?.allIndiaTestSeries || []).forEach((a) => {
    tests += a.tests?.length || 0;
    (a.tests || []).forEach((t) => { if (isLiveTest(t)) live += 1; });
  });
  return { subjects, chapters, tests, live };
};

// Stats for a category
const getCategoryStats = (category) => {
  let totalExams = category.exams?.length || 0;
  let totalSeries = 0, totalTests = 0;
  (category.exams || []).forEach((e) => {
    totalSeries += (e.testSeries?.length || 0) + (e.allIndiaTestSeries?.length || 0);
    const s = getExamStats(e);
    totalTests += s.tests;
  });
  return { totalExams, totalSeries, totalTests };
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

// ─── Main Component ──────────────────────────────────────────────────────────

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

  // Access is purely per-test-series — the platform subscription no longer
  // unlocks individual series, matching the server-side per-topic gating.
  const isTopicUnlocked = (topic) => {
    if (!topic?.isPaid) return true;
    return Boolean(topic.isUnlocked);
  };

  // Global stats
  const globalStats = useMemo(() => {
    let totalExams = 0, totalTests = 0, totalLive = 0;
    categories.forEach((cat) => {
      totalExams += cat.exams?.length || 0;
      (cat.exams || []).forEach((e) => {
        const s = getExamStats(e);
        totalTests += s.tests;
        totalLive += s.live;
      });
    });
    return { totalCategories: categories.length, totalExams, totalTests, totalLive };
  }, [categories]);

  const currentCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );
  const currentExam = useMemo(
    () => (currentCategory?.exams || []).find((e) => e._id === selectedExamId) || null,
    [currentCategory, selectedExamId]
  );

  const drillLevel = !selectedCategoryId ? 0 : !selectedExamId ? 1 : 2;

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filter = (arr) =>
      !q
        ? arr
        : arr.filter((item) =>
            [item.title, item.description].filter(Boolean).some((s) => s.toLowerCase().includes(q))
          );
    if (drillLevel === 0) return filter(categories);
    if (drillLevel === 1) return filter(currentCategory?.exams || []);
    // At level 2: combine testSeries + allIndiaTestSeries
    const combined = [
      ...(currentExam?.testSeries || []).map((ts) => ({ ...ts, _kind: "series" })),
      ...(currentExam?.allIndiaTestSeries || []).map((a) => ({ ...a, _kind: "aits" })),
    ];
    return filter(combined);
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
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
          <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles size={12} className="text-brand-primary" />
              Curated by exam faculty
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Test Series <span className="bg-linear-to-r from-brand-primary to-emerald-400 bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              Browse by exam category, drill into a series, and start practising.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill icon={<Tag size={14} />} label="Categories" value={globalStats.totalCategories} color="purple" />
              <StatPill icon={<GraduationCap size={14} />} label="Exams" value={globalStats.totalExams} color="sky" />
              <StatPill icon={<ClipboardList size={14} />} label="Total Tests" value={globalStats.totalTests} color="emerald" />
              <StatPill icon={<Zap size={14} />} label="Live Now" value={globalStats.totalLive} color="amber" />
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

// ─── BrowseView ──────────────────────────────────────────────────────────────

function BrowseView({
  drillLevel, items, totalCount, search, onSearch, breadcrumbs,
  onSelectCategory, onSelectExam, onOpenSeries,
  isUnlocked, unlockingId, onUnlock,
  page, totalPages, onPageChange,
}) {
  const levelLabel = ["Exam Categories", "Exams", "Tests & Series"][drillLevel];

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
                  <button onClick={crumb.onClick} className="hover:text-brand-primary transition-colors truncate">
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
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Level header */}
      <div className="flex items-center gap-2 px-1">
        <LevelIcon level={drillLevel} />
        <h2 className="text-base font-bold text-white">{levelLabel}</h2>
        <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40">{totalCount}</span>
      </div>

      {drillLevel < 2 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <EmptyState totalCount={totalCount} levelLabel={levelLabel} />
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
        <SeriesAndAITSTable
          items={items}
          totalCount={totalCount}
          isUnlocked={isUnlocked}
          unlockingId={unlockingId}
          onUnlock={onUnlock}
          onOpen={onOpenSeries}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} totalCount={totalCount} pageSize={PAGE_SIZE} />
    </div>
  );
}

// ─── Series + AITS combined table at drill level 2 ──────────────────────────

function SeriesAndAITSTable({ items, totalCount, isUnlocked, unlockingId, onUnlock, onOpen }) {
  return (
    <div className="overflow-hidden rounded-2xl glass-card">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Name</th>
              <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50 md:table-cell">Type</th>
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
              items.map((item, idx) => {
                const isAits = item._kind === "aits";
                const unlocked = isUnlocked(item);
                const isUnlocking = unlockingId === item._id;

                // Stats differ between regular series and AITS
                let stats = { subjects: 0, chapters: 0, tests: 0 };
                if (isAits) {
                  stats.tests = item.tests?.length || 0;
                } else {
                  stats.subjects = countTopicSubjects(item);
                  stats.chapters = countTopicChapters(item);
                  stats.tests = countTopicTests(item);
                }

                return (
                  <tr
                    key={item._id}
                    className="transition-colors hover:bg-white/4 animate-fade-up"
                    style={{ animationDelay: `${idx * 25}ms` }}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      <button
                        onClick={() => onOpen(item)}
                        className="flex items-center gap-2 text-left hover:text-brand-primary"
                      >
                        {isAits ? (
                          <Zap size={14} className="text-yellow-400 shrink-0" />
                        ) : (
                          <Layers size={14} className="text-brand-primary shrink-0" />
                        )}
                        <span className="wrap-break-word">{item.title}</span>
                      </button>
                    </td>
                    <td className="hidden px-6 py-4 text-xs md:table-cell">
                      {isAits ? (
                        <span className="rounded-full bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-1 font-bold text-yellow-300">
                          All India
                        </span>
                      ) : (
                        <span className="rounded-full bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 font-bold text-brand-primary">
                          Test Series
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
                      {isAits ? (
                        <span>
                          <span className="font-bold text-white">{stats.tests}</span> tests
                        </span>
                      ) : (
                        <span>
                          <span className="font-bold text-white">{stats.subjects}</span> subj ·{" "}
                          <span className="font-bold text-white">{stats.chapters}</span> ch ·{" "}
                          <span className="font-bold text-white">{stats.tests}</span> tests
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-col items-start gap-1.5">
                        {item.isPaid ? (
                          unlocked ? (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-300">
                              Unlocked
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
                              <Lock size={10} /> ₹{Number(item.price || 0).toLocaleString()}
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-300">
                            Free
                          </span>
                        )}
                        {item.isPaid && !isAits && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-primary/90">
                            <Clock size={9} /> {formatValidity(item.validityMonths)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.isPaid && !unlocked && (
                          <button
                            disabled={isUnlocking}
                            onClick={() => onUnlock(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg btn-gradient px-3 py-2 text-xs font-bold disabled:opacity-50"
                          >
                            {isUnlocking ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                            {isUnlocking ? "Processing…" : `Unlock ₹${Number(item.price || 0).toLocaleString()}`}
                          </button>
                        )}
                        <button
                          onClick={() => onOpen(item)}
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
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function CategoryCard({ category, idx, onClick }) {
  const stats = useMemo(() => getCategoryStats(category), [category]);

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl glass-card p-5 transition-all duration-300 hover:border-purple-500/40 hover:bg-white/5 hover:shadow-[0_8px_32px_rgba(168,85,247,0.15)] hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/25 to-purple-600/10 text-purple-400 ring-1 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all">
          <Tag size={20} />
        </div>
        <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[10px] font-bold text-purple-300">
          {stats.totalExams} Exam{stats.totalExams !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
        {category.title}
      </h3>
      {category.description && (
        <p className="mt-1.5 text-xs text-white/50 line-clamp-2">{category.description}</p>
      )}

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center">
          <p className="text-xs font-bold text-white">{stats.totalSeries}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Series</p>
        </div>
        <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2 text-center">
          <p className="text-xs font-bold text-white">{stats.totalTests}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Tests</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-end text-[11px] text-purple-400 group-hover:text-purple-300">
        <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
          Explore <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

function ExamCard({ exam, idx, onClick }) {
  const stats = useMemo(() => getExamStats(exam), [exam]);
  const seriesCount = (exam.testSeries?.length || 0) + (exam.allIndiaTestSeries?.length || 0);
  const aitsCount = exam.allIndiaTestSeries?.length || 0;

  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl glass-card p-5 transition-all duration-300 hover:border-brand-primary/40 hover:bg-white/5 hover:shadow-[0_8px_32px_rgba(0,200,133,0.15)] hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${idx * 40}ms` }}
    >
      {/* Icon row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-brand-primary/25 to-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/20 group-hover:ring-brand-primary/40 transition-all">
          <GraduationCap size={20} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 text-[10px] font-bold text-brand-primary">
            {seriesCount} Series
          </span>
          {aitsCount > 0 && (
            <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 text-[10px] font-bold text-yellow-300 inline-flex items-center gap-1">
              <Zap size={8} /> {aitsCount} AITS
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2 leading-snug">
        {exam.title}
      </h3>
      {exam.description && (
        <p className="mt-1.5 text-xs text-white/50 line-clamp-2">{exam.description}</p>
      )}

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/3 border border-white/5 px-2 py-2 text-center">
          <p className="text-xs font-bold text-white">{stats.subjects}</p>
          <p className="text-[9px] text-white/40 mt-0.5">Subjects</p>
        </div>
        <div className="rounded-lg bg-white/3 border border-white/5 px-2 py-2 text-center">
          <p className="text-xs font-bold text-white">{stats.chapters}</p>
          <p className="text-[9px] text-white/40 mt-0.5">Chapters</p>
        </div>
        <div className="rounded-lg bg-white/3 border border-white/5 px-2 py-2 text-center">
          <p className="text-xs font-bold text-white">{stats.tests}</p>
          <p className="text-[9px] text-white/40 mt-0.5">Tests</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px]">
        {stats.live > 0 && (
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {stats.live} Live
          </span>
        )}
        <span className="flex items-center gap-1 text-brand-primary group-hover:gap-2 transition-all ml-auto">
          View Series <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}

// ─── Misc Components ─────────────────────────────────────────────────────────

function LevelIcon({ level }) {
  if (level === 0) return <Tag size={16} className="text-purple-400" />;
  if (level === 1) return <GraduationCap size={16} className="text-brand-primary" />;
  return <Layers size={16} className="text-brand-primary" />;
}

function EmptyState({ totalCount, levelLabel }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/40">
      <FileText size={36} className="mb-3 text-white/20" />
      <p className="text-sm">
        {totalCount === 0
          ? `No ${levelLabel.toLowerCase()} available yet — check back soon.`
          : "No results match your search."}
      </p>
    </div>
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

function StatPill({ icon, label, value, color }) {
  const colors = {
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    sky: "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${colors[color] || "border-white/10 bg-white/5 text-white/60"}`}>
      <div className="flex items-center gap-1.5 mb-1">{icon}<p className="text-[10px] uppercase tracking-widest font-semibold">{label}</p></div>
      <p className="text-xl font-bold text-white">{value}</p>
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
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">
                    No attempts yet.
                  </td>
                </tr>
              ) : (
                attempts.map((a) => (
                  <tr key={a._id} className="transition-colors hover:bg-white/4">
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {a.testId?.title || `Test #${a._id.slice(0, 6)}`}
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
                      {a.attemptedQuestions > 0 ? ((a.correctAnswers / a.attemptedQuestions) * 100).toFixed(1) : "0.0"}%
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
                ))
              )}
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
        <span className="px-2 font-semibold text-white">{page} / {totalPages}</span>
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
