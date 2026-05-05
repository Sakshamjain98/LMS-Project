import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* Public Pages */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Home from "./pages/public/Home";
import ArticleDetail from "./pages/public/ArticleDetail";

/* Student Pages */
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentTests from "./pages/student/StudentTest";
import StudentSeriesDetail from "./pages/student/SeriesDetail";
import StudentProfile from "./pages/student/StudentProfile";

/* Layouts */
import StudentLayout from "./pages/student/StudentLayout";
import AdminLayout from "./pages/admin/AdminLayout";

/* Admin Pages */
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Payments from "./pages/admin/Payments";
import News from "./pages/admin/News";
import Blogs from "./pages/admin/Blog";
import CreateAdmin from "./pages/admin/CreateAdmin";
import AdminProfile from "./pages/admin/Profile";
import AdminTestSeries from "./pages/admin/TestSeries";
import AdminTestEditor from "./pages/admin/TestEditor";
import AdminSiteContent from "./pages/admin/SiteContent";
import AdminBlogEditor from "./pages/admin/BlogEditor";

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  if (!token || userRole !== "admin") return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/articles/:id" element={<ArticleDetail />} />

        {/* Legacy redirects — old links should still resolve */}
        <Route path="/teacher/*" element={<Navigate to="/admin/test-series" replace />} />
        <Route path="/student/courses/*" element={<Navigate to="/student/tests" replace />} />
        <Route path="/student/notes" element={<Navigate to="/student/tests" replace />} />
        <Route path="/student/performance" element={<Navigate to="/student/dashboard" replace />} />

        {/* Student */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="tests/:topicId" element={<StudentSeriesDetail />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="payments" element={<Payments />} />
          <Route path="news" element={<News />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="blogs/new" element={<AdminBlogEditor />} />
          <Route path="blogs/:id/edit" element={<AdminBlogEditor />} />
          <Route path="test-series" element={<AdminTestSeries />} />
          <Route path="test-series/test/:testId" element={<AdminTestEditor />} />
          <Route path="site-content" element={<AdminSiteContent />} />
          <Route path="create-admin" element={<CreateAdmin />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
