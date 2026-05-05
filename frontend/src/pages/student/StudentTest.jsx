import { useEffect, useMemo, useState } from "react";
import { getMyAttempts, startTest, getAvailableTests } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import TestPlayer from "./TestPlayer";
import TestResult from "./TestResult";
import { 
  ClipboardList, 
  Clock, 
  Play, 
  BarChart2, 
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Users
} from "lucide-react";

export default function StudentTests() {
  const [activeTab, setActiveTab] = useState("take"); // 'take' | 'results'
  const [viewState, setViewState] = useState("dashboard"); // 'dashboard' | 'player' | 'result'
  
  // Data State
  const [attempts, setAttempts] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Active Action State
  const [activeAttemptData, setActiveAttemptData] = useState(null);
  const [activeResultId, setActiveResultId] = useState(null);

  useEffect(() => {
    if (viewState === "dashboard") {
      fetchDashboardData();
    }
  }, [viewState]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [attemptsRes, testsRes] = await Promise.all([
        getMyAttempts().catch(() => ({ data: [] })),
        getAvailableTests().catch(() => ({ topics: [] }))
      ]);
      
      setAttempts(attemptsRes.data || []);
      const topics = testsRes.topics || [];
      setTopics(topics);
      const flattened = flattenSeriesTests(topics);
      setAvailableTests(flattened);
      setSelectedTopicId((prev) => prev || topics[0]?._id || null);
      
    } catch {
      setError("Failed to load test center data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId) => {
    const selectedTest = availableTests.find((test) => test._id === testId);
    if (!selectedTest) {
      setError("Selected test is unavailable.");
      return;
    }

    const now = Date.now();
    if (selectedTest.startTime && new Date(selectedTest.startTime).getTime() > now) {
      setError("This test has not started yet.");
      return;
    }

    if (selectedTest.endTime && new Date(selectedTest.endTime).getTime() < now) {
      setError("This test has ended.");
      return;
    }

    try {
      setLoading(true);
      const res = await startTest(testId);
      setActiveAttemptData(res.data);
      setViewState("player");
    } catch (err) {
      setError(err.message || "Failed to start test. Make sure it is published and active.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (attemptId) => {
    setActiveResultId(attemptId);
    setViewState("result");
  };

  const handleBackToDashboard = () => {
    setViewState("dashboard");
    setActiveAttemptData(null);
    setActiveResultId(null);
  };

  const latestAttemptByTest = attempts.reduce((map, attempt) => {
    const testId = typeof attempt?.testId === "object" ? attempt?.testId?._id : attempt?.testId;
    if (!testId) return map;

    const currentTime = new Date(
      attempt?.submittedAt || attempt?.updatedAt || attempt?.createdAt || 0
    ).getTime();
    const existing = map[testId];
    const existingTime = existing
      ? new Date(existing?.submittedAt || existing?.updatedAt || existing?.createdAt || 0).getTime()
      : -1;

    if (!existing || currentTime >= existingTime) {
      map[testId] = attempt;
    }

    return map;
  }, {});

  // ─── ROUTER LOGIC ──────────────────────────────────────────────────────────
  if (viewState === "player" && activeAttemptData) {
    return (
      <TestPlayer 
        attemptData={activeAttemptData} 
        onFinish={(attemptId) => handleViewResult(attemptId)}
        onExit={handleBackToDashboard} 
      />
    );
  }

  if (viewState === "result" && activeResultId) {
    return (
      <TestResult 
        attemptId={activeResultId} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  // ─── DASHBOARD VIEW ────────────────────────────────────────────────────────
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic._id === selectedTopicId) || topics[0] || null,
    [topics, selectedTopicId]
  );

  const selectedTests = useMemo(
    () => (selectedTopic ? flattenTopicTests(selectedTopic) : availableTests),
    [selectedTopic, availableTests]
  );

  const selectedSummary = useMemo(
    () => getSeriesStats(selectedTopic),
    [selectedTopic]
  );

  const seriesCards = useMemo(
    () => topics.map((topic) => ({ topic, stats: getSeriesStats(topic) })),
    [topics]
  );

  const categorizedSelectedTests = selectedTests.reduce(
    (groups, test) => {
      const lastAttempt = latestAttemptByTest[test._id];
      const hasAttempt = Boolean(lastAttempt);
      const isCompleted = hasAttempt && (
        ["submitted", "evaluated"].includes(lastAttempt?.status) ||
        Boolean(lastAttempt?.autoSubmitted) ||
        Boolean(lastAttempt?.isCompleted)
      );
      const isNotStarted = test.startTime ? new Date(test.startTime).getTime() > Date.now() : false;
      const isExpired = test.endTime ? new Date(test.endTime).getTime() < Date.now() : false;

      const withMeta = {
        ...test,
        latestAttemptId: lastAttempt?._id || null,
        testState: isCompleted
          ? "completed"
          : isNotStarted
            ? "not-started"
            : isExpired
              ? "ended-not-completed"
              : "not-attempted",
      };

      if (withMeta.testState === "completed") {
        groups.completed.push(withMeta);
      } else if (withMeta.testState === "ended-not-completed") {
        groups.endedNotCompleted.push(withMeta);
      } else {
        groups.notAttempted.push(withMeta);
      }

      return groups;
    },
    { notAttempted: [], completed: [], endedNotCompleted: [] }
  );

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-16" style={{ fontFamily: '"Space Grotesk", "DM Sans", sans-serif' }}>
        {/* HERO */}
        <div className="relative overflow-hidden border-b border-dark-100 bg-dark-300">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-primary/20 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-brand-primary/10 blur-3xl"></div>
          <div className="mx-auto max-w-350 px-4 py-8 md:px-6 md:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/60">
              <Sparkles size={12} className="text-brand-primary" />
              Mobile-first test series
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Test Series Hub</h1>
            <p className="mt-2 text-sm text-gray-400 md:text-base">
              Explore live and practice tests, grouped by topic and chapter for quick mobile access.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatPill label="Total Tests" value={availableTests.length} />
              <StatPill label="Free Tests" value={availableTests.filter((t) => !t.isPaid).length} />
              <StatPill label="Live Now" value={availableTests.filter((t) => isLiveTest(t)).length} />
              <StatPill label="Series" value={topics.length} />
            </div>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mx-auto mt-6 max-w-350 px-4 md:px-6">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
              <AlertCircle size={18} /> {error}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-350 px-4 py-8 md:px-6">
          {/* TABS */}
          <div className="mb-8 flex gap-3 rounded-2xl border border-dark-100 bg-dark-200/60 p-2">
            <button
              onClick={() => setActiveTab("take")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "take"
                  ? "btn-gradient"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Play size={16} /> Take a Test
              </span>
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                activeTab === "results"
                  ? "btn-gradient"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <BarChart2 size={16} /> Results
              </span>
            </button>
          </div>

          {/* TAB CONTENT */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* TAB 1: TAKE TEST */}
              {activeTab === "take" && (
                <div className="space-y-10">
                  {seriesCards.length > 0 && (
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Browse Test Series</h2>
                        <span className="text-xs font-semibold text-white/40">
                          {seriesCards.length} series
                        </span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {seriesCards.map(({ topic, stats }) => (
                          <button
                            key={topic._id}
                            onClick={() => setSelectedTopicId(topic._id)}
                            className={`min-w-60 snap-start rounded-2xl border p-4 text-left transition-all ${
                              selectedTopicId === topic._id
                                ? "border-brand-primary/50 bg-brand-primary/10"
                                : "border-dark-100 bg-dark-200/60 hover:border-brand-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-widest text-white/40">Series</p>
                                <h3 className="mt-1 text-base font-bold text-white line-clamp-2">
                                  {topic.title}
                                </h3>
                              </div>
                              {topic.isPaid ? (
                                <div className="flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                  ₹{Number(topic.price || 0).toLocaleString()}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                  Free
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                              <span className="font-semibold text-white">{stats.total}</span> Tests
                              <span>•</span>
                              <span className="font-semibold text-white">{stats.subjects}</span> Subjects
                              <span>•</span>
                              <span className="font-semibold text-white">{stats.chapters}</span> Chapters
                            </div>
                            <ul className="mt-3 space-y-1 text-xs text-white/40">
                              <li>• {stats.live} Live now</li>
                              {topic.isPaid && (
                                <li className="text-amber-300/80">• Premium series — one-time access</li>
                              )}
                            </ul>
                            <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              topic.isPaid
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-brand-primary/15 text-brand-primary"
                            }`}>
                              {topic.isPaid ? `Unlock for ₹${Number(topic.price || 0).toLocaleString()}` : "View Test Series"}
                              <ArrowRight size={12} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  {!selectedTopic && availableTests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/50 py-16 text-center">
                      <FileText className="mx-auto mb-4 text-gray-600 opacity-50" size={48} />
                      <p className="mb-2 text-lg font-medium text-white">No active tests available</p>
                      <p className="text-sm text-gray-500">Check back later when new tests are published.</p>
                    </div>
                  ) : (
                    <section className="space-y-6">
                      <div className="rounded-2xl border border-dark-100 bg-dark-200/60 p-5">
                        <h2 className="text-lg font-bold text-white">
                          {selectedTopic?.title || "All Tests"}
                        </h2>
                        <p className="text-xs text-white/50 mt-1">
                          {selectedTopic?.description || "Pick a test and start practicing instantly."}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <MiniStat label="Total Tests" value={selectedSummary.total} />
                          <MiniStat label="Free Tests" value={selectedSummary.free} />
                          <MiniStat label="Live Tests" value={selectedSummary.live} />
                          <MiniStat label="Chapters" value={selectedSummary.chapters} />
                        </div>
                      </div>

                      <TestList
                        title="Start a Test"
                        tests={categorizedSelectedTests.notAttempted}
                        emptyText="No tests available right now"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />

                      <TestList
                        title="Completed Tests"
                        tests={categorizedSelectedTests.completed}
                        emptyText="No completed tests yet"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />

                      <TestList
                        title="Ended Tests"
                        tests={categorizedSelectedTests.endedNotCompleted}
                        emptyText="No ended tests"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />
                    </section>
                  )}

                  <section className="rounded-2xl border border-dark-100 bg-dark-300/40 p-6">
                    <h3 className="text-lg font-bold text-white">Why take this Test Series?</h3>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FeatureCard title="All India Rank" body="Compete with thousands of learners and track your rank." />
                      <FeatureCard title="Personal Insights" body="Identify weak areas with chapter-wise analytics." />
                      <FeatureCard title="Pro Quality" body="Updated tests following the latest exam pattern." />
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 2: RESULTS */}
              {activeTab === "results" && (
                <div>
                  {attempts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/50 py-16 text-center">
                      <ClipboardList className="mx-auto mb-4 text-gray-600 opacity-50" size={48} />
                      <p className="mb-2 text-lg font-medium text-white">No test history found</p>
                      <p className="text-sm text-gray-500">Complete a test to view your performance analytics here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attempts.map((attempt) => (
                        <div key={attempt._id} className="flex flex-col gap-5 rounded-2xl border border-dark-100 bg-dark-200 p-5 transition-colors hover:border-brand-primary/30 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <p className="text-base font-bold text-white">
                              {attempt.testId?.title || `Test Attempt #${attempt._id.slice(0, 6)}`}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Submitted: {new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                            <div className="h-10 w-px bg-dark-100 hidden sm:block"></div>
                            <button
                              onClick={() => handleViewResult(attempt._id)}
                              className="shrink-0 rounded-xl bg-dark-100 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-dark-300 hover:text-brand-primary"
                            >
                              View Analytics
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const flattenSeriesTests = (topics) => {
  const tests = [];
  topics.forEach((topic) => {
    topic.subjects?.forEach((subject) => {
      subject.chapters?.forEach((chapter) => {
        chapter.tests?.forEach((test) => {
          tests.push({
            ...test,
            topicTitle: topic.title,
            topicIsPaid: Boolean(topic.isPaid),
            topicPrice: Number(topic.price) || 0,
            subjectTitle: subject.title,
            chapterTitle: chapter.title,
          });
        });
      });
    });
  });
  return tests;
};

const flattenTopicTests = (topic) => {
  if (!topic) return [];
  return flattenSeriesTests([topic]);
};

const isLiveTest = (test) => {
  const now = Date.now();
  const startOk = !test.startTime || new Date(test.startTime).getTime() <= now;
  const endOk = !test.endTime || new Date(test.endTime).getTime() >= now;
  return startOk && endOk;
};

const getSeriesStats = (topic) => {
  if (!topic) {
    return { total: 0, free: 0, live: 0, subjects: 0, chapters: 0 };
  }
  let total = 0;
  let live = 0;
  let chapters = 0;
  const subjects = topic.subjects?.length || 0;

  // Topic-level pricing — every test in a free topic is free for the student.
  const free = topic.isPaid ? 0 : 1;

  topic.subjects?.forEach((subject) => {
    chapters += subject.chapters?.length || 0;
    subject.chapters?.forEach((chapter) => {
      chapter.tests?.forEach((test) => {
        total += 1;
        if (isLiveTest(test)) live += 1;
      });
    });
  });

  return { total, free, live, subjects, chapters };
};

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-dark-300/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="rounded-2xl border border-dark-100 bg-dark-200/60 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs text-white/50">{body}</p>
    </div>
  );
}

function TestList({ title, tests, emptyText, onStartTest, onViewResult }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <span className="text-xs font-semibold text-white/40">{tests.length}</span>
      </div>
      {tests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-8 text-center">
          <p className="text-xs text-gray-500">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <TestRow
              key={test._id}
              test={test}
              onStartTest={onStartTest}
              onViewResult={onViewResult}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TestRow({ test, onStartTest, onViewResult }) {
  const isCompleted = test.testState === "completed";
  const isEndedNotCompleted = test.testState === "ended-not-completed";
  const isNotStarted = test.testState === "not-started";

  return (
    <div className="rounded-2xl border border-dark-100 bg-dark-200 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isLiveTest(test) && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Live Test
              </span>
            )}
            {test.topicIsPaid ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Premium · ₹{Number(test.topicPrice || 0).toLocaleString()}
              </span>
            ) : (
              <span className="rounded-full bg-brand-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                Free
              </span>
            )}
          </div>
          <h4 className="mt-2 text-base font-semibold text-white">{test.title}</h4>
          <p className="mt-1 text-xs text-white/50 line-clamp-1">
            {test.topicTitle || "Topic"} / {test.subjectTitle || "Subject"} / {test.chapterTitle || "Chapter"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/40">
            <span className="inline-flex items-center gap-2">
              <ClipboardList size={12} className="text-brand-primary/70" />
              {test.questions?.length || 0} Questions
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock size={12} className="text-brand-primary/70" />
              {test.duration || 0} mins
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:min-w-35">
          {isCompleted ? (
            <button
              onClick={() => onViewResult(test.latestAttemptId)}
              disabled={!test.latestAttemptId}
              className="w-full rounded-xl bg-blue-500/10 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500 hover:text-white disabled:opacity-50"
            >
              View Result
            </button>
          ) : isEndedNotCompleted ? (
            <button
              disabled
              className="w-full rounded-xl bg-dark-300 py-2.5 text-xs font-bold text-gray-500"
            >
              Test Over
            </button>
          ) : isNotStarted ? (
            <button
              disabled
              className="w-full rounded-xl bg-dark-300 py-2.5 text-xs font-bold text-gray-500"
            >
              Starts Soon
            </button>
          ) : (
            <button
              onClick={() => onStartTest(test._id)}
              className="w-full rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-dark-400 hover:brightness-110"
            >
              Start Now
            </button>
          )}
          {test.endTime && (
            <p className="text-[10px] text-white/40 text-center">
              Ends {new Date(test.endTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}