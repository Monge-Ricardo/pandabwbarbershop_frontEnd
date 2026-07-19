import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { request, cachedRequest } from "../api/api";

interface Product {
  id?: string | number;
  product_id?: string | number;
  name: string;
  description?: string;
  price: number | string;
  stock: number;
  image_url?: string;
}

export default function BarberInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const barbershopId = localStorage.getItem("barbershop_id") || "bf338534-365a-4d8d-b45d-1e961e182467";

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await cachedRequest(`/barbershops/${barbershopId}/products`, 300000);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImageUrl("");
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    const pId = product.product_id || product.id || null;
    setEditingId(pId);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(String(product.price) || "");
    setStock(String(product.stock) || "");
    setImageUrl(product.image_url || "");
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        image_url: imageUrl || null
      };

      if (editingId) {
        await request("PUT", `/barbershops/${barbershopId}/products/${editingId}`, payload);
      } else {
        await request("POST", `/barbershops/${barbershopId}/products`, payload);
      }
      
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar el producto: " + err.message);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) return;
    try {
      await request("DELETE", `/barbershops/${barbershopId}/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      alert("Error al eliminar el producto: " + err.message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "1px" }}>Catálogo de Productos</h2>
          <p className="text-muted mb-0">Administra los productos de tu barbería disponibles para el personal y clientes.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-gold py-2 px-4 fw-bold">
          <i className="fa-solid fa-plus me-2"></i>Nuevo Producto
        </button>
      </div>

      <div className="panel-card mt-4">
        {error && <div className="alert alert-danger" style={{ backgroundColor: "#2c0e0e", borderColor: "#7a1a1a", color: "#ff8888" }}>{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3 mb-0">Cargando catálogo de productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="fa-solid fa-box-open fs-2 mb-3 d-block" style={{ color: "#D4AF37" }}></i>
            No tienes productos registrados en tu catálogo.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dashboard table-hover mb-0">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Descripción</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const pId = product.product_id || product.id;
                  return (
                    <tr key={pId} className="align-middle">
                      <td>
                        <img
                          src={product.image_url || "https://images.unsplash.com/photo-1593121925328-7b3001606ec8?q=80&w=100&auto=format&fit=crop"}
                          alt={product.name}
                          className="rounded"
                          style={{ width: "50px", height: "50px", objectFit: "cover", border: "1px solid #333" }}
                        />
                      </td>
                      <td className="fw-bold" style={{ color: "#fff" }}>{product.name}</td>
                      <td className="text-muted" style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {product.description || "Sin descripción"}
                      </td>
                      <td>
                        <span className={`badge px-2 py-1 ${product.stock <= 5 ? "bg-danger" : "bg-secondary"}`}>
                          {product.stock} unidades
                        </span>
                      </td>
                      <td className="fw-bold" style={{ color: "#D4AF37" }}>${parseFloat(String(product.price)).toFixed(2)}</td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button onClick={() => openEditModal(product)} className="btn btn-sm btn-outline-gold">
                            <i className="fa-solid fa-pen-to-square"></i> Editar
                          </button>
                          <button onClick={() => pId && handleDelete(pId)} className="btn btn-sm btn-outline-danger">
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
                  {editingId ? "Editar Producto" : "Nuevo Producto"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-muted">Nombre del Producto *</label>
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
                  <div className="mb-3">
                    <label className="form-label text-muted">URL de Imagen</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
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
                      <label className="form-label text-muted">Stock Inicial *</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ backgroundColor: "#0a0a0a", color: "#fff", border: "1px solid #444" }}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        required
                      />
                    </div>
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
