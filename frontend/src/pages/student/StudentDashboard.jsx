import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStudentProfile,
  getMyAttempts,
  getAvailableTests,
} from "../../services/studentService";
import { getPublicCourses } from "../../services/courseService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  ChevronRight,
  ChevronLeft,
  CircleAlert,
  Clock,
  FileText,
  LayoutDashboard,
  LineChart,
  Trophy,
  Layers,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  PlayCircle,
  Tag,
  GraduationCap,
  BookOpen,
  Play,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  AlertTriangle,
  RefreshCw,
  Hourglass,
  Compass,
} from "lucide-react";
import { formatValidity } from "../../utils/validity";

const DAY_MS = 1000 * 60 * 60 * 24;
const daysUntil = (date) =>
  date ? Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS) : null;

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hierarchy drill-down state for the "Test Series" section
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profRes, attemptsRes, testsRes, coursesRes] = await Promise.all([
          getStudentProfile().catch(() => ({})),
          getMyAttempts().catch(() => ({ data: [] })),
          getAvailableTests().catch(() => ({ topics: [], categories: [] })),
          getPublicCourses(6).catch(() => ({ courses: [] })),
        ]);
        setProfile(profRes.user || {});
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
        const cats = Array.isArray(testsRes.categories) ? testsRes.categories : [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0]._id);
        setCourses(coursesRes?.courses || []);
        setTopics(Array.isArray(testsRes.topics) ? testsRes.topics : []);
      } catch {
        setError("Failed to load some dashboard components.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const firstName = profile?.name?.trim()?.split(" ")?.[0] || "Student";
  const greeting = getGreeting();

  // Sort attempts newest-first for both "Continue" and "Recent" sections.
  const sortedAttempts = useMemo(
    () => [...attempts].sort((a, b) => {
      const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return bTime - aTime;
    }),
    [attempts]
  );

  const completedTests = sortedAttempts.filter(
    (a) => a.status === "submitted" || a.status === "evaluated"
  ).length;
  const ongoingTests = sortedAttempts.filter(
    (a) => a.status !== "submitted" && a.status !== "evaluated"
  ).length;
  const averageScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length).toFixed(1)
    : "0.0";

  const continueTests = sortedAttempts.filter(
    (a) => a.status !== "submitted" && a.status !== "evaluated"
  ).slice(0, 6);
  const recentTests = sortedAttempts.filter(
    (a) => a.status === "submitted" || a.status === "evaluated"
  ).slice(0, 6);

  // The single most recent in-progress attempt — surfaced as a resume hero CTA.
  const resumeTarget = continueTests[0] || null;

  // Score trend (oldest → newest) over the last 10 completed attempts, plus the
  // student's best result — powers the performance panel + sparkline.
  const completedAttempts = useMemo(
    () => sortedAttempts.filter((a) => a.status === "submitted" || a.status === "evaluated"),
    [sortedAttempts]
  );
  const scoreTrend = useMemo(
    () => completedAttempts.slice(0, 10).reverse().map((a) => Number(a.percentage || 0)),
    [completedAttempts]
  );
  const bestScore = completedAttempts.length
    ? Math.max(...completedAttempts.map((a) => Number(a.percentage || 0)))
    : 0;
  const trendDelta =
    scoreTrend.length >= 2 ? scoreTrend[scoreTrend.length - 1] - scoreTrend[0] : 0;
  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY_MS;
    return attempts.filter(
      (a) => new Date(a.updatedAt || a.createdAt || 0).getTime() >= weekAgo
    ).length;
  }, [attempts]);

  // Owned (unlocked paid) test series, with expiry awareness, derived from the
  // access-annotated topic list. Drives the "My Active Series" panel + alerts.
  const ownedSeries = useMemo(
    () => topics.filter((t) => t.isPaid && t.isUnlocked),
    [topics]
  );
  const expiringSoon = useMemo(
    () =>
      ownedSeries
        .map((t) => ({ ...t, daysLeft: daysUntil(t.accessExpiresAt) }))
        .filter((t) => t.daysLeft != null && t.daysLeft >= 0 && t.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [ownedSeries]
  );
  const expiredSeries = useMemo(
    () => topics.filter((t) => t.isPaid && t.accessExpired),
    [topics]
  );

  // Derived hierarchy nodes
  const currentCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );
  const currentExam = useMemo(
    () => (currentCategory?.exams || []).find((e) => e._id === selectedExamId) || null,
    [currentCategory, selectedExamId]
  );
  const seriesForExam = useMemo(
    () => [
      ...(currentExam?.testSeries || []),
      ...(currentExam?.allIndiaTestSeries || []),
    ].slice(0, 6),
    [currentExam]
  );

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex min-h-screen items-center justify-center bg-dark-400">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
            <p className="text-base font-semibold text-white">Loading your workspace…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-16 text-gray-200 selection:bg-brand-primary/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:py-10">

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-red-400" />
              <p className="font-medium text-base">{error}</p>
            </div>
          )}

          {/* Header */}
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-widest">
                <Sparkles size={14} />
                {greeting}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                Welcome back, {firstName}
              </h1>
              <p className="text-sm text-white/60">
                Pick up where you left off, or start a new test from your enrolled series.
              </p>
            </div>
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <QuickAction to="/student/tests" icon={<Compass size={15} />} label="Browse Tests" primary />
              <QuickAction to="/student/courses" icon={<BookOpen size={15} />} label="My Courses" />
              <QuickAction to="/student/tests" icon={<Trophy size={15} />} label="Results" />
            </div>
          </header>

          {/* Resume in-progress test */}
          {resumeTarget && (
            <Link
              to="/student/tests"
              className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-brand-primary/30 bg-linear-to-r from-brand-primary/15 via-brand-primary/5 to-transparent p-5 transition-colors hover:border-brand-primary/50 sm:flex-row sm:items-center"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/20 text-brand-primary">
                <PlayCircle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Resume your test</p>
                <h3 className="truncate text-base font-bold text-white">
                  {resumeTarget.testId?.title || "Practice Assessment"}
                </h3>
                <p className="mt-0.5 text-xs text-white/50">
                  Started {formatDateLabel(resumeTarget.updatedAt || resumeTarget.createdAt)} · pick up where you stopped
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-dark-400 transition-transform group-hover:translate-x-0.5">
                Continue <ArrowRight size={15} />
              </span>
            </Link>
          )}

          {/* Subscription expiry alerts */}
          {(expiringSoon.length > 0 || expiredSeries.length > 0) && (
            <ExpiryAlert expiringSoon={expiringSoon} expiredSeries={expiredSeries} navigate={navigate} />
          )}

          {/* Stats + Performance */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              <MetricCard icon={<FileText size={22} />} label="Total Attempts" value={attempts.length} sub={`${thisWeekCount} this week`} />
              <MetricCard icon={<Trophy size={22} />} label="Completed" value={completedTests} sub={`${ongoingTests} in progress`} />
              <MetricCard icon={<Target size={22} />} label="Best Score" value={`${bestScore.toFixed(0)}%`} isPercentage />
              <MetricCard icon={<LineChart size={22} />} label="Average Score" value={`${averageScore}%`} isPercentage />
            </div>
            <PerformancePanel
              trend={scoreTrend}
              average={averageScore}
              delta={trendDelta}
            />
          </div>

          {/* My Active Series */}
          {ownedSeries.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                  My Active Series
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">{ownedSeries.length}</span>
                </h2>
                <Link to="/student/tests" className="group flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary/80">
                  View all<ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ownedSeries.slice(0, 6).map((t, idx) => (
                  <ActiveSeriesCard
                    key={t._id}
                    topic={t}
                    delay={idx * 50}
                    onClick={() => navigate(`/student/tests/${t._id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {courses.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Courses</h2>
                <Link
                  to="/student/courses"
                  className="group flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary/80"
                >
                  Browse all
                  <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course, idx) => (
                  <DashboardCourseCard key={course._id} course={course} delay={idx * 50} />
                ))}
              </div>
            </section>
          )}

          {/* Test Series — Category → Exam → Series hierarchy */}
          <section>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Test Series</h2>
              <Link
                to="/student/tests"
                className="group flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary/80"
              >
                Browse all
                <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {categories.length === 0 ? (
              <EmptyState title="No test series available yet" actionTo="/student/tests" actionLabel="Browse Catalog" />
            ) : (
              <>
                {/* Category tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => { setSelectedCategoryId(cat._id); setSelectedExamId(null); }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold border transition-all ${
                        selectedCategoryId === cat._id
                          ? "btn-gradient border-transparent"
                          : "bg-dark-200 border-white/5 text-white/60 hover:border-brand-primary/30 hover:text-white"
                      }`}
                    >
                      <Tag size={11} />
                      {cat.title}
                    </button>
                  ))}
                </div>

                {!selectedExamId ? (
                  /* Exam grid */
                  (currentCategory?.exams || []).length === 0 ? (
                    <EmptyState title="No exams in this category yet" actionTo="/student/tests" actionLabel="Browse All" />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {(currentCategory.exams || []).map((exam, idx) => (
                        <button
                          key={exam._id}
                          onClick={() => setSelectedExamId(exam._id)}
                          style={{ animationDelay: `${idx * 40}ms` }}
                          className="group text-left animate-fade-up rounded-2xl border border-white/5 bg-dark-200 p-5 transition-colors hover:border-brand-primary/40 hover:bg-dark-100/60 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                              <GraduationCap size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                              {(exam.testSeries?.length || 0) + (exam.allIndiaTestSeries?.length || 0)} series
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-2">
                            {exam.title}
                          </h3>
                          <div className="mt-auto inline-flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold bg-white/5 text-white/60 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                            <span>View Series</span>
                            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  /* Series grid for selected exam */
                  <>
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <button
                        onClick={() => setSelectedExamId(null)}
                        className="flex items-center gap-1.5 text-brand-primary hover:opacity-80 font-semibold transition"
                      >
                        <ChevronLeft size={14} />
                        {currentCategory?.title}
                      </button>
                      <ChevronRight size={12} className="text-white/30" />
                      <span className="text-white font-bold">{currentExam?.title}</span>
                    </div>

                    {seriesForExam.length === 0 ? (
                      <EmptyState title="No test series in this exam yet" actionTo="/student/tests" actionLabel="Browse All" />
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {seriesForExam.map((topic, idx) => (
                          <SeriesCard
                            key={topic._id}
                            topic={topic}
                            delay={idx * 50}
                            onClick={() => navigate(Array.isArray(topic.tests) && !topic.subjects?.length ? "/student/tests" : `/student/tests/${topic._id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>

          {/* Continue Tests — card grid */}
          {continueTests.length > 0 && (
            <DashboardSection
              title="Continue where you left off"
              actionLabel="My Results"
              actionTo="/student/tests"
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {continueTests.map((attempt, idx) => (
                  <ContinueCard key={attempt._id} attempt={attempt} delay={idx * 50} />
                ))}
              </div>
            </DashboardSection>
          )}

          {/* Recent Tests — card grid */}
          <DashboardSection
            title="Recent Results"
            actionLabel="See all"
            actionTo="/student/tests"
          >
            {recentTests.length === 0 ? (
              <EmptyState title="No recent test results" actionTo="/student/tests" actionLabel="Take a test" />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {recentTests.map((attempt, idx) => (
                  <RecentCard key={attempt._id} attempt={attempt} delay={idx * 50} />
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>
    </>
  );
}

/* ----------------------- Sub-components ------------------------------- */

function DashboardSection({ title, actionLabel, actionTo, children }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="group flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary/80"
          >
            {actionLabel}
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon, label, value, isPercentage, sub }) {
  const isNegative = String(value).includes("-");
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-dark-200 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/30">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold lg:text-3xl ${isPercentage && isNegative ? "text-red-400" : "text-white"}`}>
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[11px] font-medium text-white/35 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label, primary }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 ${
        primary
          ? "bg-brand-primary text-dark-400 hover:opacity-90"
          : "border border-white/10 bg-dark-200 text-white/75 hover:border-brand-primary/40 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

// Compact score-trend chart over recent completed attempts.
function Sparkline({ values, width = 240, height = 56 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 100);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(0 200 133 / 0.35)" />
          <stop offset="100%" stopColor="rgb(0 200 133 / 0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path d={line} fill="none" stroke="#00c885" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="#00c885">
          <title>{values[i].toFixed(1)}%</title>
        </circle>
      ))}
    </svg>
  );
}

function PerformancePanel({ trend, average, delta }) {
  const up = delta >= 0;
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-dark-200 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <TrendingUp size={16} className="text-brand-primary" /> Performance
        </p>
        {trend.length >= 2 && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${up ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? "+" : ""}{delta.toFixed(0)}%
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{average}%</span>
        <span className="mb-1 text-[11px] text-white/40">avg over recent tests</span>
      </div>
      <div className="mt-auto pt-4">
        {trend.length >= 2 ? (
          <Sparkline values={trend} />
        ) : (
          <p className="py-4 text-center text-xs text-white/30">Take a few tests to see your trend.</p>
        )}
      </div>
    </div>
  );
}

function ExpiryAlert({ expiringSoon, expiredSeries, navigate }) {
  const hasExpired = expiredSeries.length > 0;
  const soonest = expiringSoon[0];
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center ${hasExpired ? "border-red-500/30 bg-red-500/8" : "border-amber-500/30 bg-amber-500/8"}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${hasExpired ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
        {hasExpired ? <AlertTriangle size={22} /> : <Hourglass size={22} />}
      </div>
      <div className="min-w-0 flex-1">
        {hasExpired ? (
          <>
            <p className="text-sm font-bold text-white">
              {expiredSeries.length} test series {expiredSeries.length === 1 ? "has" : "have"} expired
            </p>
            <p className="mt-0.5 text-xs text-white/55 truncate">
              Renew to regain access: {expiredSeries.slice(0, 2).map((t) => t.title).join(", ")}
              {expiredSeries.length > 2 ? ` +${expiredSeries.length - 2} more` : ""}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-white">
              {expiringSoon.length} subscription{expiringSoon.length === 1 ? "" : "s"} expiring soon
            </p>
            <p className="mt-0.5 text-xs text-white/55 truncate">
              {soonest.title} expires in {soonest.daysLeft === 0 ? "less than a day" : `${soonest.daysLeft} day${soonest.daysLeft === 1 ? "" : "s"}`}
            </p>
          </>
        )}
      </div>
      <button
        onClick={() => navigate(`/student/tests/${(hasExpired ? expiredSeries[0] : soonest)._id}`)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 ${hasExpired ? "bg-red-500 text-white" : "bg-amber-500 text-dark-400"}`}
      >
        <RefreshCw size={15} /> {hasExpired ? "Renew Now" : "View"}
      </button>
    </div>
  );
}

function ActiveSeriesCard({ topic, onClick, delay = 0 }) {
  const daysLeft = daysUntil(topic.accessExpiresAt);
  const chip =
    daysLeft == null
      ? { label: "Lifetime", cls: "text-emerald-300" }
      : daysLeft <= 7
        ? { label: `${daysLeft}d left`, cls: "text-red-300" }
        : daysLeft <= 30
          ? { label: `${daysLeft}d left`, cls: "text-amber-300" }
          : { label: `${daysLeft}d left`, cls: "text-emerald-300" };
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="group flex animate-fade-up flex-col gap-3 rounded-2xl border border-white/5 bg-dark-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          <Layers size={18} />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold">
          <Clock size={9} className={chip.cls} />
          <span className={chip.cls}>{chip.label}</span>
        </span>
      </div>
      <h3 className="text-base font-bold text-white line-clamp-1">{topic.title}</h3>
      <p className="text-[11px] text-white/40">{formatValidity(topic.validityMonths)}</p>
      <div className="mt-auto inline-flex items-center justify-between rounded-xl bg-brand-primary/10 px-3 py-2 text-xs font-bold text-brand-primary">
        <span>Open Series</span>
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function SeriesCard({ topic, onClick, delay = 0 }) {
  const stats = useMemo(() => {
    const flatTests = Array.isArray(topic.tests) ? topic.tests : [];
    const isAITS = topic.type === "aits" || flatTests.length > 0 && !topic.subjects?.length;

    if (isAITS) {
      const practice = flatTests.filter((test) => test.type !== "pyq").length;
      const pyq = flatTests.filter((test) => test.type === "pyq").length;
      return { subjects: 0, chapters: 0, tests: flatTests.length, practice, pyq, isAITS: true };
    }

    let tests = 0;
    let practice = 0;
    let pyq = 0;
    let chapters = 0;
    const subjects = topic.subjects?.length || 0;
    topic.subjects?.forEach((s) => {
      chapters += s.chapters?.length || 0;
      s.chapters?.forEach((c) => {
        const chapterTests = c.tests || [];
        tests += chapterTests.length;
        practice += chapterTests.filter((test) => test.type !== "pyq").length;
        pyq += chapterTests.filter((test) => test.type === "pyq").length;
      });
    });
    return { subjects, chapters, tests, practice, pyq, isAITS: false };
  }, [topic]);

  const locked = topic.isPaid && !topic.isUnlocked;

  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden text-left animate-fade-up rounded-2xl border border-white/5 bg-dark-200 p-5 transition-colors hover:border-brand-primary/40 hover:bg-dark-100/60 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <Layers size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Series</p>
            <h3 className="text-base font-bold text-white line-clamp-1">{topic.title}</h3>
          </div>
        </div>
        {topic.isPaid ? (
          locked ? (
            topic.discountedPrice > 0 && topic.discountedPrice < topic.price ? (
              <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1.5 inline-flex items-center gap-2">
                <Lock size={9} className="text-amber-400 shrink-0" />
                <span className="text-[12px] font-extrabold text-amber-300 tracking-tight">₹{Number(topic.discountedPrice).toLocaleString()}</span>
                <span className="w-px h-3.5 bg-amber-500/30 shrink-0" />
                <span className="text-[9px] font-medium text-white/30 line-through tracking-tight">₹{Number(topic.price || 0).toLocaleString()}</span>
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 inline-flex items-center gap-1.5">
                <Lock size={9} /> ₹{Number(topic.price || 0).toLocaleString()}
              </span>
            )
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Unlocked
            </span>
          )
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Free
          </span>
        )}
      </div>

      {topic.description && (
        <p className="text-xs text-white/50 line-clamp-2">{topic.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
        <StatMini label="Subjects" value={stats.subjects} />
        <StatMini label="Chapters" value={stats.chapters} />
        <StatMini label={stats.isAITS ? "Tests" : stats.pyq > 0 ? "Practice / PYQ" : "Tests"} value={stats.isAITS ? stats.tests : stats.pyq > 0 ? `${stats.practice} / ${stats.pyq}` : stats.tests} accent />
      </div>

      {!stats.isAITS && stats.pyq > 0 && (
        <div className="text-[11px] text-white/40">
          {stats.practice} practice · {stats.pyq} PYQ
        </div>
      )}

      {stats.isAITS && (
        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
          AITS Section
        </div>
      )}

      <div className="mt-auto inline-flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold bg-brand-primary/10 text-brand-primary">
        <span className="inline-flex items-center gap-1.5">
          {locked ? (
            topic.discountedPrice > 0 && topic.discountedPrice < topic.price ? (
              <>
                Unlock · ₹{Number(topic.discountedPrice).toLocaleString()}
                <span className="text-[9px] opacity-40 line-through font-normal">₹{Number(topic.price || 0).toLocaleString()}</span>
              </>
            ) : (
              <>Unlock for ₹{Number(topic.price || 0).toLocaleString()}</>
            )
          ) : "Open Series"}
        </span>
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function ContinueCard({ attempt, delay = 0 }) {
  return (
    <Link
      to="/student/tests"
      style={{ animationDelay: `${delay}ms` }}
      className="group animate-fade-up flex flex-col gap-3 rounded-2xl border border-white/5 bg-dark-200 p-5 transition-colors hover:border-brand-primary/40 hover:bg-dark-100/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
          <PlayCircle size={20} />
        </div>
        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
          In progress
        </span>
      </div>
      <h3 className="text-base font-bold text-white line-clamp-2">
        {attempt.testId?.title || "Practice Assessment"}
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> {formatDuration(attempt.timeTaken)}
        </span>
        <span>•</span>
        <span>{formatDateLabel(attempt.updatedAt || attempt.createdAt)}</span>
      </div>
      <div className="mt-auto inline-flex items-center justify-between rounded-xl bg-brand-primary/10 px-3 py-2 text-xs font-bold text-brand-primary">
        <span>Continue Test</span>
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function RecentCard({ attempt, delay = 0 }) {
  const score = Number(attempt?.percentage || 0);
  const tier = score >= 70 ? "good" : score >= 40 ? "average" : "poor";
  const tierStyles = {
    good: { color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Passed", icon: <CheckCircle2 size={12} /> },
    average: { color: "text-amber-400", bg: "bg-amber-500/10", label: "Average", icon: <ShieldAlert size={12} /> },
    poor: { color: "text-red-400", bg: "bg-red-500/10", label: "Below par", icon: <ShieldAlert size={12} /> },
  }[tier];

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-fade-up flex flex-col gap-3 rounded-2xl border border-white/5 bg-dark-200 p-5 transition-colors hover:border-brand-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white">
          <FileText size={20} />
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full ${tierStyles.bg} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tierStyles.color}`}>
          {tierStyles.icon}
          {tierStyles.label}
        </span>
      </div>
      <h3 className="text-base font-bold text-white line-clamp-2">
        {attempt.testId?.title || "Practice Assessment"}
      </h3>
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> {formatDuration(attempt.timeTaken)}
        </span>
        <span>•</span>
        <span>{formatDateLabel(attempt.updatedAt || attempt.createdAt)}</span>
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Your Score</p>
          <p className={`mt-1 text-2xl font-bold ${tierStyles.color}`}>{score.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Marks</p>
          <p className="mt-1 text-sm font-bold text-white">
            {attempt.marksObtained || 0}/{attempt.totalMarks || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function DashboardCourseCard({ course, delay = 0 }) {
  const navigate = useNavigate();
  const thumbUrl = course.thumbnail?.url;
  return (
    <button
      onClick={() => navigate("/student/courses")}
      style={{ animationDelay: `${delay}ms` }}
      className="group animate-fade-up flex flex-col rounded-2xl border border-white/5 bg-dark-200 overflow-hidden text-left transition-colors hover:border-brand-primary/40 hover:bg-dark-100/60"
    >
      <div className="relative h-36 shrink-0 bg-white/3 overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt={course.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={32} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-dark-400/60 to-transparent" />
        {course.isPaid ? (
          course.discountedPrice > 0 && course.discountedPrice < course.price ? (
            <div className="absolute top-3 right-3 rounded-lg bg-black/60 border border-amber-500/30 backdrop-blur-md px-2.5 py-1.5 shadow-lg flex flex-col items-end gap-px">
              <span className="text-[9px] font-medium text-white/40 line-through leading-none">₹{Number(course.price).toLocaleString()}</span>
              <span className="text-[12px] font-extrabold text-amber-400 leading-none">₹{Number(course.discountedPrice).toLocaleString()}</span>
            </div>
          ) : (
            <span className="absolute top-3 right-3 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
              ₹{Number(course.price).toLocaleString()}
            </span>
          )
        ) : (
          <span className="absolute top-3 right-3 rounded-full bg-emerald-500/80 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
            FREE
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 gap-3 p-5">
        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-brand-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-white/45 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: course.description }} />
        )}
        <div className="mt-auto inline-flex items-center justify-between rounded-xl bg-brand-primary/10 px-3 py-2 text-xs font-bold text-brand-primary">
          <span className="flex items-center gap-1.5"><Play size={11} /> Start Learning</span>
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function StatMini({ label, value, accent }) {
  return (
    <div>
      <p className={`text-base font-bold ${accent ? "text-brand-primary" : "text-white"}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}

function EmptyState({ title, actionTo, actionLabel = "Browse Catalog" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-dark-200/50 py-12 text-center">
      <div className="mb-3 rounded-full bg-dark-100 p-4 text-gray-500">
        <LayoutDashboard size={24} />
      </div>
      <p className="text-base font-medium text-gray-300">{title}</p>
      {actionTo && (
        <Link to={actionTo} className="mt-4 rounded-lg bg-brand-primary/10 px-5 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------- Utils -------------------------------- */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);
  if (!total) return "0m";
  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return "Recent";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
