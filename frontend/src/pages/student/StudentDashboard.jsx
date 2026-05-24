import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getStudentProfile,
  getMyAttempts,
  getAvailableTests,
} from "../../services/studentService";
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
} from "lucide-react";

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

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [profRes, attemptsRes, testsRes] = await Promise.all([
          getStudentProfile().catch(() => ({})),
          getMyAttempts().catch(() => ({ data: [] })),
          getAvailableTests().catch(() => ({ topics: [], categories: [] })),
        ]);
        setProfile(profRes.user || {});
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
        const cats = Array.isArray(testsRes.categories) ? testsRes.categories : [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCategoryId(cats[0]._id);
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
          <header className="flex flex-col gap-2">
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
          </header>

          {/* Top Metrics Row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={<FileText size={22} />} label="Total Attempts" value={attempts.length} />
            <MetricCard icon={<Trophy size={22} />} label="Completed Tests" value={completedTests} />
            <MetricCard icon={<LayoutDashboard size={22} />} label="Ongoing Tests" value={ongoingTests} />
            <MetricCard icon={<LineChart size={22} />} label="Average Score" value={`${averageScore}%`} isPercentage />
          </div>

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

function MetricCard({ icon, label, value, isPercentage }) {
  const isNegative = String(value).includes("-");
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-white/5 bg-dark-200 p-6 shadow-sm transition-colors hover:border-brand-primary/30">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${isPercentage && isNegative ? "text-red-400" : "text-white"}`}>
          {value}
        </p>
      </div>
    </div>
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
            <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
              <Lock size={10} /> ₹{Number(topic.price || 0).toLocaleString()}
            </span>
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
        <span>{locked ? `Unlock for ₹${Number(topic.price || 0).toLocaleString()}` : "Open Series"}</span>
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
