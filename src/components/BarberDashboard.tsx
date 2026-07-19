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

  // Onboarding States
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const name = localStorage.getItem("user_name") || "Barbero";
    const email = localStorage.getItem("user_email") || "";
    const id = localStorage.getItem("user_id") || "";
    setBarberName(name);
    setBarberEmail(email);
    setUserId(id);

    if (id) {
      const completed = localStorage.getItem(`onboarding_completed_${id}`) === "true";
      setOnboardingCompleted(completed);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    localStorage.removeItem('session_created_at');
    clearApiCache();
    window.location.href = "/login";
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(barberName)}&background=D4AF37&color=000`;

  if (!onboardingCompleted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-main)', padding: '2rem' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div className="text-center mb-5 mt-4">
            <img 
              src="/img/BarberShop_PandaBlackAndWhite.png" 
              alt="PANDA Logo" 
              style={{ height: '64px', marginBottom: '15px' }} 
            />
            <h2 className="text-white font-heading text-uppercase" style={{ letterSpacing: '1px' }}>
              ¡Bienvenido al Equipo, {barberName}!
            </h2>
            <p className="text-muted">
              Configuremos tu perfil en 3 pasos rápidos antes de comenzar a recibir citas.
            </p>
          </div>

          {/* Stepper progress indicator */}
          <div className="wizard-container mb-5 p-4" style={{ position: 'relative' }}>
            <div className="wizard-steps m-0" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div className={`step-indicator ${onboardingStep === 1 ? 'active' : ''} ${onboardingStep > 1 ? 'completed' : ''}`}>1</div>
              <div className={`step-indicator ${onboardingStep === 2 ? 'active' : ''} ${onboardingStep > 2 ? 'completed' : ''}`}>2</div>
              <div className={`step-indicator ${onboardingStep === 3 ? 'active' : ''} ${onboardingStep > 3 ? 'completed' : ''}`}>3</div>
            </div>
            <div className="d-flex justify-content-between text-muted mt-3 px-1" style={{ fontSize: '0.85rem' }}>
              <span className={onboardingStep === 1 ? 'text-gold font-weight-bold' : ''}>1. Tu Disponibilidad</span>
              <span className={onboardingStep === 2 ? 'text-gold font-weight-bold' : ''}>2. Tus Servicios</span>
              <span className={onboardingStep === 3 ? 'text-gold font-weight-bold' : ''}>3. Tus Productos</span>
            </div>
          </div>

          {/* Step content */}
          <div className="onboarding-step-content mb-4 bg-dark p-4 rounded-3 border border-secondary">
            {onboardingStep === 1 && (
              <div>
                <h4 className="text-white mb-3 text-start"><i className="fa-solid fa-clock text-gold me-2"></i> Configura tu Horario de Trabajo</h4>
                <p className="text-muted text-start mb-4">Establece los días de la semana y horas en las que estarás disponible para recibir reservas de clientes.</p>
                <BarberAvailability />
              </div>
            )}
            {onboardingStep === 2 && (
              <div>
                <h4 className="text-white mb-3 text-start"><i className="fa-solid fa-list-check text-gold me-2"></i> Configura los Servicios que Ofreces</h4>
                <p className="text-muted text-start mb-4">Agrega los cortes, afeitados, peinados y demás tratamientos que realizas con sus respectivos precios y duraciones.</p>
                <BarberServices />
              </div>
            )}
            {onboardingStep === 3 && (
              <div>
                <h4 className="text-white mb-3 text-start"><i className="fa-solid fa-box-open text-gold me-2"></i> Configura tus Productos de Venta (Opcional)</h4>
                <p className="text-muted text-start mb-4">Revisa tu catálogo y añade productos adicionales para la venta directa.</p>
                <BarberInventory />
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="d-flex justify-content-between align-items-center mt-5 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            {onboardingStep === 1 ? (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleLogout}
              >
                Cancelar y Salir <i className="fa-solid fa-arrow-right-from-bracket ms-2"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary text-white"
                onClick={() => setOnboardingStep(prev => Math.max(1, prev - 1))}
              >
                <i className="fa-solid fa-arrow-left me-2"></i> Atrás
              </button>
            )}

            {onboardingStep < 3 ? (
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => setOnboardingStep(prev => prev + 1)}
              >
                Siguiente Paso <i className="fa-solid fa-arrow-right ms-2"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => {
                  if (userId) {
                    localStorage.setItem(`onboarding_completed_${userId}`, "true");
                  }
                  setOnboardingCompleted(true);
                  setActiveTab("agenda");
                }}
              >
                Finalizar y Entrar al Dashboard <i className="fa-solid fa-circle-check ms-2"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
