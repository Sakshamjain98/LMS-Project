import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStudentProfile,
  getMyAttempts,
  
} from "../../services/studentService"; // Update path if needed
import StudentNavbar from "../../components/layout/StudentNavbar";
import {
  ChevronRight,
  CircleAlert,
  Clock,
  FileText,
  LayoutDashboard,
  LineChart,
  Trophy
} from "lucide-react";

export default function StudentDashboard() {
  // const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [profRes, attemptsRes] = await Promise.all([
          getStudentProfile().catch(() => ({})),
          getMyAttempts().catch(() => ({ data: [] }))
        ]);

        // setDashboardData(dashRes || {});
        setProfile(profRes.user || {});
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
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
        <div className="flex min-h-screen items-center justify-center bg-dark-400">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
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
  const ongoingTests = attempts.filter(
    (a) => a.status !== "submitted" && a.status !== "evaluated"
  ).length;
  
  const averageScore = attempts.length > 0
    ? (attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length).toFixed(1)
    : "0.0";
    
  // Data Slicing
  const continueTests = sortedAttempts.filter(
    (a) => a.status !== "submitted" && a.status !== "evaluated"
  );
  const recentTests = sortedAttempts.filter(
    (a) => a.status === "submitted" || a.status === "evaluated"
  );
  const displayContinueTests = (continueTests.length > 0 ? continueTests : sortedAttempts).slice(0, 6);
  const displayTests = (recentTests.length > 0 ? recentTests : sortedAttempts).slice(0, 6);

  return (
    <>
      <StudentNavbar />
      <div className="min-h-screen bg-dark-400 pb-16 text-gray-200 selection:bg-brand-primary/30">
        <div className="mx-auto flex max-w-400 flex-col gap-8 px-6 py-8 md:px-10 lg:py-10">
          
          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-red-400" />
              <p className="font-medium text-base">{error}</p>
            </div>
          )}

          {/* Header */}
          <header className="flex flex-col gap-2">
            <p className="text-base font-medium text-brand-primary uppercase tracking-wider">
              {greeting}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              Welcome back, {firstName}
            </h1>
          </header>

          {/* Top Metrics Row */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              icon={<FileText size={24} />} 
              label="Total Attempts" 
              value={attempts.length} 
            />
            <MetricCard 
              icon={<Trophy size={24} />} 
              label="Completed Tests" 
              value={completedTests} 
            />
            <MetricCard 
              icon={<LayoutDashboard size={24} />} 
              label="Ongoing Tests" 
              value={ongoingTests} 
            />
            <MetricCard 
              icon={<LineChart size={24} />} 
              label="Average Score" 
              value={`${averageScore}%`} 
              isPercentage
            />
          </div>

          {/* Main Dashboard Layout */}
          <div className="space-y-8">
            <DashboardSection
              title="Continue Tests"
              actionLabel="Explore more"
              actionTo="/student/tests"
            >
              {displayContinueTests.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {displayContinueTests.map((attempt) => (
                    <div
                      key={attempt._id}
                      className="flex flex-col gap-4 rounded-xl border border-white/5 bg-dark-200 p-5 transition-colors hover:bg-dark-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-dark-100 text-brand-primary">
                          <LayoutDashboard size={24} />
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

                      <Link
                        to="/student/tests"
                        className="inline-flex items-center justify-center rounded-lg bg-brand-primary/15 px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/25 transition"
                      >
                        Continue Test
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No tests available to continue" actionTo="/student/tests" />
              )}
            </DashboardSection>

            <DashboardSection
              title="Recent Tests"
              actionLabel="Explore more"
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
                        className="flex flex-col gap-4 rounded-xl border border-white/5 bg-dark-200 p-5 transition-colors hover:bg-dark-100 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-dark-100 text-brand-primary">
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
                <EmptyState title="No recent tests" actionTo="/student/tests" />
              )}
            </DashboardSection>
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
            className="group flex items-center text-sm font-semibold text-brand-primary hover:text-brand-primary/80"
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
    <div className="flex items-center gap-5 rounded-2xl border border-white/5 bg-dark-200 p-6 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
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

function EmptyState({ title, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-dark-200/50 py-12 text-center">
      <div className="mb-3 rounded-full bg-dark-100 p-4 text-gray-500">
        <LayoutDashboard size={24} />
      </div>
      <p className="text-base font-medium text-gray-300">{title}</p>
      {actionTo && (
        <Link to={actionTo} className="mt-4 rounded-lg bg-brand-primary/10 px-5 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20">
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