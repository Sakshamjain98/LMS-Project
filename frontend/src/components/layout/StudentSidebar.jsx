import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  ClipboardList,
  X,
  Layers,
  Folder,
  FileText,
  Tag,
  BookOpen,
  GraduationCap,
  Zap,
} from "lucide-react";
import logo from "../../assets/icons/logo.png";
import { getAvailableTests } from "../../services/studentService";

// Count total published tests in a topic (subjects → chapters → tests)
const countTopicTests = (topic) =>
  (topic?.subjects || []).reduce(
    (sum, s) => sum + (s.chapters || []).reduce((cs, c) => cs + (c.tests?.length || 0), 0),
    0
  );

// Count total tests in a subject (chapters → tests)
const countSubjectTests = (subject) =>
  (subject?.chapters || []).reduce((sum, c) => sum + (c.tests?.length || 0), 0);

// Count total tests in an exam (testSeries + allIndiaTestSeries)
const countExamTests = (exam) => {
  let total = 0;
  (exam?.testSeries || []).forEach((ts) => { total += countTopicTests(ts); });
  (exam?.allIndiaTestSeries || []).forEach((a) => { total += (a.tests?.length || 0); });
  return total;
};

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("studentSidebarCollapsed");
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const [seriesExpanded, setSeriesExpanded] = useState(true);
  const [openCategory, setOpenCategory] = useState(null);
  const [openExam, setOpenExam] = useState(null);
  const [openSeries, setOpenSeries] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("studentSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let active = true;
    getAvailableTests()
      .then((res) => { if (active) setCategoryTree(res?.categories || []); })
      .catch(() => {});
    return () => { active = false; };
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sidebarWidth = collapsed ? "w-20" : "w-72";

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} glass-panel border-r border-white/10 flex flex-col overflow-clip transition-all duration-300 z-30 shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-16 -left-12 h-40 w-40 rounded-full bg-brand-primary/20 blur-3xl" />

        {/* Header */}
        <div className="relative shrink-0 flex items-center justify-between border-b border-white/5 p-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 overflow-hidden shadow-[0_8px_24px_rgba(0,186,124,0.25)]">
              <img src={logo} alt="PS Classes" className="h-full w-full object-contain" />
            </div>
            {!collapsed && <span className="text-white font-bold text-base tracking-tight">PS <span className="text-brand-primary">Classes</span></span>}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition ${collapsed ? "mx-auto" : ""}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/60 hover:text-white p-2">
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="custom-scrollbar relative flex-1 min-h-0 min-w-0 space-y-1.5 px-3 py-3 overflow-y-auto">
          <SidebarLink to="/student/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} onClick={() => setMobileOpen(false)} />

          {/* Test Series — collapsible hierarchy */}
          <div className="mt-1 min-w-0">
            <button
              onClick={() => setSeriesExpanded((v) => !v)}
              className={`group flex w-full items-center justify-between rounded-xl px-4 py-2.5 transition-colors ${
                location.pathname.startsWith("/student/tests")
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? "Test Series" : ""}
            >
              <span className="flex items-center gap-3">
                <ClipboardList size={18} />
                {!collapsed && <span className="text-sm font-semibold">Test Series</span>}
              </span>
              {!collapsed && (
                <ChevronDown size={16} className={`transition-transform ${seriesExpanded ? "rotate-0" : "-rotate-90"}`} />
              )}
            </button>

            {!collapsed && seriesExpanded && (
              <div className="mt-1 space-y-0.5 pl-2 pr-1 min-w-0">
                <NavLink
                  to="/student/tests"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive ? "bg-white/5 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  end
                >
                  <Layers size={13} className="text-brand-primary" />
                  All Series
                </NavLink>

                {categoryTree.length === 0 ? (
                  <p className="px-3 py-1.5 text-[11px] text-white/40">No series available yet.</p>
                ) : (
                  categoryTree.map((category) => {
                    const categoryOpen = openCategory === category._id;
                    const categoryTotalTests = (category.exams || []).reduce(
                      (sum, e) => sum + countExamTests(e), 0
                    );
                    return (
                      <div key={category._id} className="min-w-0">
                        <div className="flex items-center min-w-0">
                          <button
                            onClick={() => setOpenCategory((v) => (v === category._id ? null : category._id))}
                            className="shrink-0 rounded-md p-1 text-white/40 hover:text-white"
                          >
                            <ChevronRight size={12} className={`transition-transform ${categoryOpen ? "rotate-90" : ""}`} />
                          </button>
                          <button
                            onClick={() => setOpenCategory((v) => (v === category._id ? null : category._id))}
                            className="flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                          >
                            <Tag size={12} className="text-brand-primary shrink-0" />
                            <span className="truncate flex-1 min-w-0">{category.title}</span>
                            <span className="ml-auto shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">
                              {category.exams?.length || 0}
                            </span>
                          </button>
                        </div>

                        {categoryOpen && (
                          <div className="mb-1 ml-5 space-y-0.5 border-l border-white/5 pl-2 min-w-0">
                            {(category.exams || []).map((exam) => {
                              const examOpen = openExam === exam._id;
                              const examTests = countExamTests(exam);
                              return (
                                <div key={exam._id} className="min-w-0">
                                  <div className="flex items-center min-w-0">
                                    <button
                                      onClick={() => setOpenExam((v) => (v === exam._id ? null : exam._id))}
                                      className="shrink-0 rounded-md p-1 text-white/30 hover:text-white"
                                    >
                                      <ChevronRight size={11} className={`transition-transform ${examOpen ? "rotate-90" : ""}`} />
                                    </button>
                                    <button
                                      onClick={() => setOpenExam((v) => (v === exam._id ? null : exam._id))}
                                      className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-2 py-1 text-[11px] text-white/60 hover:bg-white/5 hover:text-white"
                                    >
                                      <GraduationCap size={11} className="text-sky-400 shrink-0" />
                                      <span className="truncate flex-1 min-w-0">{exam.title}</span>
                                      <span className="ml-auto shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/35">
                                        {examTests} Tests
                                      </span>
                                    </button>
                                  </div>

                                  {examOpen && (
                                    <div className="ml-4 space-y-0.5 border-l border-white/5 pl-2 min-w-0">
                                      {/* Regular test series */}
                                      {(exam.testSeries || []).map((series) => {
                                        const seriesOpen = openSeries === series._id;
                                        const totalTests = countTopicTests(series);
                                        return (
                                          <div key={series._id} className="min-w-0">
                                            <div className="flex items-center min-w-0">
                                              {series.subjects?.length > 0 && (
                                                <button
                                                  onClick={() => setOpenSeries((v) => (v === series._id ? null : series._id))}
                                                  className="shrink-0 rounded-md p-0.5 text-white/25 hover:text-white/60"
                                                >
                                                  <ChevronRight size={10} className={`transition-transform ${seriesOpen ? "rotate-90" : ""}`} />
                                                </button>
                                              )}
                                              <Link
                                                to={`/student/tests/${series._id}`}
                                                onClick={() => setMobileOpen(false)}
                                                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-[11px] text-white/50 hover:bg-white/5 hover:text-white"
                                              >
                                                <FileText size={10} className="text-amber-400 shrink-0" />
                                                <span className="truncate flex-1 min-w-0">{series.title}</span>
                                                <span className="ml-auto shrink-0 text-[9px] text-white/30">
                                                  {totalTests}
                                                </span>
                                              </Link>
                                            </div>

                                            {/* Subject level — expanded when series is open */}
                                            {seriesOpen && series.subjects?.length > 0 && (
                                              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-white/5 pl-2 min-w-0 pb-1">
                                                {series.subjects.map((subject) => {
                                                  const subjectTests = countSubjectTests(subject);
                                                  return (
                                                    <div
                                                      key={subject._id}
                                                      className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-[10px] text-white/40"
                                                    >
                                                      <Folder size={9} className="text-sky-400 shrink-0" />
                                                      <span className="truncate flex-1 min-w-0">{subject.title}</span>
                                                      <span className="shrink-0 text-[9px] text-white/25">
                                                        {subjectTests} Tests
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}

                                      {/* All India Test Series */}
                                      {(exam.allIndiaTestSeries || []).map((aits) => (
                                        <Link
                                          key={aits._id}
                                          to={`/student/tests/${aits._id}`}
                                          onClick={() => setMobileOpen(false)}
                                          className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-[11px] text-white/50 hover:bg-white/5 hover:text-white"
                                        >
                                          <Zap size={10} className="text-yellow-400 shrink-0" />
                                          <span className="truncate flex-1 min-w-0">{aits.title}</span>
                                          <span className="ml-auto shrink-0 text-[9px] text-white/30">
                                            {aits.tests?.length || 0}
                                          </span>
                                        </Link>
                                      ))}

                                      {(exam.testSeries || []).length === 0 && (exam.allIndiaTestSeries || []).length === 0 && (
                                        <p className="px-2 py-1 text-[10px] text-white/30">No test series</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {(category.exams || []).length === 0 && (
                              <p className="px-2 py-1 text-[10px] text-white/30">No exams</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <SidebarLink to="/student/courses" icon={BookOpen} label="Courses" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          <div className="my-2 h-px bg-white/5" />
          <SidebarLink to="/student/profile" icon={User} label="Profile" collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        </nav>

        {/* Logout */}
        <div className="relative shrink-0 border-t border-white/5 p-3">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 ${collapsed ? "justify-center px-0" : ""}`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-10 p-3.5 bg-brand-primary shadow-[0_8px_30px_rgba(0,186,124,0.45)] rounded-full text-dark-400 hover:scale-105 transition-transform"
      >
        <Menu size={22} />
      </button>
    </>
  );
}

function SidebarLink({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "btn-gradient font-bold shadow-[0_6px_18px_rgba(0,186,124,0.3)]"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center px-0" : ""}`
      }
      title={collapsed ? label : ""}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
