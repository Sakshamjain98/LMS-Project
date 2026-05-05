// src/components/layout/Sidebar.jsx
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  FileText,
  LogOut,
  NotepadText,
  ChevronDown,
  ChevronRight,
  PlusSquare,
  ListChecks,
  ChevronLeft,
  Menu,
  Eye,
  User,
} from "lucide-react";
import { getTeacherUiSettings } from "../../services/teacherService";
import { DEFAULT_TEACHER_UI_SETTINGS, mergeTeacherUiSettings } from "../../constants/teacherUiDefaults";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [openTests, setOpenTests] = useState(true);
  const [manualOpenUpload, setManualOpenUpload] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebarOpenUpload");
      return saved ? JSON.parse(saved) : location.pathname.includes("/teacher/upload");
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uiSettings, setUiSettings] = useState(DEFAULT_TEACHER_UI_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getTeacherUiSettings();
        const merged = mergeTeacherUiSettings(res.settings);
        setUiSettings(merged);
        localStorage.setItem("teacherUiSettings", JSON.stringify(merged));
      } catch {
        const cached = localStorage.getItem("teacherUiSettings");
        if (cached) {
          try {
            setUiSettings(mergeTeacherUiSettings(JSON.parse(cached)));
          } catch {
            setUiSettings(DEFAULT_TEACHER_UI_SETTINGS);
          }
        }
      }
    };

    loadSettings();
  }, [location.pathname]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "teacherUiSettingsUpdatedAt") {
        const cached = localStorage.getItem("teacherUiSettings");
        if (cached) {
          try {
            setUiSettings(mergeTeacherUiSettings(JSON.parse(cached)));
          } catch {
            setUiSettings(DEFAULT_TEACHER_UI_SETTINGS);
          }
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const openUpload = manualOpenUpload || location.pathname.includes("/teacher/upload");

  useEffect(() => {
    localStorage.setItem("sidebarOpenUpload", JSON.stringify(manualOpenUpload));
  }, [manualOpenUpload]);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    // Clear authentication token and user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sidebarCollapsed");
    localStorage.removeItem("sidebarOpenUpload");
    
    // Redirect to login
    navigate("/login", { replace: true });
  };

  const uploadProgress = (() => {
    try {
      const raw = localStorage.getItem("uploadFormData");
      const parsed = raw ? JSON.parse(raw) : null;
      const cs = parsed?.courseStatus || {};
      return {
        basicsCompleted: !!cs.basicsCompleted,
        curriculumCompleted: !!cs.curriculumCompleted,
      };
    } catch {
      return { basicsCompleted: false, curriculumCompleted: false };
    }
  })();

  const isUploadDisabled = (to) => {
    if (to === "/teacher/upload/basics") return false;
    if (to === "/teacher/upload/curriculum") return !uploadProgress.basicsCompleted;
    if (to === "/teacher/upload/finalize") return !uploadProgress.curriculumCompleted;
    return false;
  };

  const baseClass =
    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-sm font-medium";
  const activeClass = "bg-brand-primary text-black shadow-lg shadow-brand-primary/30";
  const inactiveClass = "text-grayCustom-medium hover:bg-dark-200 hover:text-white";

  const sidebarWidth = collapsed ? "w-20" : "w-64";
  const textHidden = collapsed ? "hidden" : "block";

  const uploadSubmenu = [
    { to: "/teacher/upload/basics", icon: <FileText size={16} />, label: "Course Basics" },
    { to: "/teacher/upload/curriculum", icon: <FileText size={16} />, label: "Curriculum" },
    { to: "/teacher/upload/finalize", icon: <ListChecks size={16} />, label: "Finalize" },
    { to: "/teacher/courses", icon: <Eye size={16} />, label: "Get All Courses" },
  ];

  const testSubmenu = [
    { to: "/teacher/tests", icon: <ListChecks size={16} />, label: "All Tests" },
    { to: "/teacher/tests/create", icon: <PlusSquare size={16} />, label: "Create Test" },
    { to: "/teacher/tests/upload-csv", icon: <Upload size={16} />, label: "Upload Test CSV" }, 
    
  ];

  const { notesEnabled, uploadEnabled, testsEnabled } = uiSettings.teacherVisibility;

  return (
    <>
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen ${sidebarWidth} bg-dark-300/80 backdrop-blur-xl flex flex-col border-r border-white/10 transition-all duration-300 z-30 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-dark-100">
          {!collapsed && (
            <span className="text-white text-lg font-bold tracking-tight">Admin Workspace</span>
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex text-grayCustom-medium hover:text-white p-1.5 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-grayCustom-medium hover:text-white"
            aria-label="Close sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Dashboard */}
          <NavLink
            to="/teacher/dashboard"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
            title={collapsed ? "Dashboard" : ""}
          >
            <span className="shrink-0 flex items-center justify-center">
              <LayoutDashboard size={18} />
            </span>
            <span className={textHidden}>Dashboard</span>
          </NavLink>

          {/* Upload Content Dropdown */}
          {uploadEnabled && (
          <div className="space-y-2">
            <button
              onClick={() => setManualOpenUpload((prev) => !prev)}
              className={`${baseClass} ${inactiveClass} justify-between`}
              title={collapsed ? "Upload Content" : ""}
            >
              <span className="flex items-center gap-3">
                <Upload size={18} />
                <span className={textHidden}>Upload Content</span>
              </span>
              {!collapsed &&
                (openUpload ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                ))}
            </button>

            {/* Upload Submenu */}
            {openUpload && (
              <div className={`${collapsed ? "ml-0" : "ml-4 border-l border-dark-100 pl-3"} space-y-2`}>
                {uploadSubmenu.map((subitem) => {
                  const disabled = isUploadDisabled(subitem.to);
                  return (
                    <NavLink
                      key={subitem.to}
                      to={subitem.to}
                      onClick={(e) => { if (disabled) e.preventDefault(); else handleNavClick(); }}
                      className={({ isActive }) =>
                        `${baseClass} text-xs ${
                          disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : (isActive ? activeClass : inactiveClass)
                        }`
                      }
                      title={collapsed ? subitem.label : disabled ? "Complete previous step to unlock" : ""}
                      aria-disabled={disabled}
                    >
                      <span className="shrink-0">{subitem.icon}</span>
                      <span className={textHidden}>{subitem.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Notes */}
          {notesEnabled && (
          <NavLink
            to="/teacher/notes"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
            title={collapsed ? "Notes" : ""}
          >
            <span className="shrink-0 flex items-center justify-center">
              <NotepadText size={18} />
            </span>
            <span className={textHidden}>Notes</span>
          </NavLink>
          )}

          {/* Tests Dropdown */}
{testsEnabled && (
<div className="space-y-2">
  <button
    onClick={() => setOpenTests((prev) => !prev)}
    className={`${baseClass} ${inactiveClass} justify-between`}
            title={collapsed ? "Test Series" : ""}
  >
    <span className="flex items-center gap-3">
      <FileText size={18} />
      <span className={textHidden}>Test Series</span>
    </span>
    {!collapsed &&
      (openTests ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronRight size={16} />
      ))}
  </button>

  {/* Test Submenu */}
  {openTests && (
    <div className={`${collapsed ? "ml-0" : "ml-4 border-l border-dark-100 pl-3"} space-y-2`}>
      {testSubmenu.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/teacher/tests"}
          onClick={handleNavClick}
          className={({ isActive }) =>
            `${baseClass} text-xs ${isActive ? activeClass : inactiveClass}`
          }
          title={collapsed ? item.label : ""}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className={textHidden}>{item.label}</span>
        </NavLink>
      ))}
    </div>
  )}
</div>
)}
        </nav>

        {/* Bottom Section - Profile & Logout */}
        <div className="border-t border-dark-100 p-3 space-y-2">
          {/* Profile Link */}
          <NavLink
            to="/teacher/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `${baseClass} ${isActive ? activeClass : inactiveClass}`
            }
            title={collapsed ? "Profile" : ""}
          >
            <User size={18} />
            <span className={textHidden}>Profile</span>
          </NavLink>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`${baseClass} text-red-400 hover:bg-red-500/10 transition-all`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={18} />
            <span className={textHidden}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-5 left-4 z-10 p-2 bg-dark-300 rounded-lg text-white hover:bg-dark-200 transition-colors"
        aria-label="Open sidebar"
      >
        <Menu size={24} />
      </button>
    </>
  );
}