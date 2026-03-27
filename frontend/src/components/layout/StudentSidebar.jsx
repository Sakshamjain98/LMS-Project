import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
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

  const handleLogoClick = () => {
    navigate("/");
  };

  // Reduced padding and text size
  const baseClass =
    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-sm font-medium";
  const activeClass = "bg-brand-primary text-dark-400";
  const inactiveClass = "text-gray-400 hover:bg-dark-300 hover:text-white";

  // Smaller sidebar widths (w-64 = 256px, w-20 = 80px)
  const sidebarWidth = collapsed ? "w-20" : "w-64";
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
        className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} bg-dark-400 flex flex-col justify-between border-r border-dark-100 transition-all duration-300 z-30 shrink-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header - Clickable Logo */}
        <div className="flex flex-col h-full">
          <div className={`p-4 flex items-center justify-between border-b border-dark-100 min-h-[72px]`}>
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-dark-400 font-bold text-base">S</span>
              </div>
              {!collapsed && (
                <span className="text-white font-semibold text-lg">Student</span>
              )}
            </button>
            
            {/* Desktop Collapse/Expand Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-dark-300 hover:text-white transition ${collapsed ? 'mx-auto' : ''}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Mobile Close Toggle */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `${baseClass} ${isActive ? activeClass : inactiveClass} ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : ""}
              >
                <item.icon size={18} className="shrink-0" />
                <span className={textHidden}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-dark-100">
          <button
            onClick={handleLogout}
            className={`${baseClass} text-red-400 hover:bg-red-500/10 hover:text-red-400 ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={textHidden}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-10 p-3 bg-brand-primary shadow-[0_8px_30px_rgba(0,220,130,0.3)] rounded-lg text-dark-400 hover:scale-105 transition-transform"
      >
        <Menu size={24} />
      </button>

      {/* Subtle scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2A2F42; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #00DC82; }
      `}} />
    </>
  );
}