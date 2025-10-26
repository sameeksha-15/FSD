import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AddEmployee from "./pages/AddEmployee";
import EmployeePortal from "./pages/EmployeePortal";
import Registration from "./pages/Registration";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import TestStyles from "./test-styles";
import PureCSS from './PureCSS';
import JobApplication from './components/JobApplication';
import SiteMonitoring from './components/SiteMonitoring';
import AdminLayout from './components/AdminLayout';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  
  // Debug output to console
  console.log("Protected Route Check:", { user, requiredRoles: roles });
  
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/" />;
  }
  
  const userRole = user.role || "";
  
  // If roles is a string, convert it to array
  const allowedRoles = typeof roles === 'string' ? [roles] : roles;
  
  if (roles && !allowedRoles.includes(userRole)) {
    console.log(`User role ${userRole} doesn't match any of required roles ${allowedRoles.join(', ')}`);
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/test-styles" element={<TestStyles />} />
      <Route path="/pure-css" element={<PureCSS />} />
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/apply" element={<JobApplication />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["Admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard view="overview" />} />
        <Route path="site-monitoring" element={<SiteMonitoring />} />
        <Route path="add-employee" element={<AddEmployee />} />
        <Route path="attendance" element={<AdminDashboard view="attendance" />} />
        <Route path="payroll" element={<AdminDashboard view="payroll" />} />
        <Route path="leave-requests" element={<AdminDashboard view="leave" />} />
      </Route>
      <Route
        path="/admin/add-employee"
        element={
          <ProtectedRoute roles={["Admin", "Manager"]}>
            <AddEmployee />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/site-monitoring"
        element={
          <ProtectedRoute roles={["Admin", "Manager", "Supervisor"]}>
            <SiteMonitoring />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute roles={["Worker", "Supervisor", "Manager", "Mason", "Carpenter", "Electrician", "Plumber", "Painter", "Helper"]}>
            <EmployeePortal />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
} 