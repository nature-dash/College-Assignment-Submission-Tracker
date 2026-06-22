import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminAddUser from "./pages/admin/AddUser";
import AdminEditUser from "./pages/admin/EditUser";
import AdminPromote from "./pages/admin/Promote";
import AdminPassedOut from "./pages/admin/PassedOut";
import AdminConfig from "./pages/admin/Config";
import AdminCalendar from "./pages/admin/Calendar";
import AdminViewAssignment from "./pages/admin/ViewAssignment";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherAddAssignment from "./pages/teacher/AddAssignment";
import TeacherEditAssignment from "./pages/teacher/EditAssignment";
import TeacherViewAssignment from "./pages/teacher/ViewAssignment";
import TeacherStudents from "./pages/teacher/Students";
import TeacherStudentDetails from "./pages/teacher/StudentDetails";
import TeacherHistory from "./pages/teacher/History";
import TeacherCalendar from "./pages/teacher/Calendar";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCalendar from "./pages/student/Calendar";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    if (user.role === "admin") return <Navigate to="/admin" />;
    if (user.role === "teacher") return <Navigate to="/teacher" />;
    return <Navigate to="/student" />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/users/add" element={<ProtectedRoute role="admin"><AdminAddUser /></ProtectedRoute>} />
      <Route path="/admin/users/edit/:id" element={<ProtectedRoute role="admin"><AdminEditUser /></ProtectedRoute>} />
      <Route path="/admin/promote" element={<ProtectedRoute role="admin"><AdminPromote /></ProtectedRoute>} />
      <Route path="/admin/passedout" element={<ProtectedRoute role="admin"><AdminPassedOut /></ProtectedRoute>} />
      <Route path="/admin/config" element={<ProtectedRoute role="admin"><AdminConfig /></ProtectedRoute>} />
      <Route path="/admin/calendar" element={<ProtectedRoute role="admin"><AdminCalendar /></ProtectedRoute>} />
      <Route path="/admin/view/:id" element={<ProtectedRoute role="admin"><AdminViewAssignment /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/add" element={<ProtectedRoute role="teacher"><TeacherAddAssignment /></ProtectedRoute>} />
      <Route path="/teacher/edit/:id" element={<ProtectedRoute role="teacher"><TeacherEditAssignment /></ProtectedRoute>} />
      <Route path="/teacher/view/:id" element={<ProtectedRoute role="teacher"><TeacherViewAssignment /></ProtectedRoute>} />
      <Route path="/teacher/students" element={<ProtectedRoute role="teacher"><TeacherStudents /></ProtectedRoute>} />
      <Route path="/teacher/student/:id" element={<ProtectedRoute role="teacher"><TeacherStudentDetails /></ProtectedRoute>} />
      <Route path="/teacher/history" element={<ProtectedRoute role="teacher"><TeacherHistory /></ProtectedRoute>} />
      <Route path="/teacher/calendar" element={<ProtectedRoute role="teacher"><TeacherCalendar /></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/calendar" element={<ProtectedRoute role="student"><StudentCalendar /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}
