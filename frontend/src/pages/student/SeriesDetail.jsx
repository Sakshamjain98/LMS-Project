import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Clock,
  Lock,
  Loader2,
  AlertCircle,
  Folder,
  FileText,
  Search,
  Layers,
  ShieldAlert,
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  getAvailableTests,
  getMyAttempts,
  startTest,
  getStudentSubscription,
  createTopicOrder,
  verifyTopicPayment,
} from "../../services/studentService";
import TestPlayer from "./TestPlayer";
import TestResult from "./TestResult";

const PAGE_SIZE = 8;

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

export default function SeriesDetail() {
  const { topicId } = useParams();
  const [params, setParams] = useSearchParams();

  // 'series' = browsing the hierarchy, 'player' = active test, 'result' = analytics
  const [view, setView] = useState("series");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [topic, setTopic] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [unlocking, setUnlocking] = useState(false);

  const [activeAttemptData, setActiveAttemptData] = useState(null);
  const [activeResultId, setActiveResultId] = useState(null);

  // Drill-down state — same shape as admin's TestSeries.jsx URL params.
  const level = params.get("level") || "subjects"; // 'subjects' | 'chapters' | 'tests'
  const selectedSubjectId = params.get("subjectId") || null;
  const selectedChapterId = params.get("chapterId") || null;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const updateUrl = (next) => {
    const merged = {
      level: next.level ?? level,
      subjectId: next.subjectId === undefined ? selectedSubjectId : next.subjectId,
      chapterId: next.chapterId === undefined ? selectedChapterId : next.chapterId,
    };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => v && sp.set(k, v));
    setParams(sp, { replace: true });
    setPage(1);
    setSearch("");
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [testsRes, attemptsRes, sub] = await Promise.all([
        getAvailableTests().catch(() => ({ topics: [] })),
        getMyAttempts().catch(() => ({ data: [] })),
        getStudentSubscription().catch(() => null),
      ]);
      const found = (testsRes.topics || []).find((t) => t._id === topicId);
      if (!found) {
        setError("This test series isn't available.");
      } else {
        setTopic(found);
      }
      setAttempts(attemptsRes.data || []);
      setSubscription(sub || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "series") return;
    loadData();
  }, [topicId, view]);

  const subActive =
    subscription?.status === "ACTIVE" &&
    subscription?.plan &&
    subscription.plan !== "FREE";
  const isUnlocked = !topic?.isPaid || Boolean(topic?.isUnlocked) || subActive;

  // Build attempts map for status badges in the test list.
  const attemptsByTest = useMemo(() => {
    return attempts.reduce((map, attempt) => {
      const tid = typeof attempt?.testId === "object" ? attempt?.testId?._id : attempt?.testId;
      if (!tid) return map;
      const entry = map[tid] || { latest: null, count: 0 };
      entry.count += 1;
      const curT = new Date(attempt?.submittedAt || attempt?.updatedAt || attempt?.createdAt || 0).getTime();
      const prevT = entry.latest
        ? new Date(entry.latest?.submittedAt || entry.latest?.updatedAt || entry.latest?.createdAt || 0).getTime()
        : -1;
      if (!entry.latest || curT >= prevT) entry.latest = attempt;
      map[tid] = entry;
      return map;
    }, {});
  }, [attempts]);

  const subjects = topic?.subjects || [];
  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId) || null;
  const chapters = selectedSubject?.chapters || [];
  const selectedChapter = chapters.find((c) => c._id === selectedChapterId) || null;
  const tests = selectedChapter?.tests || [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [];
    if (level === "subjects") rows = subjects;
    else if (level === "chapters") rows = chapters;
    else rows = tests;
    if (!q) return rows;
    return rows.filter((r) => (r.title || "").toLowerCase().includes(q));
  }, [level, subjects, chapters, tests, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  useEffect(() => {
    setPage(1);
  }, [search, level, selectedSubjectId, selectedChapterId]);

  // Breadcrumb pieces for the hero
  const breadcrumbs = [
    { label: topic?.title, onClick: () => updateUrl({ level: "subjects", subjectId: null, chapterId: null }) },
  ];
  if (selectedSubject && (level === "chapters" || level === "tests")) {
    breadcrumbs.push({
      label: selectedSubject.title,
      onClick: () => updateUrl({ level: "chapters", chapterId: null }),
    });
  }
  if (selectedChapter && level === "tests") {
    breadcrumbs.push({ label: selectedChapter.title, onClick: () => {} });
  }

  const headerTitle =
    level === "subjects" ? "Subjects" : level === "chapters" ? "Chapters" : "Tests";

  const goBack = () => {
    if (level === "tests") updateUrl({ level: "chapters", chapterId: null });
    else if (level === "chapters") updateUrl({ level: "subjects", subjectId: null });
  };

  const handleStartTest = async (testId) => {
    try {
      setLoading(true);
      const res = await startTest(testId);
      setActiveAttemptData(res.data);
      setView("player");
    } catch (err) {
      setError(err.message || "Failed to start test.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (attemptId) => {
    setActiveResultId(attemptId);
    setView("result");
  };

  const backToSeries = () => {
    setView("series");
    setActiveAttemptData(null);
    setActiveResultId(null);
  };

  const handleUnlock = async () => {
    if (!topic?._id) return;
    setUnlocking(true);
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
          setUnlocking(false);
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
        modal: { ondismiss: () => setUnlocking(false) },
      });
      rzp.open();
    } catch (err) {
      setUnlocking(false);
      setError(err?.message || "Failed to start unlock flow.");
    }
  };

  if (view === "player" && activeAttemptData) {
    return <TestPlayer attemptData={activeAttemptData} onFinish={(id) => handleViewResult(id)} onExit={backToSeries} />;
  }
  if (view === "result" && activeResultId) {
    return <TestResult attemptId={activeResultId} onBack={backToSeries} />;
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
          <Link
            to="/student/tests"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to all series
          </Link>

          {loading ? (
            <div className="mt-12 flex items-center justify-center text-white/60">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading series…
            </div>
          ) : error ? (
            <div className="mt-12 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : topic ? (
            <>
              {/* Hero — title, paid badge, stats, unlock CTA */}
              <div className="relative mt-5 overflow-hidden rounded-3xl glass-panel ambient-glow p-6 md:p-8 animate-fade-up">
                <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.isPaid ? (
                        isUnlocked ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                            Premium · Unlocked
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                            Premium · ₹{Number(topic.price || 0).toLocaleString()}
                          </span>
                        )
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                          Free Series
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold text-white/60">
                          <Lock size={11} /> Locked Preview
                        </span>
                      )}
                    </div>
                    <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl break-words">{topic.title}</h1>
                    {topic.description && (
                      <p className="mt-2 max-w-2xl text-sm text-white/60 break-words">{topic.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                      <Pill label="Subjects" value={subjects.length} />
                      <Pill label="Chapters" value={subjects.reduce((n, s) => n + (s.chapters?.length || 0), 0)} />
                      <Pill
                        label="Tests"
                        value={subjects.reduce(
                          (n, s) => n + (s.chapters || []).reduce((m, c) => m + (c.tests?.length || 0), 0),
                          0
                        )}
                      />
                    </div>
                  </div>

                  {topic.isPaid && !isUnlocked && (
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="self-start inline-flex items-center gap-2 rounded-xl btn-gradient px-5 py-2.5 text-sm font-bold whitespace-nowrap disabled:opacity-50"
                    >
                      {unlocking ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Processing…
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Unlock for ₹{Number(topic.price || 0).toLocaleString()}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Drill-down toolbar — mirrors the admin TestSeries.jsx layout */}
              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{headerTitle}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/50">
                    {breadcrumbs.map((b, i) => (
                      <span key={`${b.label}-${i}`} className="inline-flex items-center gap-1.5">
                        <button
                          onClick={b.onClick}
                          className="rounded-full glass-pill px-2 py-0.5 text-white/80 hover:text-white"
                        >
                          {b.label}
                        </button>
                        {i < breadcrumbs.length - 1 && <ChevronRight size={11} />}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {level !== "subjects" && (
                    <button
                      onClick={goBack}
                      className="rounded-xl glass-pill px-4 py-2 text-sm font-medium text-white/80 hover:text-white"
                    >
                      ← Back
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl glass-card p-4">
                <div className="relative min-w-[260px] flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${headerTitle.toLowerCase()}...`}
                    className="w-full rounded-xl border border-white/10 bg-dark-300/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                  />
                </div>
              </div>

              {/* Hierarchy table */}
              <div className="mt-4 overflow-hidden rounded-2xl glass-card">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">
                          {headerTitle.replace(/s$/, "")}
                        </th>
                        <th className="hidden px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50 md:table-cell">
                          Description
                        </th>
                        {level === "tests" && (
                          <>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Info</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Status</th>
                          </>
                        )}
                        {level !== "tests" && (
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/50">Items</th>
                        )}
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-white/50">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-sm text-white/40">
                            <FileText className="mx-auto mb-3 text-white/20" size={36} />
                            {filteredRows.length === 0 && search
                              ? `No ${headerTitle.toLowerCase()} match your search.`
                              : `No ${headerTitle.toLowerCase()} here yet.`}
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, idx) => {
                          if (level === "subjects") {
                            const ch = row.chapters?.length || 0;
                            return (
                              <HierarchyRow
                                key={row._id}
                                idx={idx}
                                title={row.title}
                                description={row.description}
                                icon={<Folder size={14} className="text-sky-400" />}
                                meta={`${ch} chapter${ch === 1 ? "" : "s"}`}
                                onOpen={() => updateUrl({ level: "chapters", subjectId: row._id, chapterId: null })}
                              />
                            );
                          }
                          if (level === "chapters") {
                            const ts = row.tests?.length || 0;
                            return (
                              <HierarchyRow
                                key={row._id}
                                idx={idx}
                                title={row.title}
                                description={row.description}
                                icon={<Folder size={14} className="text-amber-400" />}
                                meta={`${ts} test${ts === 1 ? "" : "s"}`}
                                onOpen={() => updateUrl({ level: "tests", chapterId: row._id })}
                              />
                            );
                          }
                          // level === "tests"
                          return (
                            <TestRow
                              key={row._id}
                              idx={idx}
                              test={row}
                              isUnlocked={isUnlocked}
                              attemptInfo={attemptsByTest[row._id]}
                              onStart={() => handleStartTest(row._id)}
                              onViewResult={(id) => handleViewResult(id)}
                            />
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} totalCount={filteredRows.length} pageSize={PAGE_SIZE} />
              </div>

              {topic.isPaid && !isUnlocked && (
                <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100 flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-300" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-200">This is a premium test series</p>
                    <p className="mt-1 text-amber-100/80">
                      You can browse the chapters above. Unlock the full series for{" "}
                      <strong className="text-white">₹{Number(topic.price || 0).toLocaleString()}</strong> to start tests, see solutions, and earn All-India Ranks.
                    </p>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="self-start inline-flex items-center gap-2 rounded-xl btn-gradient px-4 py-2 text-xs font-bold whitespace-nowrap disabled:opacity-50"
                  >
                    {unlocking ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                    Unlock Now
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Pill({ label, value }) {
  return (
    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px]">
      <span className="font-bold text-white">{value}</span> <span className="text-white/50">{label}</span>
    </span>
  );
}

function HierarchyRow({ idx, title, description, icon, meta, onOpen }) {
  return (
    <tr
      className="transition-colors hover:bg-white/[0.04] animate-fade-up cursor-pointer"
      style={{ animationDelay: `${idx * 25}ms` }}
      onClick={onOpen}
    >
      <td className="px-6 py-4 text-sm font-semibold text-white">
        <div className="flex items-center gap-2">
          {icon}
          <span className="break-words">{title}</span>
        </div>
      </td>
      <td className="hidden px-6 py-4 text-sm text-white/50 md:table-cell">
        <span className="line-clamp-2 break-words">{description || "—"}</span>
      </td>
      <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">{meta}</td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg glass-pill px-3 py-1.5 text-xs font-bold text-white/80 hover:text-white"
        >
          Open <ChevronRight size={12} />
        </button>
      </td>
    </tr>
  );
}

function TestRow({ idx, test, isUnlocked, attemptInfo, onStart, onViewResult }) {
  const latestAttempt = attemptInfo?.latest;
  const attemptCount = attemptInfo?.count || 0;
  const attemptLimit = Number(test.attemptLimit) || 0;
  const limitReached = attemptLimit > 0 && attemptCount >= attemptLimit;

  const isCompleted =
    latestAttempt &&
    (["submitted", "evaluated"].includes(latestAttempt?.status) ||
      Boolean(latestAttempt?.autoSubmitted) ||
      Boolean(latestAttempt?.isCompleted));
  const canRetake = isCompleted && !limitReached && isUnlocked;

  return (
    <tr
      className="transition-colors hover:bg-white/[0.04] animate-fade-up"
      style={{ animationDelay: `${idx * 25}ms` }}
    >
      <td className="px-6 py-4 text-sm font-semibold text-white">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-brand-primary shrink-0" />
          <span className="break-words">{test.title}</span>
        </div>
      </td>
      <td className="hidden px-6 py-4 text-sm text-white/50 md:table-cell">
        <span className="line-clamp-2 break-words">{test.description || "—"}</span>
      </td>
      <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <ClipboardList size={11} className="text-brand-primary/70" />
            {test.questions?.length || 0} Q
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} className="text-brand-primary/70" />
            {test.duration || 0}m
          </span>
          {test.isProctored && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
              <ShieldAlert size={9} /> Proctored
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
        {attemptLimit === 0 ? "Unlimited" : `${attemptCount}/${attemptLimit} used`}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {!isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white/40">
              <Lock size={12} /> Locked
            </span>
          ) : (
            <>
              {isCompleted && (
                <button
                  onClick={() => onViewResult(latestAttempt._id)}
                  className="rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/25"
                >
                  View Result
                </button>
              )}
              {canRetake ? (
                <button onClick={onStart} className="rounded-lg btn-gradient px-3 py-2 text-xs font-bold">
                  Retake
                </button>
              ) : !isCompleted ? (
                <button onClick={onStart} className="rounded-lg btn-gradient px-3 py-2 text-xs font-bold">
                  Start Test
                </button>
              ) : limitReached ? (
                <span className="rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-white/40">Limit reached</span>
              ) : null}
            </>
          )}
        </div>
      </td>
    </tr>
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
