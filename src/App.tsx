import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import DeputyDashboard from './pages/DeputyDashboard';
import Dashboard from './pages/Dashboard';
import { ROLES } from './utils/roles';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-center" autoClose={5000} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.GURU_PIKET, ROLES.WAKIL]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute allowedRoles={[ROLES.GURU_PIKET]}>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/deputy"
            element={
              <PrivateRoute allowedRoles={[ROLES.WAKIL]}>
                <DeputyDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;