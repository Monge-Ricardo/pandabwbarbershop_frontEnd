import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
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

  // Double check role path guards if needed
  if (role !== 'customer' && window.location.pathname.startsWith('/customer')) {
    // If logged in but not customer, redirect based on their role
    if (role === 'barber') return <Navigate to="/barber/dashboard" replace />;
    if (role === 'owner') return <Navigate to="/owner/dashboard" replace />;
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

          {/* Mock placeholders for teammates modules so routing doesn't break */}
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
                <div className="min-h-screen bg-obsidian flex flex-col justify-center items-center text-center p-6 border border-border-color">
                  <h1 className="text-gold text-4xl font-heading mb-4">Dashboard del Propietario</h1>
                  <p className="text-text-muted max-w-md">Este es el Módulo 3, reservado para tus compañeros. La sesión actual de Propietario funciona correctamente.</p>
                  <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="btn btn-outline mt-6">Cerrar Sesión</button>
                </div>
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
