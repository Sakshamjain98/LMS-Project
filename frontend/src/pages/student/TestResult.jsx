import { useEffect, useState } from "react";
import { getTestResult, getTestLeaderboard } from "../../services/studentService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Trophy,
  Target,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  BarChart2,
  BookOpen,
  Minus,
} from "lucide-react";
import { formatDuration } from "../../utils/formatDuration";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestResult({ attemptId, onBack }) {
  const [resultData, setResultData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await getTestResult(attemptId);
        setResultData(res.data);
        if (res.data?.test?._id) {
          const lbRes = await getTestLeaderboard(res.data.test._id);
          setLeaderboard(lbRes.data?.leaderboard || []);
        }
      } catch (err) {
        setError(err.message || "Failed to load result analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [attemptId]);

  useEffect(() => { setCurrentPage(1); }, [attemptId]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-dark-400 text-brand-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent mb-4" />
        <p className="text-white font-medium">Crunching your performance numbers…</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-400 p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 max-w-md">
          <AlertCircle className="mx-auto mb-3" size={32} />
          <p className="font-bold mb-2">Error loading results</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={onBack} className="bg-dark-100 text-white px-4 py-2 rounded-lg font-semibold hover:bg-dark-200">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { test, result, detailedResult } = resultData;
  const totalPages = detailedResult?.length ? Math.ceil(detailedResult.length / pageSize) : 1;
  const paginatedDetailedResult = detailedResult?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];

  // Derived analytics
  const unattempted = (result.totalQuestions || 0) - (result.attemptedQuestions || 0);
  const accuracy = result.attemptedQuestions > 0
    ? ((result.correctAnswers / result.attemptedQuestions) * 100).toFixed(1)
    : "0.0";

  const pieData = [
    { name: "Correct", value: result.correctAnswers || 0, color: "#10B981" },
    { name: "Incorrect", value: result.wrongAnswers || 0, color: "#EF4444" },
    { name: "Skipped", value: unattempted, color: "#6B7280" },
  ];

  return (
    <div className="min-h-screen bg-dark-400 pb-16">

      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-dark-100 bg-dark-300/90 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-6">
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-dark-200 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Performance Analytics</h1>
            <p className="text-xs text-gray-400">{test.title}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6">

        {/* ── Top KPI Cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 mb-8">
          <MetricCard
            icon={<Target className="text-brand-primary" size={18} />}
            label="Score"
            value={`${result.marksObtained ?? 0}/${result.totalMarks ?? 0}`}
            sub="marks"
            accent="blue"
          />
          <MetricCard
            icon={<CheckCircle className="text-emerald-400" size={18} />}
            label="Correct"
            value={result.correctAnswers ?? 0}
            sub="questions"
            accent="emerald"
          />
          <MetricCard
            icon={<XCircle className="text-red-400" size={18} />}
            label="Wrong"
            value={result.wrongAnswers ?? 0}
            sub="questions"
            accent="red"
          />
          <MetricCard
            icon={<Minus className="text-gray-400" size={18} />}
            label="Skipped"
            value={unattempted}
            sub="questions"
            accent="gray"
          />
          <MetricCard
            icon={<TrendingUp className="text-purple-400" size={18} />}
            label="Accuracy"
            value={`${accuracy}%`}
            sub="of attempted"
            accent="purple"
          />
          <MetricCard
            icon={<Clock className="text-amber-400" size={18} />}
            label="Time Taken"
            value={formatDuration(result.timeTaken)}
            sub=""
            accent="amber"
            compact
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── LEFT: Chart + Details ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Graphical Analytics */}
            <div className="flex flex-col gap-6 rounded-2xl border border-dark-100 bg-dark-300 p-6 md:flex-row md:items-center">
              <div className="h-52 w-full md:w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={56} outerRadius={76} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#13161F",
                        border: "1px solid #1A1D27",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <h3 className="text-base font-bold text-white">Question Breakdown</h3>
                <BreakdownRow
                  icon={<CheckCircle size={15} className="text-emerald-500" />}
                  label="Correct Answers"
                  count={result.correctAnswers ?? 0}
                  total={result.totalQuestions ?? 0}
                  color="text-emerald-400"
                  barColor="bg-emerald-500"
                />
                <BreakdownRow
                  icon={<XCircle size={15} className="text-red-500" />}
                  label="Wrong Answers"
                  count={result.wrongAnswers ?? 0}
                  total={result.totalQuestions ?? 0}
                  color="text-red-400"
                  barColor="bg-red-500"
                />
                <BreakdownRow
                  icon={<MinusCircle size={15} className="text-gray-500" />}
                  label="Not Attempted"
                  count={unattempted}
                  total={result.totalQuestions ?? 0}
                  color="text-gray-400"
                  barColor="bg-gray-600"
                />

                {/* Additional analytics */}
                <div className="mt-2 grid grid-cols-2 gap-2 pt-3 border-t border-dark-100">
                  <div className="rounded-lg bg-dark-200 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rank</p>
                    <p className="text-lg font-bold text-yellow-400 mt-0.5">
                      #{result.rank ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-dark-200 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Overall %</p>
                    <p className="text-lg font-bold text-white mt-0.5">
                      {(result.percentage ?? 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Solutions */}
            {detailedResult && detailedResult.length > 0 && (
              <div className="rounded-2xl border border-dark-100 bg-dark-300 p-6">
                <h3 className="mb-6 text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-primary" /> Detailed Solutions
                </h3>
                <div className="space-y-6">
                  {paginatedDetailedResult.map((q, idx) => {
                    const absoluteIndex = (currentPage - 1) * pageSize + idx;
                    const isSkipped = q.selectedOptionIndex === null || q.selectedOptionIndex === undefined;
                    const statusColor = isSkipped ? "text-gray-400" : q.isCorrect ? "text-emerald-400" : "text-red-400";
                    const statusBg = isSkipped ? "bg-gray-500/10 border-gray-500/20" : q.isCorrect ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20";

                    return (
                      <div key={q.questionId} className={`border rounded-xl p-4 ${statusBg}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-xs font-bold text-gray-400">
                            Q{absoluteIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white text-sm leading-relaxed quill-content" dangerouslySetInnerHTML={{ __html: q.questionText || "" }} />
                            {q.imageUrl && (
                              <img
                                src={q.imageUrl}
                                alt={`Question ${absoluteIndex + 1}`}
                                className="mt-3 max-h-60 rounded-xl border border-dark-100 object-contain"
                              />
                            )}
                          </div>
                        </div>
                        <div className="pl-8 space-y-1.5 text-sm">
                          <p className={`font-semibold ${statusColor}`}>
                            Your Answer:{" "}
                            {isSkipped
                              ? "Not Attempted"
                              : q.options[q.selectedOptionIndex]?.text || "Not Attempted"}
                          </p>
                          {(isSkipped || !q.isCorrect) && (
                            <p className="font-semibold text-emerald-400">
                              Correct Answer: {q.options[q.correctOptionIndex]?.text}
                            </p>
                          )}
                          {q.explanation && (
                            <div className="mt-2 rounded-lg bg-dark-200 p-3 text-gray-400 text-xs">
                              <span className="font-bold text-white">Explanation:</span>
                              <div className="mt-2 quill-content" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-dark-100 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg bg-dark-200 px-4 py-2 text-sm font-semibold text-white hover:bg-dark-100 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <p className="text-sm text-gray-400">Page {currentPage} of {totalPages}</p>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg bg-dark-200 px-4 py-2 text-sm font-semibold text-white hover:bg-dark-100 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Leaderboard ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-dark-100 bg-dark-300 p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                  <Trophy size={18} className="text-yellow-400" /> Leaderboard
                </h3>
                {result.rank && (
                  <span className="rounded-full bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 text-[11px] font-bold text-brand-primary">
                    Your rank: #{result.rank}
                  </span>
                )}
              </div>

              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No ranking data yet.</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((user, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-xl p-3 transition ${
                        user.rank === result.rank
                          ? "bg-brand-primary/10 border border-brand-primary/30"
                          : "bg-dark-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm ${
                            idx === 0
                              ? "bg-yellow-500/20 text-yellow-400"
                              : idx === 1
                              ? "bg-gray-300/20 text-gray-300"
                              : idx === 2
                              ? "bg-amber-700/20 text-amber-600"
                              : "bg-dark-100 text-gray-500"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${user.rank === result.rank ? "text-brand-primary" : "text-white"}`}>
                            {user.studentName || "Anonymous"}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {formatDuration(user.timeTaken)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{user.marksObtained}</p>
                        <p className="text-[10px] text-gray-500">Marks</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, accent, compact }) {
  const accents = {
    blue: "border-brand-primary/20 bg-brand-primary/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5",
    red: "border-red-500/20 bg-red-500/5",
    gray: "border-gray-500/20 bg-gray-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    amber: "border-amber-500/20 bg-amber-500/5",
  };
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center col-span-1 ${accents[accent] || "border-dark-100 bg-dark-300"}`}>
      <div className="mb-1.5">{icon}</div>
      <p className={`font-bold text-white ${compact ? "text-sm" : "text-xl"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      {sub && <p className="text-[9px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function BreakdownRow({ icon, label, count, total, color, barColor }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between rounded-lg bg-dark-200 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          {icon} {label}
        </div>
        <span className={`font-bold text-sm ${color}`}>{count}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-dark-100 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
