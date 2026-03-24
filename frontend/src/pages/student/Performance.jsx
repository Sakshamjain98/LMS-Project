import { useEffect, useState } from "react";
import { getPerformance } from "../../services/studentService";
import { FaChartBar, FaTrophy, FaFire, FaBullseye } from "react-icons/fa";

export default function StudentPerformance() {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        const res = await getPerformance();
        setPerformanceData(res);
      } catch (err) {
        setError(err.message || "Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-grayCustom-medium">Loading performance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Performance Analytics</h1>
        <p className="text-grayCustom-medium">Track your progress and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-grayCustom-medium text-sm">Average Score</span>
            <FaChartBar className="text-brand-primary" />
          </div>
          <p className="text-3xl font-bold text-white">{performanceData?.avgScore || 0}%</p>
          <p className="text-xs text-grayCustom-medium mt-1">Overall performance</p>
        </div>

        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-grayCustom-medium text-sm">Tests Taken</span>
            <FaBullseye className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{performanceData?.totalTests || 0}</p>
          <p className="text-xs text-grayCustom-medium mt-1">Total attempts</p>
        </div>

        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-grayCustom-medium text-sm">Completed</span>
            <FaFire className="text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-white">{performanceData?.completedTests || 0}</p>
          <p className="text-xs text-grayCustom-medium mt-1">Evaluated tests</p>
        </div>

        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-grayCustom-medium text-sm">Accuracy</span>
            <FaTrophy className="text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{performanceData?.avgScore || 0}%</p>
          <p className="text-xs text-grayCustom-medium mt-1">Correct answers ratio</p>
        </div>
      </div>

      {/* Subject Performance */}
      {performanceData?.subjectPerformance && Object.keys(performanceData.subjectPerformance).length > 0 && (
        <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Subject Performance</h2>
          <div className="space-y-4">
            {Object.entries(performanceData.subjectPerformance).map(([subject, data]) => (
              <div key={subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{subject}</span>
                  <span className="text-brand-primary font-bold">{data.percentage}%</span>
                </div>
                <div className="w-full bg-dark-300 rounded-full h-2">
                  <div
                    className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Placeholder */}
      <div className="bg-dark-200 border border-dark-100 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Score Trend</h2>
        <div className="h-64 flex items-center justify-center bg-dark-300 rounded-lg text-grayCustom-medium">
          <p>Score progression chart (Coming Soon)</p>
        </div>
      </div>
    </div>
  );
}
