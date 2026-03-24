import { Routes, Route } from "react-router-dom";

// layouts
import PublicLayout from "../components/layout/PublicLayout.jsx"
import DashboardLayout from "../components/layout/DashboardLayout";

// pages
import Home from "../pages/public/Home";
import Blogs from "../pages/public/Blogs";
import Courses from "../pages/public/Courses";

import TeacherDashboard from "../pages/teacher/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC ROUTES */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />

      <Route
        path="/blogs"
        element={
          <PublicLayout>
            <Blogs />
          </PublicLayout>
        }
      />

      <Route
        path="/courses"
        element={
          <PublicLayout>
            <Courses />
          </PublicLayout>
        }
      />

      {/* DASHBOARD ROUTES */}
      <Route
        path="/teacher/dashboard"
        element={
          <DashboardLayout>
            <TeacherDashboard />
          </DashboardLayout>
        }
      />

    </Routes>
  );
}