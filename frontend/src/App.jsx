import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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

/* Upload Content Pages */
import CourseBasics from "./pages/teacher/upload/CourseBasics";
import Curriculum from "./pages/teacher/upload/Curriculum";
import Finalize from "./pages/teacher/upload/Finalize";
import Success from "./pages/teacher/upload/Success";
import UploadContextProvider from "./pages/teacher/upload/UploadContextProvider";

/* Student Pages */
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/Courses";
import StudentNotes from "./pages/student/Notes";
import StudentTests from "./pages/student/Tests";
import StudentPerformance from "./pages/student/Performance";
import CourseDetailStudent from "./pages/student/CourseDetail";
import StudentProfile from "./pages/student/StudentProfile";

/* Layouts */
import DashboardLayout from "./components/layout/DashboardLayout";
import StudentLayout from "./pages/student/StudentLayout";

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
        <Route path="/teacher/upload/basics" element={<UploadContextProvider><DashboardLayout><CourseBasics /></DashboardLayout></UploadContextProvider>} />
        <Route path="/teacher/upload/curriculum" element={<UploadContextProvider><DashboardLayout><Curriculum /></DashboardLayout></UploadContextProvider>} />
        <Route path="/teacher/upload/finalize" element={<UploadContextProvider><DashboardLayout><Finalize /></DashboardLayout></UploadContextProvider>} />
        <Route path="/teacher/upload/success" element={<UploadContextProvider><DashboardLayout><Success /></DashboardLayout></UploadContextProvider>} />

        {/* Add Section to Existing Course */}
        <Route path="/teacher/courses/:courseId/add-section" element={<UploadContextProvider><DashboardLayout><Curriculum /></DashboardLayout></UploadContextProvider>} />

        {/* Notes */}
        <Route path="/teacher/notes" element={<DashboardLayout><Notes /></DashboardLayout>} />

        {/* Tests */}
        <Route path="/teacher/tests" element={<DashboardLayout><Tests /></DashboardLayout>} />
        <Route path="/teacher/tests/create" element={<DashboardLayout><CreateTest /></DashboardLayout>} />
        <Route path="/teacher/tests/:id" element={<DashboardLayout><TestDetails /></DashboardLayout>} />
        <Route path="/teacher/tests/:id/analytics" element={<DashboardLayout><TestAnalytics /></DashboardLayout>} />
        <Route path="/teacher/tests/analytics" element={<DashboardLayout><TestAnalyticsOverview /></DashboardLayout>} />
        <Route path="/teacher/tests/:id/questions/add" element={<DashboardLayout><AddQuestion /></DashboardLayout>} />
        <Route path="/teacher/questions/:questionId/analytics" element={<DashboardLayout><QuestionAnalytics /></DashboardLayout>} />

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

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;