import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  Menu,
  ClipboardList,
  X,
} from "lucide-react";

export default function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("studentSidebarCollapsed");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("studentSidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const baseClass =
    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 w-full text-sm";
  const activeClass = "bg-brand-primary text-dark-400 font-medium";
  const inactiveClass = "text-gray-400 hover:bg-dark-300 hover:text-white";

  const sidebarWidth = collapsed ? "w-16" : "w-56";
  const textHidden = collapsed ? "hidden" : "inline";

  const navItems = [
    { path: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/student/courses", icon: BookOpen, label: "Courses" },
    { path: "/student/notes", icon: FileText, label: "Notes" },
    { path: "/student/tests", icon: ClipboardList, label: "Tests" },
    { path: "/student/performance", icon: BarChart3, label: "Analytics" },
    { path: "/student/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen ${sidebarWidth} bg-dark-400 flex flex-col justify-between border-r border-dark-100 transition-all duration-300 z-30 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-dark-100">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center text-dark-400 font-bold text-xs">
                  PQ
                </div>
                <span className="text-white font-semibold text-sm">Quest</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-gray-500 hover:text-white p-1 rounded"
            >
              {collapsed ? <ChevronDown size={16} /> : <ChevronDown size={16} className="rotate-180" />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 px-2.5 py-4">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `${baseClass} ${isActive ? activeClass : inactiveClass}`
                }
                title={collapsed ? item.label : ""}
              >
                <item.icon size={16} className="shrink-0" />
                <span className={textHidden}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-2.5 border-t border-dark-100">
          <button
            onClick={handleLogout}
            className={`${baseClass} text-red-500 hover:bg-dark-300`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={textHidden}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-10 p-2 bg-brand-primary rounded-lg text-dark-400 hover:opacity-90 transition"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
