import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  ClipboardList,
  X,
} from "lucide-react";
import logo from "../../assets/icons/logo.png";

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("studentSidebarCollapsed");
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("studentSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const sidebarWidth = collapsed ? "w-20" : "w-64";

  const navItems = [
    { path: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student/tests",     icon: ClipboardList,   label: "Test Series" },
    { path: "/student/profile",   icon: User,            label: "Profile" },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} glass-panel border-r border-white/10 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-16 -left-12 h-40 w-40 rounded-full bg-brand-primary/20 blur-3xl" />

        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 p-4 min-h-[72px]">
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
          <nav className="custom-scrollbar flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "btn-gradient font-bold shadow-[0_6px_18px_rgba(0,186,124,0.3)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  } ${collapsed ? "justify-center px-0" : ""}`
                }
                title={collapsed ? item.label : ""}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="relative border-t border-white/5 p-3">
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
