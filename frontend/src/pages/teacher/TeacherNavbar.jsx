import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Bell, LogOut, Settings, User, ChevronDown } from "lucide-react";

export default function TeacherNavbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const routes = {
      "dashboard": "Dashboard",
      "upload": "Upload Content",
      "notes": "Notes",
      "tests": "Tests",
      "courses": "Courses",
      "performance": "Performance",
    };

    for (const [key, title] of Object.entries(routes)) {
      if (path.includes(key)) return title;
    }
    return "Educator Panel";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-64 h-20 bg-dark-300 border-b border-dark-100 z-40 transition-all duration-300">
      <div className="h-full px-6 flex items-center justify-between gap-6">
        {/* Left: Page Title */}
        <div className="flex-shrink-0">
          <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
        </div>

        {/* Center: Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-96">
          <div className="w-full flex items-center gap-3 bg-dark-200 border border-dark-100 rounded-xl px-4 py-2 hover:border-brand-primary/50 transition-colors group">
            <Search size={16} className="text-grayCustom-medium group-hover:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm text-white placeholder-grayCustom-medium outline-none"
            />
          </div>
        </div>

        {/* Right: Icons + Profile */}
        <div className="flex items-center gap-4">
          {/* Notification Icon */}
          <button
            className="relative p-2 rounded-lg text-grayCustom-medium hover:bg-dark-200 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-dark-200 transition-colors"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                JD
              </div>
              <ChevronDown size={14} className="hidden sm:block text-grayCustom-medium" />
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-dark-200 border border-dark-100 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Profile Header */}
                <div className="px-4 py-4 border-b border-dark-100 bg-dark-100">
                  <p className="text-sm font-semibold text-white">John Doe</p>
                  <p className="text-xs text-grayCustom-medium mt-1">john@example.com</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-grayCustom-medium hover:bg-dark-100 hover:text-white flex items-center gap-3 transition-colors">
                    <User size={16} />
                    Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-grayCustom-medium hover:bg-dark-100 hover:text-white flex items-center gap-3 transition-colors">
                    <Settings size={16} />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-dark-100 p-2">
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors rounded-lg"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
