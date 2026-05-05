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
} from "lucide-react";
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  getMyAttempts,
  getAvailableTests,
} from "../../services/studentService";
import TestResult from "./TestResult";

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

export default function StudentTests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("series"); // 'series' | 'results'

  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeResultId, setActiveResultId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      getAvailableTests().catch(() => ({ topics: [] })),
      getMyAttempts().catch(() => ({ data: [] })),
    ])
      .then(([testsRes, attemptsRes]) => {
        if (!active) return;
        setTopics(testsRes.topics || []);
        setAttempts(attemptsRes.data || []);
      })
      .catch(() => { if (active) setError("Failed to load test center data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const seriesCards = useMemo(
    () => topics.map((topic) => ({ topic, stats: getSeriesStats(topic) })),
    [topics]
  );

  const totalTests = useMemo(
    () => seriesCards.reduce((sum, s) => sum + s.stats.total, 0),
    [seriesCards]
  );
  const totalLive = useMemo(
    () => seriesCards.reduce((sum, s) => sum + s.stats.live, 0),
    [seriesCards]
  );
  const freeSeriesCount = useMemo(
    () => topics.filter((t) => !t.isPaid).length,
    [topics]
  );

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
              Choose a series to see its full chapter outline and start practising.
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
          {/* Tabs */}
          <div className="mb-8 flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
            <TabBtn icon={ClipboardList} active={activeTab === "series"}  onClick={() => setActiveTab("series")}>Browse Series</TabBtn>
            <TabBtn icon={BarChart2}     active={activeTab === "results"} onClick={() => setActiveTab("results")}>My Results</TabBtn>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-brand-primary mr-2" /> Loading…
            </div>
          ) : activeTab === "series" ? (
            seriesCards.length === 0 ? (
              <EmptyState
                icon={<FileText className="mx-auto mb-4 text-white/20" size={48} />}
                title="No test series available"
                body="Check back later — new series go live often."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {seriesCards.map(({ topic, stats }, idx) => (
                  <SeriesCard
                    key={topic._id}
                    topic={topic}
                    stats={stats}
                    delay={idx * 60}
                    onClick={() => navigate(`/student/tests/${topic._id}`)}
                  />
                ))}
              </div>
            )
          ) : attempts.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="mx-auto mb-4 text-white/20" size={48} />}
              title="No test history yet"
              body="Take a test from any series to see your performance here."
            />
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <AttemptRow key={attempt._id} attempt={attempt} onViewResult={setActiveResultId} />
              ))}
            </div>
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

function SeriesCard({ topic, stats, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden text-left animate-fade-up rounded-2xl glass-card glass-card-hover p-5 flex flex-col gap-3 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Series</p>
          <h3 className="mt-1 text-base font-bold text-white line-clamp-2 break-words">{topic.title}</h3>
        </div>
        {topic.isPaid ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1">
            <Lock size={10} /> ₹{Number(topic.price || 0).toLocaleString()}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Free
          </span>
        )}
      </div>

      {topic.description && (
        <p className="text-xs text-white/50 line-clamp-2 break-words">{topic.description}</p>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
        <StatMini label="Tests" value={stats.total} />
        <StatMini label="Subjects" value={stats.subjects} />
        <StatMini label="Live" value={stats.live} accent />
      </div>

      <div className={`mt-1 inline-flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
        topic.isPaid ? "bg-amber-500/10 text-amber-300" : "bg-brand-primary/10 text-brand-primary"
      }`}>
        <span>{topic.isPaid ? `Unlock for ₹${Number(topic.price || 0).toLocaleString()}` : "View Series"}</span>
        <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
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

function EmptyState({ icon, title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
      {icon}
      <p className="mb-2 text-lg font-medium text-white">{title}</p>
      <p className="text-sm text-gray-500">{body}</p>
    </div>
  );
}

function AttemptRow({ attempt, onViewResult }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-dark-200 p-5 transition-colors hover:border-brand-primary/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-white break-words">
          {attempt.testId?.title || `Test Attempt #${attempt._id.slice(0, 6)}`}
        </p>
        <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1.5">
          <Clock size={11} />
          {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6 sm:justify-end">
        <div className="text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Score</p>
          <p className="text-lg font-bold text-white">{attempt.marksObtained || 0}/{attempt.totalMarks || 0}</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Accuracy</p>
          <p className="text-lg font-bold text-brand-primary">{(attempt.percentage || 0).toFixed(1)}%</p>
        </div>
        <button
          onClick={() => onViewResult(attempt._id)}
          className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10 hover:text-brand-primary"
        >
          View Analytics
        </button>
      </div>
    </div>
  );
}
