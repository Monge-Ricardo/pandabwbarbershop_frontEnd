import { useState } from "react";
import type { FormEvent } from "react";
import { request } from "../api/api";

const DAYS_OF_WEEK = [
  { label: "Lunes", dayNum: 1 },
  { label: "Martes", dayNum: 2 },
  { label: "Miércoles", dayNum: 3 },
  { label: "Jueves", dayNum: 4 },
  { label: "Viernes", dayNum: 5 },
  { label: "Sábado", dayNum: 6 },
  { label: "Domingo", dayNum: 7 },
];

interface DaySchedule {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export default function BarberAvailability() {
  const [loading, setLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const barberId = localStorage.getItem("user_id") || "1";
  const barbershopId = localStorage.getItem("barbershop_id") || "bf338534-365a-4d8d-b45d-1e961e182467";

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(
    DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day.dayNum] = {
        isAvailable: true,
        startTime: "09:00",
        endTime: "18:00",
      };
      return acc;
    }, {} as Record<number, DaySchedule>)
  );

  const handleCheckboxChange = (dayNum: number) => {
    setSchedule((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        isAvailable: !prev[dayNum].isAvailable,
      },
    }));
  };

  const handleTimeChange = (dayNum: number, field: "startTime" | "endTime", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      for (const day of DAYS_OF_WEEK) {
        const config = schedule[day.dayNum];
        
        const payload = {
          barbershop_id: barbershopId,
          day_of_week: day.dayNum,
          start_time: config.startTime,
          end_time: config.endTime,
          is_available: config.isAvailable,
        };

        await request("POST", `/barbers/${barberId}/availabilities`, payload);
      }

      setSuccessMessage("¡Tu horario de disponibilidad ha sido actualizado con éxito!");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Ocurrió un error al intentar guardar tu disponibilidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" }}>Mi Disponibilidad</h2>
        <p className="text-muted mb-0">Define los días y rangos horarios en los que estarás disponible para recibir reservas.</p>
      </div>

      <div className="p-4" style={{ backgroundColor: "#161615", borderRadius: "8px", border: "1px solid #333" }}>
        {successMessage && <div className="alert alert-success py-2 mb-4" style={{ backgroundColor: "#0f2c1b", borderColor: "#1a7a40", color: "#88ffb8" }}>{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger py-2 mb-4" style={{ backgroundColor: "#2c0e0e", borderColor: "#7a1a1a", color: "#ff8888" }}>{errorMessage}</div>}

        <form onSubmit={handleSave}>
          <div className="d-flex flex-column gap-3 mb-4">
            {DAYS_OF_WEEK.map((day) => {
              const config = schedule[day.dayNum];
              return (
                <div
                  key={day.dayNum}
                  className="d-flex align-items-center justify-content-between p-3 flex-wrap gap-3"
                  style={{
                    backgroundColor: config.isAvailable ? "#1c1c1a" : "#0d0d0c",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    transition: "0.2s"
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`switch-${day.dayNum}`}
                        checked={config.isAvailable}
                        onChange={() => handleCheckboxChange(day.dayNum)}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                    <label
                      htmlFor={`switch-${day.dayNum}`}
                      className="fw-bold mb-0 text-uppercase"
                      style={{
                        color: config.isAvailable ? "#fff" : "#555",
                        cursor: "pointer",
                        width: "100px",
                        fontSize: "14px",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {day.label}
                    </label>
                  </div>

                  {config.isAvailable ? (
                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <span className="text-muted d-block small mb-1">Hora Inicio</span>
                        <input
                          type="time"
                          className="form-control form-control-sm text-white"
                          style={{ backgroundColor: "#0a0a0a", border: "1px solid #444" }}
                          value={config.startTime}
                          onChange={(e) => handleTimeChange(day.dayNum, "startTime", e.target.value)}
                          required
                        />
                      </div>
                      <span className="text-muted mt-4">a</span>
                      <div>
                        <span className="text-muted d-block small mb-1">Hora Fin</span>
                        <input
                          type="time"
                          className="form-control form-control-sm text-white"
                          style={{ backgroundColor: "#0a0a0a", border: "1px solid #444" }}
                          value={config.endTime}
                          onChange={(e) => handleTimeChange(day.dayNum, "endTime", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted small italic p-2">No laborable</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-end">
            <button
              type="submit"
              className="btn btn-gold py-2 px-5 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </span>
              ) : (
                <span>Guardar Configuración</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
