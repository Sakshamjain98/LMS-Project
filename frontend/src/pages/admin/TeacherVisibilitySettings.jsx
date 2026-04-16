import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Save, SlidersHorizontal, Monitor } from "lucide-react";
import {
  getTeacherFeatureSettings,
  updateTeacherFeatureSettings,
} from "../../services/adminService";
import {
  DEFAULT_TEACHER_UI_SETTINGS,
  mergeTeacherUiSettings,
} from "../../constants/teacherUiDefaults";

const visibilityItems = [
  { key: "uploadEnabled", title: "Upload Section", description: "Show or hide educator upload workflow." },
  { key: "notesEnabled", title: "Notes Section", description: "Control educator notes management visibility." },
  { key: "testsEnabled", title: "Tests Section", description: "Control educator tests and CSV upload visibility." },
];

const dashboardStatItems = [
  { key: "totalCourses", title: "Total Courses" },
  { key: "pendingApproval", title: "Pending Approval" },
  { key: "publishedCourses", title: "Published Courses" },
  { key: "totalNotes", title: "Total Notes" },
  { key: "totalTests", title: "Total Tests" },
  { key: "draftTests", title: "Draft Tests" },
  { key: "publishedTests", title: "Published Tests" },
  { key: "quickActions", title: "Quick Actions Card" },
];

const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? "bg-brand-primary" : "bg-dark-100"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

export default function TeacherVisibilitySettings() {
  const [settings, setSettings] = useState(DEFAULT_TEACHER_UI_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTeacherFeatureSettings();
        setSettings(mergeTeacherUiSettings(res.settings));
      } catch (err) {
        toast.error(err?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleVisibility = (key) => {
    setSettings((prev) => ({
      ...prev,
      teacherVisibility: {
        ...prev.teacherVisibility,
        [key]: !prev.teacherVisibility[key],
      },
    }));
  };

  const toggleStat = (key) => {
    setSettings((prev) => ({
      ...prev,
      teacherDashboardStats: {
        ...prev.teacherDashboardStats,
        [key]: !prev.teacherDashboardStats[key],
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await updateTeacherFeatureSettings(settings);
      const merged = mergeTeacherUiSettings(res.settings);
      setSettings(merged);
      localStorage.setItem("teacherUiSettings", JSON.stringify(merged));
      localStorage.setItem("teacherUiSettingsUpdatedAt", String(Date.now()));
      toast.success("Educator visibility settings updated");
    } catch (err) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-400">Loading educator settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="text-brand-primary" size={24} />
            Educator Controls
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage section visibility and dashboard stat cards for educator users.
          </p>
        </div>
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-primary text-dark-400 font-bold hover:opacity-90 transition disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-semibold text-white mb-4">Sidebar Section Visibility</h2>
          <div className="space-y-4">
            {visibilityItems.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-dark-300/60 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                </div>
                <Toggle
                  checked={settings.teacherVisibility[item.key]}
                  onChange={() => toggleVisibility(item.key)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor size={18} className="text-brand-primary" />
            Dashboard Stats Visibility
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboardStatItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-dark-300/60 border border-white/10">
                <span className="text-sm text-white">{item.title}</span>
                <Toggle
                  checked={settings.teacherDashboardStats[item.key]}
                  onChange={() => toggleStat(item.key)}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
