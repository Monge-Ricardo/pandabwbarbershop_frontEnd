import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import OwnerDashboard from './components/owner/OwnerDashboard';
import './App.css';

function ProtectedOwnerRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/owner/access-required" replace />;
  }

  if (role && role !== 'owner') {
    return <Navigate to="/owner/access-denied" replace />;
  }

  return <>{children}</>;
}

function AccessRequired() {
  return (
    <div className="min-h-screen bg-obsidian d-flex justify-content-center align-items-center text-center p-4">
      <div className="panel-card" style={{ maxWidth: 620 }}>
        <h1 className="text-gold mb-3">Módulo Owner</h1>
        <p className="text-muted mb-4">
          Este módulo trabaja de forma separada y utiliza el token JWT guardado en localStorage.
          Primero inicia sesión desde el módulo principal y luego entra a <strong>/owner/dashboard</strong>.
        </p>
        <button className="btn btn-gold" onClick={() => { window.location.href = '/owner/dashboard'; }}>
          Reintentar acceso
        </button>
      </div>
    </div>
  );
}

function AccessDenied() {
  const role = localStorage.getItem('user_role') || 'sin rol';
  return (
    <div className="min-h-screen bg-obsidian d-flex justify-content-center align-items-center text-center p-4">
      <div className="panel-card" style={{ maxWidth: 620 }}>
        <h1 className="text-gold mb-3">Acceso no permitido</h1>
        <p className="text-muted mb-4">
          La sesión actual tiene rol <strong>{role}</strong>. Para entrar a este módulo, el rol guardado debe ser <strong>owner</strong>.
        </p>
        <button className="btn btn-outline-gold" onClick={() => { localStorage.clear(); window.location.href = '/owner/access-required'; }}>
          Limpiar sesión local
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/owner/access-required" element={<AccessRequired />} />
        <Route path="/owner/access-denied" element={<AccessDenied />} />
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedOwnerRoute>
              <OwnerDashboard />
            </ProtectedOwnerRoute>
          }
        />
        <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
