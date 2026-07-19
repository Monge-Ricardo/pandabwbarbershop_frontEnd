import { useState, useEffect } from "react";
import { request } from "../api/api";

interface Appointment {
  id: string | number;
  appointment_id: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  status: string;
  client?: {
    name?: string;
  };
}

export default function BarberAgenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [filterDate, setFilterDate] = useState<string>(getTodayDateString());

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await request("GET", `/appointments?appointment_date=${filterDate}`);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron cargar las citas de la agenda.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterDate]);

  const handleUpdateStatus = async (appointmentId: string | number, newStatus: string) => {
    try {
      await request("PUT", `/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointments();
    } catch (err: any) {
      console.error(err);
      alert("Error al actualizar el estado de la cita: " + err.message);
    }
  };

  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const confirmedCount = appointments.filter(a => a.status === "confirmed" || a.status === "accepted").length;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" }}>Mi Agenda</h2>
          <p className="text-muted mb-0">Controla tus horarios y las citas asignadas para cada jornada.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="dateFilter" className="mb-0 text-muted" style={{ fontSize: "14px" }}>Fecha:</label>
          <input
            id="dateFilter"
            type="date"
            className="form-control"
            style={{
              backgroundColor: "#161615",
              color: "#fff",
              border: "1px solid #D4AF37",
              borderRadius: "4px"
            }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#161615", borderRadius: "8px", borderLeft: "4px solid #D4AF37" }}>
            <div>
              <h3 className="mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{totalCount}</h3>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Total Citas del Día</p>
            </div>
            <i className="fa-regular fa-calendar text-muted fs-3"></i>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#161615", borderRadius: "8px", borderLeft: "4px solid #ffc107" }}>
            <div>
              <h3 className="mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{pendingCount}</h3>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Pendientes de Aceptar</p>
            </div>
            <i className="fa-solid fa-hourglass-half text-warning fs-3"></i>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: "#161615", borderRadius: "8px", borderLeft: "4px solid #198754" }}>
            <div>
              <h3 className="mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{confirmedCount}</h3>
              <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Citas Confirmadas</p>
            </div>
            <i className="fa-solid fa-circle-check text-success fs-3"></i>
          </div>
        </div>
      </div>

      <div className="panel-card mt-4">
        {error && <div className="alert alert-danger" style={{ backgroundColor: "#2c0e0e", borderColor: "#7a1a1a", color: "#ff8888" }}>{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Cargando citas...</span>
            </div>
            <p className="text-muted mt-3 mb-0">Cargando agenda de citas...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-regular fa-calendar-xmark fs-2 mb-3 d-block" style={{ color: "#D4AF37" }}></i>
            No tienes citas agendadas para el {filterDate}.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dashboard table-hover mb-0">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Notas / Comentarios</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.appointment_id} className="align-middle">
                    <td className="fw-bold" style={{ color: "#fff" }}>
                      {appointment.start_time ? appointment.start_time.substring(0, 5) : "--:--"} - {appointment.end_time ? appointment.end_time.substring(0, 5) : "--:--"}
                    </td>
                    <td>{appointment.client?.name || "Cliente"}</td>
                    <td className="text-muted" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {appointment.notes || "Sin especificaciones"}
                    </td>
                    <td>
                      <span className={`badge px-3 py-2 text-uppercase`} style={{
                        backgroundColor: 
                          appointment.status === "pending" ? "#ffc10722" : 
                          (appointment.status === "confirmed" || appointment.status === "accepted") ? "#19875422" : "#dc354522",
                        color: 
                          appointment.status === "pending" ? "#ffc107" : 
                          (appointment.status === "confirmed" || appointment.status === "accepted") ? "#198754" : "#dc3545",
                        border: `1px solid ${
                          appointment.status === "pending" ? "#ffc107" : 
                          (appointment.status === "confirmed" || appointment.status === "accepted") ? "#198754" : "#dc3545"
                        }`
                      }}>
                        {appointment.status === "accepted" ? "confirmada" : appointment.status}
                      </span>
                    </td>
                    <td className="text-end">
                      {appointment.status === "pending" && (
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(appointment.appointment_id, "confirmed")}
                            className="btn btn-sm btn-success px-3"
                          >
                            <i className="fa-solid fa-check me-1"></i> Aceptar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appointment.appointment_id, "cancelled")}
                            className="btn btn-sm btn-outline-danger px-3"
                          >
                            <i className="fa-solid fa-xmark me-1"></i> Rechazar
                          </button>
                        </div>
                      )}
                      {(appointment.status === "confirmed" || appointment.status === "accepted") && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.appointment_id, "cancelled")}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <i className="fa-solid fa-ban me-1"></i> Cancelar Cita
                        </button>
                      )}
                      {(appointment.status === "cancelled" || appointment.status === "rejected") && (
                        <span className="text-muted small">Finalizada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
