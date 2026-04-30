import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getTeacherUiSettings } from "../../services/teacherService";
import { DEFAULT_TEACHER_UI_SETTINGS, mergeTeacherUiSettings } from "../../constants/teacherUiDefaults";

export default function TeacherFeatureGate({ featureKey, children }) {
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
      }
    };

    decide();
  }, [featureKey, refreshTick]);

  // Do not block rendering while fetching feature flags; optimistically render children.
  // If the feature is later determined to be disabled, the component will redirect.

  if (!enabled) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return children;
}
