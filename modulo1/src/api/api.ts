// api.ts - Cliente HTTP Compartido y Tipado para SharkHub
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function request<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  body: any = null,
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (response.status === 401) {
    // Redireccionar a login si el token expira o es inválido
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    
    // Evitar bucle infinito si ya estamos en la página de login
    if (!window.location.pathname.endsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada. Por favor inicie sesión de nuevo.");
  }

  if (response.status === 204) {
    return null as any;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error en la petición");
  }

  return response.json();
}
