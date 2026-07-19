// api.ts - Cliente HTTP Compartido, HTTPS-ready y con caché liviana para SharkHub
const DEFAULT_API_URL = "https://pandabarbershop.com";
const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function cacheKey(path: string): string {
  const userScope = localStorage.getItem("user_id") || localStorage.getItem("token") || "public";
  return `cache_GET_${userScope}_${path}`;
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export async function request<T = any>(
  method: HttpMethod,
  path: string,
  body: any = null,
  customHeaders: Record<string, string> = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
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

  const response = await fetch(`${BASE_URL}${normalizedPath}`, config);

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("session_created_at");
    clearApiCache();

    if (!window.location.pathname.endsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Sesión expirada. Por favor inicie sesión de nuevo.");
  }

  if (response.status === 204) {
    if (method !== "GET") clearApiCache();
    return null as T;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Error en la petición");
  }

  const data = await response.json();

  // Cualquier mutación puede cambiar datos del dashboard; limpiamos caché GET.
  if (method !== "GET") {
    clearApiCache();
  }

  return data;
}

export function getCachedData<T>(key: string, ttlMs: number = 300000): T | null {
  try {
    const cachedStr = localStorage.getItem(key);
    if (!cachedStr) return null;
    const entry: CacheEntry<T> = JSON.parse(cachedStr);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Si localStorage está lleno o bloqueado, la app debe seguir funcionando sin caché.
  }
}

export async function cachedRequest<T = any>(path: string, ttlMs: number = 300000): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const key = cacheKey(normalizedPath);
  const cached = getCachedData<T>(key, ttlMs);
  if (cached !== null) {
    console.info("[CACHE HIT]", normalizedPath);
    return cached;
  }
  console.info("[CACHE MISS]", normalizedPath);
  const data = await request<T>("GET", normalizedPath);
  setCachedData(key, data);
  return data;
}

export function clearApiCache(prefix = "cache_GET_"): void {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(prefix));
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Silencioso para no romper la navegación.
  }
}

export function clearCachedPath(path: string): void {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  localStorage.removeItem(cacheKey(normalizedPath));
}
