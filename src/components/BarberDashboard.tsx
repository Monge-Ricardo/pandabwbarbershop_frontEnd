import { useState, useEffect } from "react";
import BarberAgenda from "./BarberAgenda";
import BarberServices from "./BarberServices";
import BarberInventory from "./BarberInventory";
import BarberAvailability from "./BarberAvailability";
import { clearApiCache } from "../api/api";

export default function BarberDashboard() {
  const [activeTab, setActiveTab] = useState<string>("agenda");
  const [barberName, setBarberName] = useState<string>("Barbero");
  const [barberEmail, setBarberEmail] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("user_name") || "Barbero";
    const email = localStorage.getItem("user_email") || "";
    setBarberName(name);
    setBarberEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    clearApiCache();
    window.location.href = "/login";
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(barberName)}&background=D4AF37&color=000`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}>
      {/* Mobile Sidebar Toggle */}
      <button
        className="sidebar-toggle"
        aria-label="Abrir o cerrar menú lateral"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* Sidebar - Negro y Oro unificado */}
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          <div className="brand-text">
            <i className="fa-solid fa-scissors"></i> SHARKHUB
          </div>

          <div className="nav flex-column gap-1">
            <button
              onClick={() => { setActiveTab("agenda"); setIsSidebarOpen(false); }}
              className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'agenda' ? 'active' : ''}`}
            >
              <i className="fa-regular fa-calendar-days"></i>
              Mi Agenda
            </button>

            <button
              onClick={() => { setActiveTab("services"); setIsSidebarOpen(false); }}
              className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'services' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-list-check"></i>
              Mis Servicios
            </button>

            <button
              onClick={() => { setActiveTab("products"); setIsSidebarOpen(false); }}
              className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'products' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-box-open"></i>
              Mis Productos
            </button>

            <button
              onClick={() => { setActiveTab("availability"); setIsSidebarOpen(false); }}
              className={`nav-link text-start bg-transparent border-0 w-100 ${activeTab === 'availability' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-clock"></i>
              Disponibilidad
            </button>
          </div>
        </div>

        <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
          <div className="user-profile mb-3">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="avatar"
            />
            <div style={{ overflow: "hidden" }} className="text-start">
              <h6 className="mb-0 text-truncate" style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "bold" }}>{barberName}</h6>
              <small className="text-muted text-truncate d-block" style={{ fontSize: "12px" }}>{barberEmail}</small>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-link text-start bg-transparent border-0 w-100 logout-mt">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="page-header">
          <div>
            <h2>Panel del Barbero</h2>
            <p className="text-muted mb-0 text-start">
              {activeTab === 'agenda' && 'Visualiza y gestiona tu agenda diaria de citas.'}
              {activeTab === 'services' && 'Administra los servicios de barbería que ofreces.'}
              {activeTab === 'products' && 'Revisa el inventario y catálogo de productos disponibles.'}
              {activeTab === 'availability' && 'Configura tus horarios y días de disponibilidad laboral.'}
            </p>
          </div>
          <div className="user-profile">
            <div className="text-end d-none d-sm-block text-start">
              <h6 className="mb-0">{barberName}</h6>
              <small className="text-muted">Barbero</small>
            </div>
            <img 
              src={avatarUrl} 
              alt="Barbero" 
              className="avatar" 
            />
          </div>
        </header>

        <section className="content-section active text-start">
          {activeTab === "agenda" && <BarberAgenda />}
          {activeTab === "services" && <BarberServices />}
          {activeTab === "products" && <BarberInventory />}
          {activeTab === "availability" && <BarberAvailability />}
        </section>
      </main>
    </div>
  );
}
