import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import BarberDashboard from './components/BarberDashboard';

// Environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Protected Route Guard
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const path = window.location.pathname;

  if (path.startsWith('/customer') && role !== 'customer') {
    if (role === 'barber') return <Navigate to="/barber/dashboard" replace />;
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (path.startsWith('/owner') && role !== 'owner') {
    if (role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (role === 'barber') return <Navigate to="/barber/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  if (path.startsWith('/barber') && role !== 'barber') {
    if (role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Guard (prevents logged in users from visiting login/register)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  if (token) {
    if (role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (role === 'barber') return <Navigate to="/barber/dashboard" replace />;
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Public Landing Pages */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Info routes mapping directly to LandingPage sections (handled by React Router / Scroll or simply Landing) */}
          <Route path="/about" element={<LandingPage />} />
          <Route path="/service" element={<LandingPage />} />
          <Route path="/price" element={<LandingPage />} />
          <Route path="/team" element={<LandingPage />} />
          <Route path="/open" element={<LandingPage />} />
          <Route path="/contact" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          {/* Customer Dashboard Protected Route */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Support tab URLs from legacy route mappings */}
          <Route
            path="/customer/dashboard/my-appointments"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard/book-appointment"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/dashboard/profile"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Barber Dashboard Protected Route */}
          <Route 
            path="/barber/dashboard" 
            element={
              <ProtectedRoute>
                <BarberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}
