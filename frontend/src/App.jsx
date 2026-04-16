import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* Public Pages */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Home from "./pages/public/Home";

/* Teacher Pages */
import TeacherDashboard from "./pages/teacher/Dashboard";
import Courses from "./pages/teacher/Courses";
import CourseDetail from "./pages/teacher/CourseDetail";
import Notes from "./pages/teacher/Notes";
import Tests from "./pages/teacher/Tests";
import CreateTest from "./pages/teacher/CreateTest";
import TestDetails from "./pages/teacher/TestDetails";
import TestAnalytics from "./pages/teacher/TestAnalytics";
import TestAnalyticsOverview from "./pages/teacher/TestAnalyticsOverview";
import QuestionAnalytics from "./pages/teacher/QuestionAnalytics";
import AddQuestion from "./pages/teacher/AddQuestion";
import EditCourseCurriculum from "./pages/teacher/EditCourseCurriculum";
import TeacherProfile from "./pages/teacher/Profile";

/* Upload Content Pages */
import CourseBasics from "./pages/teacher/upload/CourseBasics";
import Curriculum from "./pages/teacher/upload/Curriculum";
import Finalize from "./pages/teacher/upload/Finalize";
import Success from "./pages/teacher/upload/Success";
import UploadContextProvider from "./pages/teacher/upload/UploadContextProvider";
import TeacherFeatureGate from "./components/teacher/TeacherFeatureGate";

/* Student Pages */
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/Courses";
import StudentNotes from "./pages/student/Notes";
import StudentTests from "./pages/student/StudentTest";
import StudentPerformance from "./pages/student/Performance";
import CourseDetailStudent from "./pages/student/CourseDetail";
import StudentProfile from "./pages/student/StudentProfile";

/* Layouts */
import DashboardLayout from "./components/layout/DashboardLayout";
import StudentLayout from "./pages/student/StudentLayout";
import AdminLayout from "./pages/admin/AdminLayout";

/* Admin Pages */
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import PendingContent from "./pages/admin/PendingContent";
import Payments from "./pages/admin/Payments";
import News from "./pages/admin/News";

import TeacherApproval from "./pages/admin/TeacherApproval";

import Analytics from "./pages/admin/Analytics";
import Blogs from "./pages/admin/Blog";
import CreateAdmin from "./pages/admin/CreateAdmin"
import TeacherVisibilitySettings from "./pages/admin/TeacherVisibilitySettings";
import AdminProfile from "./pages/admin/Profile";
import UploadTestCsv from "./pages/teacher/UploadTestCsv"

// Simple admin route guard using localStorage
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token || userRole !== "admin") {
    return <Navigate to="/login" replace />;
  }
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

        {/* Teacher Dashboard */}
        <Route path="/teacher/dashboard" element={<DashboardLayout><TeacherDashboard /></DashboardLayout>} />

        {/* Teacher Courses */}
        <Route path="/teacher/courses" element={<DashboardLayout><Courses /></DashboardLayout>} />
        <Route path="/teacher/courses/:courseId" element={<DashboardLayout><CourseDetail /></DashboardLayout>} />
        <Route path="/teacher/courses/:courseId/edit-curriculum" element={<UploadContextProvider><DashboardLayout><EditCourseCurriculum /></DashboardLayout></UploadContextProvider>} />

        {/* Upload Content */}
        <Route path="/teacher/upload/basics" element={<TeacherFeatureGate featureKey="uploadEnabled"><UploadContextProvider><DashboardLayout><CourseBasics /></DashboardLayout></UploadContextProvider></TeacherFeatureGate>} />
        <Route path="/teacher/upload/curriculum" element={<TeacherFeatureGate featureKey="uploadEnabled"><UploadContextProvider><DashboardLayout><Curriculum /></DashboardLayout></UploadContextProvider></TeacherFeatureGate>} />
        <Route path="/teacher/upload/finalize" element={<TeacherFeatureGate featureKey="uploadEnabled"><UploadContextProvider><DashboardLayout><Finalize /></DashboardLayout></UploadContextProvider></TeacherFeatureGate>} />
        <Route path="/teacher/upload/success" element={<TeacherFeatureGate featureKey="uploadEnabled"><UploadContextProvider><DashboardLayout><Success /></DashboardLayout></UploadContextProvider></TeacherFeatureGate>} />

        {/* Add Section to Existing Course */}
        <Route path="/teacher/courses/:courseId/add-section" element={<TeacherFeatureGate featureKey="uploadEnabled"><UploadContextProvider><DashboardLayout><Curriculum /></DashboardLayout></UploadContextProvider></TeacherFeatureGate>} />

        {/* Notes */}
        <Route path="/teacher/notes" element={<TeacherFeatureGate featureKey="notesEnabled"><DashboardLayout><Notes /></DashboardLayout></TeacherFeatureGate>} />

        {/* Teacher Profile */}
        <Route path="/teacher/profile" element={<DashboardLayout><TeacherProfile /></DashboardLayout>} />

        {/* Tests */}
        <Route path="/teacher/tests" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><Tests /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/create" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><CreateTest /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/:id" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><TestDetails /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/:id/analytics" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><TestAnalytics /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/analytics" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><TestAnalyticsOverview /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/:id/questions/add" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><AddQuestion /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/questions/:questionId/analytics" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><QuestionAnalytics /></DashboardLayout></TeacherFeatureGate>} />
        <Route path="/teacher/tests/upload-csv" element={<TeacherFeatureGate featureKey="testsEnabled"><DashboardLayout><UploadTestCsv/></DashboardLayout></TeacherFeatureGate>} />




        {/* Student */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:courseId" element={<CourseDetailStudent />} />
          <Route path="notes" element={<StudentNotes />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="performance" element={<StudentPerformance />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Admin - Protected */}
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
          <Route path="pending-content" element={<PendingContent />} />
          <Route path="teachers" element={<TeacherApproval />} />
          <Route path="payments" element={<Payments />} />
          <Route path="news" element={<News />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="blogs" element={<Blogs/>}/>
          <Route path="profile" element={<AdminProfile />} />
          <Route path="create-admin" element={<CreateAdmin />} />
          <Route path="educator-controls" element={<TeacherVisibilitySettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;