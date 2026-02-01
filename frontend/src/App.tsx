import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import './index.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement; role?: 'admin' | 'user' }> = ({ children, role }) => {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return children;
};

// Public Route Component (redirects if already logged in)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, token } = useAuth();

  if (token && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/user/dashboard" element={
        <ProtectedRoute role="user">
          <UserDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserProfile />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
