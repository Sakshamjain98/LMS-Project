import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTeacherDashboard, getTeacherNotes, getTeacherTests, getMyCourses } from "../../services/teacherService";
import { FaBook, FaClock, FaCheckCircle, FaFileAlt, FaClipboardList, FaDraftingCompass, FaArrowRight, FaEye, FaFire, FaChartLine } from "react-icons/fa";
import { AlertCircle, TrendingUp, Zap } from "lucide-react";
import { DEFAULT_TEACHER_UI_SETTINGS, mergeTeacherUiSettings } from "../../constants/teacherUiDefaults";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [_notes, setNotes] = useState([]);
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingApproval: 0,
    publishedCourses: 0,
    totalNotes: 0,
    totalTests: 0,
    draftTests: 0,
    publishedTests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uiSettings, setUiSettings] = useState(DEFAULT_TEACHER_UI_SETTINGS);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [dashRes, notesRes, testsRes, coursesRes] = await Promise.all([
          getTeacherDashboard().catch(() => ({})),
          getTeacherNotes().catch(() => ({ notes: [] })),
          getTeacherTests().catch(() => ({ tests: [] })),
          getMyCourses().catch(() => ({ courses: [] })),
        ]);

        const mergedSettings = mergeTeacherUiSettings(dashRes?.data?.uiSettings || dashRes?.uiSettings);
        setUiSettings(mergedSettings);
        localStorage.setItem("teacherUiSettings", JSON.stringify(mergedSettings));

        const courseList = coursesRes.courses || [];
        const noteList = mergedSettings.teacherVisibility.notesEnabled ? (notesRes.notes || []) : [];
        const testList = mergedSettings.teacherVisibility.testsEnabled ? (testsRes.tests || []) : [];

        setCourses(courseList);
        setNotes(noteList);
        setTests(testList);

        setStats({
          totalCourses: courseList.length,
          pendingApproval: courseList.filter(c => c.status === "pending").length,
          publishedCourses: courseList.filter(c => c.published).length,
          totalNotes: noteList.length,
          totalTests: testList.length,
          draftTests: testList.filter(t => t.status === "draft").length,
          publishedTests: testList.filter(t => t.status === "published").length,
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-400">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 font-medium text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const visibleStatItems = [
    { key: "totalCourses", icon: <FaBook />, label: "Total Courses", value: stats.totalCourses, color: "blue" },
    { key: "pendingApproval", icon: <FaClock />, label: "Pending Approval", value: stats.pendingApproval, color: "yellow" },
    { key: "publishedCourses", icon: <FaCheckCircle />, label: "Published Courses", value: stats.publishedCourses, color: "green" },
    { key: "totalNotes", icon: <FaFileAlt />, label: "Total Notes", value: stats.totalNotes, color: "purple" },
    { key: "totalTests", icon: <FaClipboardList />, label: "Total Tests", value: stats.totalTests, color: "orange" },
    { key: "draftTests", icon: <FaDraftingCompass />, label: "Draft Tests", value: stats.draftTests, color: "red" },
    { key: "publishedTests", icon: <FaCheckCircle />, label: "Published Tests", value: stats.publishedTests, color: "emerald" },
  ].filter((item) => uiSettings.teacherDashboardStats[item.key]);

  const { notesEnabled, uploadEnabled, testsEnabled } = uiSettings.teacherVisibility;
  const hasVisibleStats = visibleStatItems.length > 0;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-dark-400 min-h-screen">
      
      {/* ─── WELCOME HEADER ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              Educator Dashboard 
            </h1>
            <p className="text-gray-400 mt-2">Manage your courses, tests, and track student progress</p>
          </div>
          <div className="flex gap-3">
            {uploadEnabled && (
              <button
                onClick={() => navigate("/teacher/upload/basics")}
                className="px-5 py-3 bg-brand-primary text-dark-400 rounded-lg font-bold hover:opacity-90 transition flex items-center gap-2"
              >
                <FaBook size={16} />
                New Course
              </button>
            )}
            {testsEnabled && (
              <button
                onClick={() => navigate("/teacher/tests/create")}
                className="px-5 py-3 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition flex items-center gap-2"
              >
                <FaClipboardList size={16} />
                New Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── STATS GRID (7 COLUMNS) ──────────────────────────────────── */}
      {hasVisibleStats && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {visibleStatItems.map((item) => (
              <MetricCard key={item.key} icon={item.icon} label={item.label} value={item.value} color={item.color} />
            ))}
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT (2 COLUMNS) ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Content Sections (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RECENT COURSES */}
          {uploadEnabled && (
          <ContentSection
            icon={<FaBook />}
            title="Recent Courses"
            subtitle="Your latest created courses"
            viewAllLink="/teacher/courses"
            isEmpty={courses.length === 0}
            emptyMessage="No courses created yet"
          >
            {courses.slice(0, 4).map(course => (
              <ContentCard
                key={course._id}
                icon={course.thumbnail?.url}
                title={course.title}
                meta1={`${course.sections?.length || 0} sections`}
                meta2={course.isPaid ? "💎 Paid" : "🎓 Free"}
                status={course.status}
                statusColor={course.status === "pending" ? "yellow" : "green"}
                onClick={() => navigate(`/teacher/courses/${course._id}`)}
              />
            ))}
          </ContentSection>
          )}

          {/* RECENT TESTS */}
          {testsEnabled && (
          <ContentSection
            icon={<FaClipboardList />}
            title="Recent Tests"
            subtitle="Your latest created assessments"
            viewAllLink="/teacher/tests"
            isEmpty={tests.length === 0}
            emptyMessage="No tests created yet"
          >
            {tests.slice(0, 4).map(test => (
              <ContentCard
                key={test._id}
                title={test.title}
                meta1={`${test.questions?.length || 0} questions`}
                meta2={`${test.duration} min`}
                status={test.status}
                statusColor={test.status === "draft" ? "yellow" : "green"}
                onClick={() => navigate(`/teacher/tests/${test._id}`)}
              />
            ))}
          </ContentSection>
          )}

          {!uploadEnabled && !testsEnabled && !notesEnabled && (
            <div className="bg-dark-200 border border-dark-100 rounded-2xl p-8 text-center">
              <p className="text-white text-lg font-semibold">Your educator sections are currently restricted by admin settings.</p>
              <p className="text-gray-400 mt-2 text-sm">Contact your admin to enable upload, notes, or test modules.</p>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          
          {/* QUICK STATS SUMMARY */}
          {hasVisibleStats && (
          <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FaChartLine className="text-brand-primary" />
              Content Overview
            </h3>
            <div className="space-y-4">
              {uiSettings.teacherDashboardStats.totalCourses && (
                <div className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg">
                  <span className="text-sm text-gray-400">Courses</span>
                  <span className="text-2xl font-black text-white">{stats.totalCourses}</span>
                </div>
              )}
              {uiSettings.teacherDashboardStats.totalTests && (
                <div className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg">
                  <span className="text-sm text-gray-400">Tests</span>
                  <span className="text-2xl font-black text-white">{stats.totalTests}</span>
                </div>
              )}
              {uiSettings.teacherDashboardStats.totalNotes && notesEnabled && (
                <div className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg">
                  <span className="text-sm text-gray-400">Study Notes</span>
                  <span className="text-2xl font-black text-white">{stats.totalNotes}</span>
                </div>
              )}
              {uiSettings.teacherDashboardStats.pendingApproval && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <span className="text-sm text-yellow-400">⚠️ Pending</span>
                  <span className="text-2xl font-black text-yellow-400">{stats.pendingApproval}</span>
                </div>
              )}
            </div>
          </div>
          )}

          {/* TIPS & NOTIFICATIONS */}
          {testsEnabled && (
          <div className="bg-linear-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <FaFire className="text-orange-400 text-2xl mt-1 shrink-0" />
              <div>
                <h4 className="font-bold text-white mb-2">Pro Tip</h4>
                <p className="text-sm text-gray-300 mb-4">
                  Publish your first test to start collecting student performance data and analytics
                </p>
                {testsEnabled && (
                  <a
                    href="/teacher/tests/create"
                    className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 inline-block"
                  >
                    Create Test →
                  </a>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═════════════════════════════════════════════════════════════════════

function MetricCard({ icon, label, value, color }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20",
    yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20",
    green: "from-green-500/20 to-green-600/10 border-green-500/20",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/20",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/20",
    red: "from-red-500/20 to-red-600/10 border-red-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20",
  };

  return (
    <div className={`bg-linear-to-br ${colors[color]} border rounded-xl p-5 hover:shadow-lg transition group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl opacity-70 group-hover:opacity-100 transition">{icon}</div>
        <TrendingUp size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition" />
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function ContentSection({ icon, title, subtitle, viewAllLink, isEmpty, emptyMessage, children }) {
  return (
    <div className="bg-dark-200 border border-dark-100 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-dark-100 rounded-lg text-xl">{icon}</div>
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
        <a href={viewAllLink} className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1">
          View All <FaArrowRight size={12} />
        </a>
      </div>

      {isEmpty ? (
        <div className="text-center py-12">
          <p className="text-gray-400 font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </div>
  );
}

function ContentCard({ title, meta1, meta2, status, statusColor, onClick }) {
  const statusBgColor = {
    yellow: "bg-yellow-500/15 text-yellow-400",
    green: "bg-green-500/15 text-green-400",
    blue: "bg-blue-500/15 text-blue-400",
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-dark-100/50 rounded-lg border border-dark-100 hover:border-brand-primary/30 transition cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate group-hover:text-brand-primary transition">
            {title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{meta1}</span>
            <span>•</span>
            <span>{meta2}</span>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${statusBgColor[statusColor]}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
