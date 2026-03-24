import { useEffect, useState } from "react";
import { getMyAttempts } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { FaClipboardList, FaClock, FaTrophy, FaPlay, FaCheckCircle } from "react-icons/fa";

export default function StudentTests() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const res = await getMyAttempts();
        setAttempts(res.attempts || []);
      } catch (err) {
        setError(err.message || "Failed to load attempts");
      } finally {
        setLoading(false);
      }
    };
    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-96">
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </>
    );
  }

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* ─── HEADER ──────────────────────────────────────– */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Test Center</h1>
            <p className="text-sm text-gray-400">Practice, improve, and track your performance</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          {/* ─── AVAILABLE TESTS ─────────────────────────────── */}
          <div>
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <FaPlay className="text-brand-primary" size={16} />
              Available Tests
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Test 1 */}
              <div className="bg-dark-200 border border-dark-100 rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition">GPAT Full Length Test</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete exam simulation</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full shrink-0">Live</span>
                </div>

                <div className="space-y-2 mb-5 pb-5 border-b border-dark-100 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaClock size={14} className="text-brand-primary" />
                    <span>Duration: 3 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClipboardList size={14} className="text-brand-primary" />
                    <span>200 questions • 200 marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTrophy size={14} className="text-brand-primary" />
                    <span>5,234 students attempted</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                  <FaPlay size={14} />
                  Start Test
                </button>
              </div>

              {/* Test 2 */}
              <div className="bg-dark-200 border border-dark-100 rounded-lg p-6 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-primary transition">NIPER JEE Mock Test</h3>
                    <p className="text-sm text-gray-500 mt-1">Advanced level assessment</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full shrink-0">Live</span>
                </div>

                <div className="space-y-2 mb-5 pb-5 border-b border-dark-100 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaClock size={14} className="text-brand-primary" />
                    <span>Duration: 2.5 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClipboardList size={14} className="text-brand-primary" />
                    <span>150 questions • 300 marks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTrophy size={14} className="text-brand-primary" />
                    <span>2,890 students attempted</span>
                  </div>
                </div>

                <button className="w-full py-3 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                  <FaPlay size={14} />
                  Start Test
                </button>
              </div>
            </div>
          </div>

          {/* ─── TEST HISTORY ────────────────────────────────── */}
          <div>
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <FaCheckCircle className="text-brand-primary" size={16} />
              Test History
            </h2>

            {attempts.length === 0 ? (
              <div className="text-center py-12 bg-dark-200 rounded-lg border border-dark-100">
                <FaClipboardList className="text-5xl text-gray-600 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-4">No test attempts yet</p>
                <p className="text-sm text-gray-500">Start your first test above to see results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(attempt => (
                  <div
                    key={attempt._id}
                    className="bg-dark-200 border border-dark-100 rounded-lg p-5 hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/10 transition group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">Test #{attempt._id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(attempt.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-6">
                        {/* Score */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Score</p>
                          <p className="text-xl font-bold text-white">
                            {attempt.marksObtained}/{attempt.totalMarks}
                          </p>
                        </div>

                        {/* Percentage */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Percentage</p>
                          <p className="text-xl font-bold text-brand-primary">
                            {((attempt.marksObtained / attempt.totalMarks) * 100).toFixed(0)}%
                          </p>
                        </div>

                        {/* Time */}
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Time Taken</p>
                          <p className="text-xl font-bold text-white">
                            {Math.round(attempt.timeTaken / 60)}m
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <button className="px-5 py-2 bg-dark-100 hover:bg-dark-300/50 rounded-lg text-sm font-semibold text-white transition shrink-0">
                        View Result
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
