import { useEffect, useState } from "react";
import { getStudentDashboard, getStudentProfile, getMyAttempts } from "../../services/studentService";
import StudentNavbar from "../../components/layout/StudentNavbar";
import { 
  FaBook, FaPlayCircle, FaFileAlt, FaClipboardList, FaClock, FaTrophy, 
  FaFire, FaArrowRight, FaCheckCircle, FaGraduationCap, FaLightbulb,
  FaChartLine, FaCalendarAlt
} from "react-icons/fa";
import { TrendingUp, Zap } from "lucide-react";

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [dashRes, profRes, attemptsRes] = await Promise.all([
          getStudentDashboard().catch(() => ({})),
          getStudentProfile().catch(() => ({})),
          getMyAttempts().catch(() => ({ data: [] })),
        ]);

        setDashboardData(dashRes || {});
        setProfile(profRes.user || {});
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <>
        <StudentNavbar />
        <div className="flex items-center justify-center h-screen bg-dark-400">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white/60 font-medium text-lg">Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  const coursesEnrolled = dashboardData?.freeCourses?.length || 0;
  const notesAvailable = dashboardData?.blogs?.length || 0;
  const completedTests = attempts.filter(a => a.status === "submitted" || a.status === "evaluated").length;
  const averageScore = attempts.length > 0 
    ? (attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length).toFixed(1)
    : 0;

  const recentCourses = dashboardData?.freeCourses?.slice(0, 3) || [];
  const recentTests = attempts.slice(0, 3) || [];

  return (
    <>
      <StudentNavbar />
      <div className="bg-dark-400 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* WELCOME HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                Welcome back, {profile?.name?.split(' ')[0]}
              </h1>
              <p className="text-gray-400 mt-2">Here's your learning overview for today</p>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
              <Zap size={20} className="text-brand-primary" />
              <div>
                <p className="text-xs text-gray-400">Subscription Status</p>
                <p className="text-sm font-bold text-brand-primary">Premium Active</p>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={<FaBook className="text-brand-primary" />}
              label="Courses Enrolled"
              value={coursesEnrolled}
              subtext="Active learning"
            />
            <StatCard 
              icon={<FaFileAlt className="text-brand-primary" />}
              label="Study Materials"
              value={notesAvailable}
              subtext="Notes available"
            />
            <StatCard 
              icon={<FaClipboardList className="text-brand-primary" />}
              label="Tests Completed"
              value={completedTests}
              subtext="Assessments done"
            />
            <StatCard 
              icon={<FaChartLine className="text-brand-primary" />}
              label="Average Score"
              value={`${averageScore}%`}
              subtext="Performance metric"
            />
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* CONTINUE LEARNING */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 hover:border-brand-primary/20 transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary/10 rounded-lg">
                      <FaPlayCircle className="text-brand-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Continue Learning</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Pick up where you left off</p>
                    </div>
                  </div>
                  <a href="/student/courses" className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1">
                    View All <FaArrowRight size={12} />
                  </a>
                </div>

                {recentCourses.length > 0 ? (
                  <div className="space-y-3">
                    {recentCourses.map((course) => (
                      <a
                        key={course._id}
                        href={`/student/courses/${course._id}`}
                        className="flex items-center gap-4 p-4 bg-dark-100/50 hover:bg-dark-100 rounded-xl border border-dark-100 hover:border-brand-primary/30 transition group"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-dark-300">
                          {course.thumbnail?.url ? (
                            <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-primary/10">
                              <FaBook className="text-brand-primary" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate group-hover:text-brand-primary transition">
                            {course.title}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/70 w-1/3"></div>
                              </div>
                              <span className="text-xs font-medium text-gray-400">33%</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {course.sections?.length || 0} modules
                            </p>
                          </div>
                        </div>
                        <FaArrowRight className="text-gray-500 group-hover:text-brand-primary transition" size={16} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaBook className="text-4xl text-gray-600 mx-auto mb-4 opacity-30" />
                    <p className="text-gray-400 font-medium">No courses started yet</p>
                    <a href="/student/courses" className="text-brand-primary text-sm mt-3 inline-block hover:underline">
                      Browse Courses
                    </a>
                  </div>
                )}
              </div>

              {/* TEST PERFORMANCE */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6 hover:border-brand-primary/20 transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-primary/10 rounded-lg">
                      <FaClipboardList className="text-brand-primary text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Test Performance</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Your recent test attempts</p>
                    </div>
                  </div>
                  <a href="/student/tests" className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1">
                    All Tests <FaArrowRight size={12} />
                  </a>
                </div>

                {recentTests.length > 0 ? (
                  <div className="space-y-3">
                    {recentTests.map((attempt) => (
                      <div
                        key={attempt._id}
                        className="flex items-center justify-between p-4 bg-dark-100/50 rounded-xl border border-dark-100 hover:border-brand-primary/30 transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {attempt.testId?.title || "Test"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FaClock size={12} />
                              {attempt.timeTaken || 0} min
                            </span>
                            <span>•</span>
                            <span>{attempt.totalQuestions} questions</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-black text-white">
                              {attempt.percentage?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {attempt.marksObtained}/{attempt.totalMarks}
                            </p>
                          </div>

                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                            attempt.percentage >= 70
                              ? "bg-brand-primary/20 text-brand-primary"
                              : attempt.percentage >= 50
                              ? "bg-dark-100 text-white/70"
                              : "bg-dark-100 text-white/50"
                          }`}>
                            {attempt.percentage >= 70 ? "Pass" : attempt.percentage >= 50 ? "Fair" : "Fail"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaClipboardList className="text-4xl text-gray-600 mx-auto mb-4 opacity-30" />
                    <p className="text-gray-400 font-medium">No tests attempted yet</p>
                    <a href="/student/tests" className="text-brand-primary text-sm mt-3 inline-block hover:underline">
                      Start a Test
                    </a>
                  </div>
                )}
              </div>

              {/* WEEKLY ACTIVITY */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand-primary/10 rounded-lg">
                    <FaCalendarAlt className="text-brand-primary text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Weekly Activity</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Your learning streak</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-10">{day}</span>
                      <div className="flex-1 h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            i <= 3 ? 'bg-gradient-to-r from-brand-primary to-brand-primary/70' : 'bg-dark-300'
                          }`}
                          style={{ width: `${i <= 3 ? (i + 1) * 25 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {i <= 3 ? `${(i + 1) * 45}m` : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-lg flex items-start gap-3">
                  <FaFire className="text-brand-primary text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">7-Day Streak Active</p>
                    <p className="text-xs text-gray-400 mt-1">Keep it going! One more day to reach 8!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              
              {/* QUICK ACTIONS */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton 
                    icon={<FaPlayCircle />}
                    label="Courses"
                    href="/student/courses"
                  />
                  <QuickActionButton 
                    icon={<FaFileAlt />}
                    label="Notes"
                    href="/student/notes"
                  />
                  <QuickActionButton 
                    icon={<FaClipboardList />}
                    label="Tests"
                    href="/student/tests"
                  />
                  <QuickActionButton 
                    icon={<FaTrophy />}
                    label="Analytics"
                    href="/student/performance"
                  />
                </div>
              </div>

              {/* UPCOMING TESTS */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Upcoming Tests</h3>
                <div className="space-y-3">
                  <UpcomingTestCard 
                    title="Full Length Mock Test"
                    status="Live"
                    daysLeft={2}
                  />
                  <UpcomingTestCard 
                    title="Mid-Term Assessment"
                    status="Scheduled"
                    daysLeft={5}
                  />
                  <UpcomingTestCard 
                    title="Chapter Quiz"
                    status="Scheduled"
                    daysLeft={7}
                  />
                </div>
              </div>

              {/* PRO TIP */}
              <div className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-primary/20 rounded-lg">
                    <FaLightbulb className="text-brand-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">Pro Tip</h3>
                    <p className="text-sm text-gray-300">
                      Complete 3 practice tests this week to boost your exam readiness by 45%
                    </p>
                    <a href="/student/tests" className="text-xs font-bold text-brand-primary mt-3 inline-block hover:text-brand-primary/80">
                      Start Practice
                    </a>
                  </div>
                </div>
              </div>

              {/* ACHIEVEMENTS */}
              <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Achievements</h3>
                <div className="grid grid-cols-3 gap-3">
                  <AchievementBadge title="Starter" achieved={true} />
                  <AchievementBadge title="Streak" achieved={true} />
                  <AchievementBadge title="Expert" achieved={false} />
                </div>
              </div>
            </div>
          </div>

          {/* UPGRADE CTA */}
          <div className="bg-gradient-to-r from-brand-primary/5 to-transparent border border-brand-primary/10 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap size={24} className="text-brand-primary" />
                  Upgrade to Premium
                </h3>
                <p className="text-gray-400 mt-2">Unlock unlimited access to all courses, tests, and materials</p>
              </div>
              <a
                href="/#pricing"
                className="px-6 py-3 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition inline-flex items-center gap-2"
              >
                View Plans <FaArrowRight />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// REUSABLE COMPONENTS
function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="bg-dark-200 border border-dark-100 rounded-xl p-5 hover:shadow-lg hover:shadow-black/30 transition group">
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl opacity-70 group-hover:opacity-100 transition">{icon}</div>
        <TrendingUp size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition" />
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-3xl font-black text-white mb-2">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

function QuickActionButton({ icon, label, href }) {
  return (
    <a
      href={href}
      className="bg-dark-300 rounded-xl p-4 border border-dark-100 hover:border-brand-primary/30 transition group text-center"
    >
      <div className="text-2xl text-brand-primary group-hover:scale-110 transition mx-auto mb-2">
        {icon}
      </div>
      <p className="text-xs font-semibold text-white">{label}</p>
    </a>
  );
}

function UpcomingTestCard({ title, status, daysLeft }) {
  return (
    <div className="p-4 bg-dark-100/50 rounded-lg border border-dark-100 hover:border-brand-primary/20 transition">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-white truncate pr-2">{title}</p>
        <span className="text-xs px-2 py-1 rounded-full shrink-0 bg-brand-primary/15 text-brand-primary font-bold">
          {status}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <FaClock size={12} />
        <span>In {daysLeft} days</span>
      </div>
    </div>
  );
}

function AchievementBadge({ title, achieved }) {
  return (
    <div className={`text-center p-3 rounded-lg border ${
      achieved 
        ? "bg-brand-primary/10 border-brand-primary/20" 
        : "bg-dark-100 border-dark-100/50 opacity-50"
    }`}>
      <div className="text-2xl mb-1">{achieved ? "✓" : "○"}</div>
      <p className="text-xs font-semibold text-white">{title}</p>
    </div>
  );
}

