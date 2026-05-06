import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Newspaper,
  LogOut,
  Menu,
  X,
  UserPlus,
  UserCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Layers,
  Folder,
  FileText,
  PenSquare,
  LayoutTemplate,
} from "lucide-react";
import toast from "react-hot-toast";
import { getTeacherTestSeries } from "../../services/teacherService";
import logo from "../../assets/icons/logo.png";

// 1. Dashboard, 2. Users, 3. Payments, 4. News, 5. Blogs,
// 6. Test Series (collapsible tree), 7. Create Admin, 8. Profile
const navTop = [
  { path: "/admin/dashboard",    label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users",        label: "Users",     icon: Users },
  { path: "/admin/payments",     label: "Payments",  icon: CreditCard },
  { path: "/admin/news",         label: "News",      icon: Newspaper },
  { path: "/admin/blogs",        label: "Blogs",     icon: PenSquare },
];
const navBottom = [
  { path: "/admin/site-content", label: "Site Content", icon: LayoutTemplate },
  { path: "/admin/create-admin", label: "Create Admin", icon: UserPlus },
  { path: "/admin/profile",      label: "Profile",      icon: UserCircle2 },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("adminSidebarCollapsed") || "false"); } catch { return false; }
  });
  const [seriesTree, setSeriesTree] = useState([]);
  const [openTopic, setOpenTopic] = useState(null);
  const [openSubject, setOpenSubject] = useState(null);
  const [seriesExpanded, setSeriesExpanded] = useState(true);

  const [user] = useState(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try { return JSON.parse(userStr); } catch { return null; }
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let active = true;
    getTeacherTestSeries()
      .then((res) => { if (active) setSeriesTree(res?.topics || []); })
      .catch(() => {});
    return () => { active = false; };
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const sidebarWidth = collapsed ? "w-20" : "w-72";
  const mainOffset   = collapsed ? "lg:ml-20" : "lg:ml-72";

  return (
    <div className="bg-dark-400 min-h-screen relative font-sans text-white">
      {/* Gradient ambient background — top-left + bottom-right only. */}
      <div className="pointer-events-none fixed -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-brand-primary/20 blur-3xl animate-float-slow" />
      <div className="pointer-events-none fixed -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-primary/20 blur-3xl" />

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 glass-pill rounded-xl text-brand-primary"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — fully fixed, no internal scroll */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen ${sidebarWidth} glass-panel border-r border-white/10 flex flex-col transform transition-all duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo + collapse button */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5">
          <Link to="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 shadow-[0_8px_24px_rgba(0,186,124,0.25)] shrink-0 overflow-hidden">
              <img src={logo} alt="PS Classes" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold tracking-tight text-white">
                  PS<span className="text-brand-primary ml-1">Classes</span>
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">Admin Portal</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav — NOT scrollable; sidebar stays fixed. Long names truncate. */}
        <nav className="flex-1 min-w-0 space-y-1 px-3 py-3">
          {navTop.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ))}

          {/* Test Series — collapsible hierarchy */}
          <div className="mt-1">
            <button
              onClick={() => setSeriesExpanded((v) => !v)}
              className={`group flex w-full items-center justify-between rounded-xl px-4 py-2.5 transition-colors ${
                location.pathname.startsWith("/admin/test-series")
                  ? "bg-brand-primary/15 text-brand-primary"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? "Test Series" : ""}
            >
              <span className="flex items-center gap-3">
                <Layers size={18} />
                {!collapsed && <span className="text-sm font-semibold">Test Series</span>}
              </span>
              {!collapsed && (
                <ChevronDown size={16} className={`transition-transform ${seriesExpanded ? "rotate-0" : "-rotate-90"}`} />
              )}
            </button>

            {!collapsed && seriesExpanded && (
              <div className="mt-1 space-y-0.5 pl-2 pr-1">
                <NavLink
                  to="/admin/test-series"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive && !location.search ? "bg-white/5 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  end
                >
                  <Layers size={13} className="text-brand-primary" />
                  All Series
                </NavLink>

                {seriesTree.length === 0 ? (
                  <p className="px-3 py-1.5 text-[11px] text-white/40">No series yet — create one →</p>
                ) : (
                  seriesTree.map((topic) => (
                    <div key={topic._id} className="min-w-0">
                      <div className="flex items-center min-w-0">
                        <button
                          onClick={() => setOpenTopic((v) => (v === topic._id ? null : topic._id))}
                          className="shrink-0 rounded-md p-1 text-white/40 hover:text-white"
                        >
                          <ChevronRight size={12} className={`transition-transform ${openTopic === topic._id ? "rotate-90" : ""}`} />
                        </button>
                        <Link
                          to={`/admin/test-series?level=subjects&topicId=${topic._id}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white"
                        >
                          <Layers size={12} className="text-brand-primary shrink-0" />
                          <span className="truncate flex-1 min-w-0">{topic.title}</span>
                          <span className="ml-auto shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40">
                            {topic.subjects?.length || 0}
                          </span>
                        </Link>
                      </div>

                      {openTopic === topic._id && (
                        <div className="mb-1 ml-5 space-y-0.5 border-l border-white/5 pl-2 min-w-0">
                          {(topic.subjects || []).map((subj) => (
                            <div key={subj._id} className="min-w-0">
                              <div className="flex items-center min-w-0">
                                <button
                                  onClick={() => setOpenSubject((v) => (v === subj._id ? null : subj._id))}
                                  className="shrink-0 rounded-md p-1 text-white/30 hover:text-white"
                                >
                                  <ChevronRight size={11} className={`transition-transform ${openSubject === subj._id ? "rotate-90" : ""}`} />
                                </button>
                                <Link
                                  to={`/admin/test-series?level=chapters&topicId=${topic._id}&subjectId=${subj._id}`}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex flex-1 min-w-0 items-center gap-2 rounded-md px-2 py-1 text-[11px] text-white/60 hover:bg-white/5 hover:text-white"
                                >
                                  <Folder size={11} className="text-sky-400 shrink-0" />
                                  <span className="truncate flex-1 min-w-0">{subj.title}</span>
                                </Link>
                              </div>

                              {openSubject === subj._id && (
                                <div className="ml-4 space-y-0.5 border-l border-white/5 pl-2 min-w-0">
                                  {(subj.chapters || []).map((ch) => (
                                    <Link
                                      key={ch._id}
                                      to={`/admin/test-series?level=tests&topicId=${topic._id}&subjectId=${subj._id}&chapterId=${ch._id}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-[11px] text-white/50 hover:bg-white/5 hover:text-white"
                                    >
                                      <FileText size={10} className="text-amber-400 shrink-0" />
                                      <span className="truncate flex-1 min-w-0">{ch.title}</span>
                                      <span className="ml-auto shrink-0 text-[9px] text-white/30">{ch.tests?.length || 0}</span>
                                    </Link>
                                  ))}
                                  {(subj.chapters || []).length === 0 && (
                                    <p className="px-2 py-1 text-[10px] text-white/30">No chapters</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {(topic.subjects || []).length === 0 && (
                            <p className="px-2 py-1 text-[10px] text-white/30">No subjects</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="my-2 h-px bg-white/5" />

          {navBottom.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        {/* Profile + logout */}
        <div className="border-t border-white/5 bg-white/[0.02] p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-3 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary text-base font-bold shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{user?.name || "Administrator"}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">Super Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 ${
              collapsed ? "justify-center px-0" : ""
            }`}
            title={collapsed ? "Sign Out" : ""}
          >
            <LogOut size={17} className="transition-transform group-hover:-translate-x-0.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main — scrolls naturally; sidebar stays fixed */}
      <main className={`relative z-10 min-h-screen min-w-0 ${mainOffset} transition-all duration-300`}>
        <div className="mx-auto max-w-7xl min-w-0 p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ item, collapsed, onClick }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      end={item.path === "/admin/dashboard"}
      title={collapsed ? item.label : ""}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 ${
          isActive
            ? "btn-gradient font-bold shadow-[0_6px_18px_rgba(0,186,124,0.35)]"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center px-0" : ""}`
      }
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </NavLink>
  );
}
