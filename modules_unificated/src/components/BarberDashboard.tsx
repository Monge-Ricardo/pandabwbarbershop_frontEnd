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

  useEffect(() => {
    const name = localStorage.getItem("user_name") || "Barbero";
    const email = localStorage.getItem("user_email") || "";
    setBarberName(name);
    setBarberEmail(email);
  }, []);

  const handleLogout = () => {
    clearApiCache();
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fff", fontFamily: "'Roboto', sans-serif" }}>
      {/* Sidebar - Negro y Oro */}
      <nav className="p-4 d-flex flex-column justify-content-between" style={{ width: "280px", backgroundColor: "#161615", borderRight: "1px solid #D4AF37" }}>
        <div>
          <div className="text-center mb-5">
            <h3 className="text-uppercase" style={{ fontFamily: "'Oswald', sans-serif", color: "#D4AF37", letterSpacing: "2px" }}>
              <i className="fa-solid fa-scissors me-2"></i>SHARKHUB
            </h3>
            <small className="text-muted text-uppercase" style={{ fontSize: "10px", letterSpacing: "1px" }}>Panel del Barbero</small>
          </div>

          <div className="nav flex-column gap-2">
            <button
              onClick={() => setActiveTab("agenda")}
              className="btn w-100 text-start text-white border-0 py-2 px-3 d-flex align-items-center gap-3"
              style={{
                backgroundColor: activeTab === "agenda" ? "#D4AF37" : "transparent",
                color: activeTab === "agenda" ? "#000" : "#fff",
                fontWeight: activeTab === "agenda" ? "600" : "400",
                borderRadius: "4px"
              }}
            >
              <i className="fa-regular fa-calendar-days" style={{ color: activeTab === "agenda" ? "#000" : "#D4AF37" }}></i>
              Mi Agenda
            </button>

            <button
              onClick={() => setActiveTab("services")}
              className="btn w-100 text-start text-white border-0 py-2 px-3 d-flex align-items-center gap-3"
              style={{
                backgroundColor: activeTab === "services" ? "#D4AF37" : "transparent",
                color: activeTab === "services" ? "#000" : "#fff",
                fontWeight: activeTab === "services" ? "600" : "400",
                borderRadius: "4px"
              }}
            >
              <i className="fa-solid fa-list-check" style={{ color: activeTab === "services" ? "#000" : "#D4AF37" }}></i>
              Mis Servicios
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className="btn w-100 text-start text-white border-0 py-2 px-3 d-flex align-items-center gap-3"
              style={{
                backgroundColor: activeTab === "products" ? "#D4AF37" : "transparent",
                color: activeTab === "products" ? "#000" : "#fff",
                fontWeight: activeTab === "products" ? "600" : "400",
                borderRadius: "4px"
              }}
            >
              <i className="fa-solid fa-box-open" style={{ color: activeTab === "products" ? "#000" : "#D4AF37" }}></i>
              Mis Productos
            </button>

            <button
              onClick={() => setActiveTab("availability")}
              className="btn w-100 text-start text-white border-0 py-2 px-3 d-flex align-items-center gap-3"
              style={{
                backgroundColor: activeTab === "availability" ? "#D4AF37" : "transparent",
                color: activeTab === "availability" ? "#000" : "#fff",
                fontWeight: activeTab === "availability" ? "600" : "400",
                borderRadius: "4px"
              }}
            >
              <i className="fa-solid fa-clock" style={{ color: activeTab === "availability" ? "#000" : "#D4AF37" }}></i>
              Disponibilidad
            </button>
          </div>
        </div>

        <div>
          <div className="d-flex align-items-center gap-3 mb-4 p-2" style={{ borderTop: "1px solid #333", paddingTop: "15px" }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(barberName)}&background=D4AF37&color=000`}
              alt="Avatar"
              className="rounded-circle"
              style={{ width: "40px", height: "40px", border: "1px solid #D4AF37" }}
            />
            <div style={{ overflow: "hidden" }}>
              <h6 className="mb-0 text-truncate" style={{ fontSize: "14px", color: "#fff" }}>{barberName}</h6>
              <small className="text-muted text-truncate d-block" style={{ fontSize: "12px" }}>{barberEmail}</small>
            </div>
          </div>
          <button onClick={handleLogout} className="btn w-100 btn-outline-danger border-0 d-flex align-items-center gap-3 py-2 px-3">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow-1 p-5" style={{ overflowY: "auto" }}>
        {activeTab === "agenda" && <BarberAgenda />}
        {activeTab === "services" && <BarberServices />}
        {activeTab === "products" && <BarberInventory />}
        {activeTab === "availability" && <BarberAvailability />}
      </main>
    </div>
  );
}
