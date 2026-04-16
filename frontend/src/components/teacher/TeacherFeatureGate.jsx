import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getTeacherUiSettings } from "../../services/teacherService";
import { DEFAULT_TEACHER_UI_SETTINGS, mergeTeacherUiSettings } from "../../constants/teacherUiDefaults";

export default function TeacherFeatureGate({ featureKey, children }) {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "teacherUiSettingsUpdatedAt") {
        setRefreshTick((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const decide = async () => {
      try {
        const cached = localStorage.getItem("teacherUiSettings");
        const baseline = cached
          ? mergeTeacherUiSettings(JSON.parse(cached))
          : DEFAULT_TEACHER_UI_SETTINGS;

        setEnabled(!!baseline.teacherVisibility?.[featureKey]);

        const res = await getTeacherUiSettings();
        const merged = mergeTeacherUiSettings(res.settings);
        localStorage.setItem("teacherUiSettings", JSON.stringify(merged));
        setEnabled(!!merged.teacherVisibility?.[featureKey]);
      } catch {
        setEnabled(!!DEFAULT_TEACHER_UI_SETTINGS.teacherVisibility?.[featureKey]);
      } finally {
        setLoading(false);
      }
    };

    decide();
  }, [featureKey, refreshTick]);

  if (loading) {
    return <div className="p-6 text-white/70">Checking feature access...</div>;
  }

  if (!enabled) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return children;
}
