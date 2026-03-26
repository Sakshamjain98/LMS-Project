import { useEffect, useState } from "react";
import { getTestResult, getTestLeaderboard } from "../../services/studentService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChevronLeft, CheckCircle, XCircle, MinusCircle, Trophy, Target, Clock } from "lucide-react";

export default function TestResult({ attemptId, onBack }) {
  const [resultData, setResultData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch Result details
        const res = await getTestResult(attemptId);
        setResultData(res.data);
        
        // Fetch Leaderboard for this specific test
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

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-dark-400 text-brand-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent mb-4"></div>
        <p className="text-white font-medium">Crunching your performance numbers...</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-400 p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400 max-w-md">
          <p className="font-bold mb-2">Error loading results</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={onBack} className="bg-dark-100 text-white px-4 py-2 rounded-lg font-semibold hover:bg-dark-200">Go Back</button>
        </div>
      </div>
    );
  }

  const { test, result, detailedResult } = resultData;

  // Chart Data format for Recharts
  const pieData = [
    { name: 'Correct', value: result.correctAnswers, color: '#10B981' }, // Emerald-500
    { name: 'Incorrect', value: result.wrongAnswers, color: '#EF4444' }, // Red-500
    { name: 'Skipped', value: result.skippedQuestions, color: '#6B7280' } // Gray-500
  ];

  return (
    <div className="min-h-screen bg-dark-400 pb-16">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 border-b border-dark-100 bg-dark-300/90 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 md:px-6">
          <button onClick={onBack} className="rounded-lg p-2 text-gray-400 transition hover:bg-dark-200 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Performance Analytics</h1>
            <p className="text-xs text-gray-400">{test.title}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-[1200px] gap-8 px-4 md:px-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Main Stats & Chart */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard icon={<Target className="text-blue-400"/>} label="Score" value={`${result.marksObtained}/${result.totalMarks}`} />
            <MetricCard icon={<CheckCircle className="text-emerald-400"/>} label="Accuracy" value={`${(result.percentage || 0).toFixed(1)}%`} />
            <MetricCard icon={<Trophy className="text-yellow-400"/>} label="Rank" value={`#${result.rank || '--'}`} />
            <MetricCard icon={<Clock className="text-purple-400"/>} label="Time" value={`${Math.round(result.timeTaken / 60)} min`} />
          </div>

          {/* Graphical Analytics */}
          <div className="flex flex-col gap-6 rounded-2xl border border-dark-100 bg-dark-300 p-6 md:flex-row md:items-center">
            <div className="h-48 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#13161F', border: '1px solid #1A1D27', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-4">
              <h3 className="text-lg font-bold text-white mb-2">Question Breakdown</h3>
              <BreakdownRow icon={<CheckCircle size={16} className="text-emerald-500" />} label="Correct Answers" count={result.correctAnswers} color="text-emerald-400" />
              <BreakdownRow icon={<XCircle size={16} className="text-red-500" />} label="Incorrect Answers" count={result.wrongAnswers} color="text-red-400" />
              <BreakdownRow icon={<MinusCircle size={16} className="text-gray-500" />} label="Skipped Questions" count={result.skippedQuestions} color="text-gray-400" />
            </div>
          </div>

          {/* Detailed Solutions (Optional based on detailedResult availability) */}
          {detailedResult && detailedResult.length > 0 && (
            <div className="rounded-2xl border border-dark-100 bg-dark-300 p-6">
              <h3 className="mb-6 text-xl font-bold text-white">Detailed Solutions</h3>
              <div className="space-y-6">
                {detailedResult.map((q, idx) => (
                  <div key={q.questionId} className="border-b border-dark-100 pb-6 last:border-0">
                    <div className="mb-3 flex items-start gap-3">
                      <span className="font-bold text-gray-500">Q{idx + 1}.</span>
                      <p className="font-medium text-white">{q.questionText}</p>
                    </div>
                    <div className="pl-8 text-sm">
                      <p className={`font-semibold ${q.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                        Your Answer: {q.options[q.selectedOptionIndex]?.text || "Skipped"}
                      </p>
                      {!q.isCorrect && (
                        <p className="mt-1 font-semibold text-emerald-400">
                          Correct Answer: {q.options[q.correctOptionIndex]?.text}
                        </p>
                      )}
                      {q.explanation && (
                        <div className="mt-3 rounded-lg bg-dark-200 p-3 text-gray-400">
                          <span className="font-bold text-white">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Leaderboard */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-dark-100 bg-dark-300 p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <Trophy size={20} className="text-yellow-400" /> Leaderboard
              </h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No ranking data available yet.</p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user, idx) => (
                  <div key={idx} className={`flex items-center justify-between rounded-xl p-3 transition ${
                    user.rank === result.rank ? "bg-brand-primary/10 border border-brand-primary/30" : "bg-dark-200"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                        idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        idx === 1 ? "bg-gray-300/20 text-gray-300" :
                        idx === 2 ? "bg-amber-700/20 text-amber-600" : "bg-dark-100 text-gray-500"
                      }`}>
                        {user.rank}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${user.rank === result.rank ? "text-brand-primary" : "text-white"}`}>
                          {user.studentName || "Anonymous"}
                        </p>
                        <p className="text-[10px] text-gray-500">{Math.round(user.timeTaken/60)}m taken</p>
                      </div>
                    </div>
                    <div className="text-right">
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
  );
}

// Sub-components for cleaner code
function MetricCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dark-100 bg-dark-300 p-4 text-center">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}

function BreakdownRow({ icon, label, count, color }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-dark-200 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        {icon} {label}
      </div>
      <span className={`font-bold ${color}`}>{count}</span>
    </div>
  );
}