import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStudentDashboard,
  getStudentProfile,
  getMyAttempts,
  getAllCourses,
  getAllNotes
} from "../../services/studentService"; // Update path if needed
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  BookOpen,
  ChevronRight,
  CircleAlert,
  Clock,
  FileText,
  LayoutDashboard,
  LineChart,
  PlayCircle,
  Trophy,
  Award
} from "lucide-react";

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Fetching more specific endpoints to guarantee 5-6 items
        const [dashRes, profRes, attemptsRes, coursesRes, notesRes] = await Promise.all([
          getStudentDashboard().catch(() => ({})),
          getStudentProfile().catch(() => ({})),
          getMyAttempts().catch(() => ({ data: [] })),
          getAllCourses().catch(() => ({ data: [] })),
          getAllNotes().catch(() => ({ data: [] }))
        ]);

        setDashboardData(dashRes || {});
        setProfile(profRes.user || {});
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : dashRes?.freeCourses || []);
        setResources(Array.isArray(notesRes.data) ? notesRes.data : dashRes?.blogs || []);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to load some dashboard components.");
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
        <div className="flex min-h-screen items-center justify-center bg-[#0B0D14]">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-[#00DC82] border-t-transparent animate-spin" />
            <p className="text-base font-semibold text-white">Loading your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  const firstName = profile?.name?.trim()?.split(" ")?.[0] || "Student";
  const greeting = getGreeting();

  // Metrics Calculations
  const sortedAttempts = [...attempts].sort((a, b) => {
    const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const completedTests = attempts.filter(
    (a) => a.status === "submitted" || a.status === "evaluated"
  ).length;
  
  const averageScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length).toFixed(1)
    : "0.0";
    
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map((a) => Number(a.percentage || 0))).toFixed(1)
    : "0.0";

  // Data Slicing (Showing 6 items as requested)
  const displayCourses = courses.slice(0, 6);
  const displayTests = sortedAttempts.slice(0, 6);
  const displayResources = resources.slice(0, 4);

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-[#0B0D14] pb-16 text-gray-200 selection:bg-[#00DC82]/30">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-6 py-8 md:px-10 lg:py-10">
          
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-red-400" />
              <p className="font-medium text-base">{error}</p>
            </div>
          )}

          {/* Header */}
          <header className="flex flex-col gap-2">
            <p className="text-base font-medium text-[#00DC82] uppercase tracking-wider">
              {greeting}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              Welcome back, {firstName}
            </h1>
          </header>

          {/* Top Metrics Row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              icon={<BookOpen size={24} />} 
              label="Available Courses" 
              value={courses.length} 
            />
            <MetricCard 
              icon={<Trophy size={24} />} 
              label="Completed Tests" 
              value={completedTests} 
            />
            <MetricCard 
              icon={<LineChart size={24} />} 
              label="Average Score" 
              value={`${averageScore}%`} 
              isPercentage
            />
            <MetricCard 
              icon={<Award size={24} />} 
              label="Best Score" 
              value={`${bestScore}%`} 
              isPercentage
            />
          </div>

          {/* Main Dashboard Layout */}
          <div className="grid gap-8 lg:grid-cols-12">
            
            {/* Left Column: Courses & Tests (Takes up more space) */}
            <div className="space-y-8 lg:col-span-8 xl:col-span-9">
              
              {/* Courses Section */}
              <DashboardSection 
                title="Continue Learning" 
                actionLabel="Explore all courses" 
                actionTo="/student/courses"
              >
                {displayCourses.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {displayCourses.map((course) => (
                      <Link
                        key={course._id}
                        to={`/student/courses/${course._id}`}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#13161F] transition-all hover:-translate-y-1 hover:border-[#00DC82]/30 hover:shadow-[0_8px_30px_rgba(0,220,130,0.1)]"
                      >
                        <div className="aspect-[16/9] w-full overflow-hidden bg-[#1A1D27] relative">
                          {course.thumbnail?.url ? (
                            <img
                              src={course.thumbnail.url}
                              alt={course.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#00DC82]/40">
                              <LayoutDashboard size={40} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-0" />
                        </div>
                        
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="line-clamp-2 text-lg font-semibold text-white group-hover:text-[#00DC82] transition-colors">
                            {course.title}
                          </h3>
                          <div className="mt-auto pt-5">
                            <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
                              <span>Course Progress</span>
                              <span className="font-medium text-white">{course.progress || 0}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1A1D27]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#00DC82] to-emerald-300"
                                style={{ width: `${course.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No courses enrolled" actionTo="/student/courses" />
                )}
              </DashboardSection>

              {/* Tests Section */}
              <DashboardSection 
                title="Recent Tests" 
                actionLabel="View all attempts" 
                actionTo="/student/tests"
              >
                {displayTests.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {displayTests.map((attempt) => {
                      const score = Number(attempt?.percentage || 0);
                      const isGood = score >= 70;
                      const isAverage = score >= 40 && score < 70;

                      return (
                        <div
                          key={attempt._id}
                          className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#13161F] p-5 transition-colors hover:bg-[#1A1D27] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1A1D27] text-[#00DC82]">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-white">
                                {attempt.testId?.title || "Practice Assessment"}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} /> {formatDuration(attempt.timeTaken)}
                                </span>
                                <span>•</span>
                                <span>{formatDateLabel(attempt.updatedAt || attempt.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-6 sm:justify-end">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">{score.toFixed(1)}%</p>
                              <p className="text-sm text-gray-500">Score</p>
                            </div>
                            <span className={`flex h-8 items-center justify-center rounded-md px-3 text-xs font-bold uppercase tracking-wider ${
                              isGood ? "bg-emerald-500/10 text-emerald-400" : 
                              isAverage ? "bg-amber-500/10 text-amber-400" : 
                              "bg-red-500/10 text-red-400"
                            }`}>
                              {isGood ? "Passed" : isAverage ? "Average" : "Failed"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No test attempts yet" actionTo="/student/tests" />
                )}
              </DashboardSection>
            </div>

            {/* Right Column: Quick Actions & Resources */}
            <div className="space-y-8 lg:col-span-4 xl:col-span-3">
              
              <DashboardSection title="Quick Actions">
                <div className="grid grid-cols-2 gap-4">
                  <QuickActionCard icon={<PlayCircle size={28} />} label="Courses" to="/student/courses" />
                  <QuickActionCard icon={<FileText size={28} />} label="Tests" to="/student/tests" />
                  <QuickActionCard icon={<BookOpen size={28} />} label="Notes" to="/student/notes" />
                  <QuickActionCard icon={<LineChart size={28} />} label="Analytics" to="/student/performance" />
                </div>
              </DashboardSection>

              <DashboardSection title="Study Resources" actionLabel="View notes" actionTo="/student/notes">
                {displayResources.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {displayResources.map((resource) => (
                      <Link
                        to={`/student/notes/${resource._id}`}
                        key={resource._id}
                        className="group flex items-start gap-4 rounded-xl border border-white/5 bg-[#13161F] p-4 transition-colors hover:border-[#00DC82]/30"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00DC82]/10 text-[#00DC82]">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-[#00DC82]">
                            {resource.title || "Study Material"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDateLabel(resource.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No resources available" />
                )}
              </DashboardSection>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                             */
/* -------------------------------------------------------------------------- */

function DashboardSection({ title, actionLabel, actionTo, children }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="group flex items-center text-sm font-semibold text-[#00DC82] hover:text-[#00DC82]/80"
          >
            {actionLabel}
            <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon, label, value, isPercentage }) {
  // Determine if value is negative (from your screenshot showing -25.0%)
  const isNegative = String(value).includes('-');
  
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-white/5 bg-[#13161F] p-6 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00DC82]/10 text-[#00DC82]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${isPercentage && isNegative ? 'text-red-400' : 'text-white'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-[#13161F] p-6 transition-all hover:-translate-y-1 hover:border-[#00DC82]/30 hover:bg-[#1A1D27]"
    >
      <div className="text-[#00DC82] transition-transform duration-300 group-hover:scale-110 group-hover:text-emerald-300">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{label}</p>
    </Link>
  );
}

function EmptyState({ title, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#13161F]/50 py-12 text-center">
      <div className="mb-3 rounded-full bg-[#1A1D27] p-4 text-gray-500">
        <LayoutDashboard size={24} />
      </div>
      <p className="text-base font-medium text-gray-300">{title}</p>
      {actionTo && (
        <Link to={actionTo} className="mt-4 rounded-lg bg-[#00DC82]/10 px-5 py-2 text-sm font-semibold text-[#00DC82] transition-colors hover:bg-[#00DC82]/20">
          Browse Catalog
        </Link>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* UTILS                                    */
/* -------------------------------------------------------------------------- */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDuration(minutes) {
  const totalMinutes = Number(minutes || 0);
  if (!totalMinutes) return "0m";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return "Recent";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}