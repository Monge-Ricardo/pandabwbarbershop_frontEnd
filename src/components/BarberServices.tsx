import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { request, cachedRequest } from "../api/api";

interface Service {
  id?: string | number;
  service_id?: string | number;
  name: string;
  description?: string;
  price: number | string;
  duration_minutes?: number;
  duration?: number;
  is_active?: boolean;
}

export default function BarberServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const barbershopId = localStorage.getItem("barbershop_id") || "bf338534-365a-4d8d-b45d-1e961e182467";

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await cachedRequest(`/barbershops/${barbershopId}/services`, 300000);
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (service: Service) => {
    const sId = service.service_id || service.id || null;
    setEditingId(sId);
    setName(service.name || "");
    setDescription(service.description || "");
    setPrice(String(service.price) || "");
    setDuration(String(service.duration_minutes || service.duration || ""));
    setIsActive(service.is_active !== false);
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(duration, 10),
        is_active: isActive,
      };

      if (editingId) {
        await request("PUT", `/barbershops/${barbershopId}/services/${editingId}`, payload);
      } else {
        await request("POST", `/barbershops/${barbershopId}/services`, payload);
      }
      
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar el servicio: " + err.message);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;
    try {
      await request("DELETE", `/barbershops/${barbershopId}/services/${id}`);
      fetchServices();
    } catch (err: any) {
      console.error(err);
      alert("Error al eliminar el servicio: " + err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" }}>Mis Servicios</h2>
          <p className="text-muted mb-0">Administra los cortes, barbas y tratamientos que ofreces a tus clientes.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-gold py-2 px-4 fw-bold">
          <i className="fa-solid fa-plus me-2"></i>Nuevo Servicio
        </button>
      </div>

      <div className="panel-card mt-4">
        {error && <div className="alert alert-danger" style={{ backgroundColor: "#2c0e0e", borderColor: "#7a1a1a", color: "#ff8888" }}>{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3 mb-0">Obteniendo servicios generales...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-solid fa-list-check fs-2 mb-3 d-block" style={{ color: "#D4AF37" }}></i>
            No tienes servicios registrados en el sistema.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dashboard table-hover mb-0">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Duración</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const sId = service.service_id || service.id;
                  return (
                    <tr key={sId} className="align-middle">
                      <td className="fw-bold" style={{ color: "#fff" }}>{service.name}</td>
                      <td className="text-muted" style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {service.description || "Sin descripción"}
                      </td>
                      <td>{service.duration_minutes || service.duration || "30"} min</td>
                      <td className="fw-bold" style={{ color: "#D4AF37" }}>${parseFloat(String(service.price)).toFixed(2)}</td>
                      <td>
                        <span className={`badge px-3 py-2 text-uppercase`} style={{
                          backgroundColor: service.is_active !== false ? "#19875422" : "#dc354522",
                          color: service.is_active !== false ? "#198754" : "#dc3545",
                          border: `1px solid ${service.is_active !== false ? "#198754" : "#dc3545"}`
                        }}>
                          {service.is_active !== false ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button onClick={() => openEditModal(service)} className="btn btn-sm btn-outline-gold">
                            <i className="fa-solid fa-pen-to-square"></i> Editar
                          </button>
                          <button onClick={() => sId && handleDelete(sId)} className="btn btn-sm btn-outline-danger">
                            <i className="fa-solid fa-trash"></i> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "#000000aa" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-white" style={{ backgroundColor: "#161615", border: "1px solid #D4AF37" }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {editingId ? "Editar Servicio" : "Nuevo Servicio"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">Nombre del Servicio *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">Descripción</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted">Precio ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted">Duración (minutos) *</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3 form-check text-start">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isActiveCheckbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ backgroundColor: "#0a0a0a", border: "1px solid #444" }}
                    />
                    <label className="form-check-label text-muted ms-2" htmlFor="isActiveCheckbox">
                      Servicio Activo / Disponible para clientes
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-outline-light" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-gold fw-bold">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
