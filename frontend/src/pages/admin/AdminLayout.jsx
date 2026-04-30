import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Newspaper,
  MessageSquare,
  GraduationCap,
  LogOut,
  Menu,
  X,
  DollarSign,
  Shield, 
  UserPlus,
  SlidersHorizontal,
  UserCircle2
} from "lucide-react";
import toast from "react-hot-toast";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/pending-content", label: "Pending Content", icon: BookOpen },
  { path: "/admin/teachers", label: "Teacher Approval", icon: GraduationCap },
  { path: "/admin/payments", label: "Payments", icon: CreditCard },
  { path: "/admin/news", label: "News", icon: Newspaper },
  { path: "/admin/blogs", label: "Blog Moderation", icon: DollarSign },
  { path: "/admin/educator-controls", label: "Educator Controls", icon: SlidersHorizontal },
  { path: "/admin/profile", label: "Profile", icon: UserCircle2 },
  { path: "/admin/create-admin", label: "Create Admin", icon: UserPlus }, 
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user] = useState(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error("Failed to parse user", e);
      return null;
    }
  });
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-dark-400 font-sans text-white">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-dark-200 border border-dark-100 rounded-lg text-brand-primary"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-dark-300 border-r border-dark-100 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <Shield className="text-dark-400 w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">
                Admin<span className="text-brand-primary ml-1">Portal</span>
              </h2>
            </div>
            <p className="text-[10px] font-bold text-grayCustom-medium uppercase tracking-[0.3em] ml-1">
              Control Center
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-brand-primary text-dark-400 font-bold"
                      : "text-grayCustom-medium hover:bg-dark-200 hover:text-white"
                  }`}
                >
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Profile Section */}
          <div className="p-4 border-t border-dark-100 bg-dark-200/30">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-dark-100 border border-dark-100 flex items-center justify-center text-brand-primary text-lg font-bold">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">
                  Super Admin
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-400 font-bold rounded-xl hover:bg-red-400/10 transition-all text-sm group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}