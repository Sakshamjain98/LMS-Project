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
      
    } catch (err) {
      setError("Failed to load test center data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId) => {
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
          <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6 md:py-10">
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">Test Center</h1>
            <p className="text-sm text-gray-400 md:text-base">Practice, improve, and track your performance with detailed analytics.</p>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mx-auto mt-6 max-w-[1400px] px-4 md:px-6">
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
              <AlertCircle size={18} /> {error}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-6">
          
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
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {availableTests.map((test) => {
                        
                        // 1. Check if test is already completed by the user
                        const isCompleted = attempts.some(a => 
                          (a.testId?._id === test._id || a.testId === test._id) && 
                          ['submitted', 'evaluated'].includes(a.status)
                        );
                        
                        // 2. Check if the test time has expired
                        const isExpired = test.endTime ? new Date(test.endTime) < new Date() : false;

                        return (
                          <div key={test._id} className="group flex flex-col rounded-2xl border border-dark-100 bg-dark-200 p-5 transition-all hover:-translate-y-1 hover:border-brand-primary/50 hover:shadow-[0_8px_30px_rgba(0,220,130,0.1)]">
                            
                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <h3 className="line-clamp-2 min-h-[48px] text-lg font-bold text-white transition-colors group-hover:text-brand-primary">
                                  {test.title}
                                </h3>
                                <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                  {test.description || "Standard assessment format"}
                                </p>
                              </div>
                              
                              {/* TOP BADGE */}
                              {isCompleted ? (
                                <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                  Completed
                                </span>
                              ) : isExpired ? (
                                <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                                  Ended
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                  {test.status === "published" ? "Live" : test.status || "Active"}
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

                            {/* EXPIRY TIME DIV */}
                            {test.endTime && (
                              <div className="mb-4 flex items-center gap-2 rounded-xl bg-dark-300/50 px-3 py-2 text-xs font-medium text-gray-400 border border-dark-100">
                                <Clock size={14} className="text-gray-500" />
                                Closes: {new Date(test.endTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}

                            {/* ACTION BUTTON */}
                            {isCompleted ? (
                              <button disabled className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-dark-300 py-3 text-sm font-bold text-gray-500">
                                <CheckCircle size={16} /> Completed
                              </button>
                            ) : isExpired ? (
                              <button disabled className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-dark-300 py-3 text-sm font-bold text-gray-500">
                                <XCircle size={16} /> Expired
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartTest(test._id)}
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