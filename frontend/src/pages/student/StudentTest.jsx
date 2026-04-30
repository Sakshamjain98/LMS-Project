import { useEffect, useState } from "react";
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
  CheckCircle,
  XCircle
} from "lucide-react";

export default function StudentTests() {
  const [activeTab, setActiveTab] = useState("take"); // 'take' | 'results'
  const [viewState, setViewState] = useState("dashboard"); // 'dashboard' | 'player' | 'result'
  
  // Data State
  const [attempts, setAttempts] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
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
        getAvailableTests().catch(() => ({ tests: [] }))
      ]);
      
      setAttempts(attemptsRes.data || []);
      setAvailableTests(testsRes.tests || []);
      
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

  const categorizedTests = availableTests.reduce(
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
  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-12">
        
        {/* HEADER */}
        <div className="border-b border-dark-100 bg-dark-300">
          <div className="mx-auto max-w-350 px-4 py-8 md:px-6 md:py-10">
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Test Center</h1>
            <p className="text-sm text-gray-400 md:text-base">Practice, improve, and track your performance with detailed analytics.</p>
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
          <div className="mb-8 flex gap-4 border-b border-dark-100 pb-px">
            <button
              onClick={() => setActiveTab("take")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "take"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Play size={16} /> Take a Test
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "results"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <BarChart2 size={16} /> Results & Analytics
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
                <div>
                  {availableTests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/50 py-16 text-center">
                      <FileText className="mx-auto mb-4 text-gray-600 opacity-50" size={48} />
                      <p className="mb-2 text-lg font-medium text-white">No active tests available</p>
                      <p className="text-sm text-gray-500">Check back later when new tests are published.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <TestSection
                        title="Not Attempted Tests"
                        tests={categorizedTests.notAttempted}
                        emptyText="No not-attempted tests available"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />

                      <TestSection
                        title="Completed Tests"
                        tests={categorizedTests.completed}
                        emptyText="No completed tests yet"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />

                      <TestSection
                        title="Ended but Not Completed"
                        tests={categorizedTests.endedNotCompleted}
                        emptyText="No ended incomplete tests"
                        onStartTest={handleStartTest}
                        onViewResult={handleViewResult}
                      />
                    </div>
                  )}
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

function TestSection({ title, tests, emptyText, onStartTest, onViewResult }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>

      {tests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark-100 bg-dark-200/40 py-10 text-center">
          <p className="text-sm text-gray-500">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tests.map((test) => {
            const isCompleted = test.testState === "completed";
            const isEndedNotCompleted = test.testState === "ended-not-completed";
            const isNotStarted = test.testState === "not-started";

            return (
              <div key={test._id} className="group flex flex-col rounded-2xl border border-dark-100 bg-dark-200 p-5 transition-all hover:-translate-y-1 hover:border-brand-primary/50 hover:shadow-[0_8px_30px_rgba(0,220,130,0.1)]">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="line-clamp-2 min-h-12 text-lg font-bold text-white transition-colors group-hover:text-brand-primary">
                      {test.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {test.description || "Standard assessment format"}
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                      Completed
                    </span>
                  ) : isEndedNotCompleted ? (
                    <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                      Ended
                    </span>
                  ) : isNotStarted ? (
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Not Started
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Live
                    </span>
                  )}
                </div>

                <div className="mb-4 space-y-3 border-b border-dark-100 pb-5 pt-2 text-xs font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-brand-primary/70" />
                    {test.duration || 0} minutes
                  </div>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-brand-primary/70" />
                    {test.questions?.length || 0} Questions • {test.totalMarks || 0} Marks
                  </div>
                </div>

                {test.endTime && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-dark-300/50 px-3 py-2 text-xs font-medium text-gray-400 border border-dark-100">
                    <Clock size={14} className="text-gray-500" />
                    Closes: {new Date(test.endTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}

                {isCompleted ? (
                  <button
                    onClick={() => onViewResult(test.latestAttemptId)}
                    disabled={!test.latestAttemptId}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 py-3 text-sm font-bold text-blue-400 transition-colors hover:bg-blue-500 hover:text-white disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> View Analytics
                  </button>
                ) : isEndedNotCompleted ? (
                  <button disabled className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-dark-300 py-3 text-sm font-bold text-gray-500">
                    <XCircle size={16} /> Ended
                  </button>
                ) : isNotStarted ? (
                  <button disabled className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-dark-300 py-3 text-sm font-bold text-gray-500">
                    <Clock size={16} /> Not Started
                  </button>
                ) : (
                  <button
                    onClick={() => onStartTest(test._id)}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary/10 py-3 text-sm font-bold text-brand-primary transition-colors hover:bg-brand-primary hover:text-dark-400"
                  >
                    <Play size={16} /> Start Test
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}