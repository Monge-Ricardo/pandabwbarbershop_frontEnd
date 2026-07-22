// api.ts - Cliente HTTP compartido con caché por usuario, sucursal y datos públicos.
const DEFAULT_API_URL = "https://pandabarbershop.com";
const BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

const CACHE_PREFIX = "sharkhub_cache::";
const LEGACY_CACHE_PREFIX = "cache_GET_";
const LEGACY_MANUAL_KEYS = ["services_catalog", "barbers_list"];

export const CACHE_TTL = {
  PROFILE: 120_000,
  CATALOG: 300_000,
  LANDING_PUBLIC: 900_000,
  OWNER_DATA: 180_000,
  APPOINTMENTS: 30_000,
  APPOINTMENT_SERVICES: 60_000,
  AVAILABLE_TIMES: 15_000,
} as const;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  path?: string;
  userScope?: string;
  shopScope?: string;
}

interface RequestOptions {
  skipAuth?: boolean;
  skipShopHeader?: boolean;
}

const pendingRequests = new Map<string, Promise<unknown>>();
let cacheRevision = 0;
let legacyCacheCleaned = false;

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function getUserScope(): string {
  return localStorage.getItem("user_id") || "public";
}

function getShopScope(): string {
  return localStorage.getItem("barbershop_id") || "all-shops";
}

function buildCacheKey(path: string, userScope: string, shopScope: string): string {
  const normalizedPath = normalizePath(path);
  return `${CACHE_PREFIX}${encodeURIComponent(userScope)}::${encodeURIComponent(shopScope)}::${encodeURIComponent(normalizedPath)}`;
}

function currentCacheKey(path: string): string {
  return buildCacheKey(path, getUserScope(), getShopScope());
}

function publicCacheKey(path: string): string {
  return buildCacheKey(path, "public", "all-shops");
}

function cleanupLegacyCacheOnce(): void {
  if (legacyCacheCleaned) return;

  try {
    LEGACY_MANUAL_KEYS.forEach((key) => localStorage.removeItem(key));

    Object.keys(localStorage)
      .filter((key) => key.startsWith(LEGACY_CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // La aplicación puede continuar aunque el almacenamiento esté bloqueado.
  }

  legacyCacheCleaned = true;
}

function parseCacheEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const cachedStr = localStorage.getItem(key);
    if (!cachedStr) return null;
    return JSON.parse(cachedStr) as CacheEntry<T>;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function getCachedPathFromEntry(key: string): string | null {
  const entry = parseCacheEntry<unknown>(key);
  if (entry?.path) return entry.path;

  if (!key.startsWith(CACHE_PREFIX)) return null;

  const parts = key.split("::");
  const encodedPath = parts.at(-1);
  if (!encodedPath) return null;

  try {
    return decodeURIComponent(encodedPath);
  } catch {
    return null;
  }
}

function getCachedUserScopeFromEntry(key: string): string | null {
  const entry = parseCacheEntry<unknown>(key);
  if (entry?.userScope) return entry.userScope;

  if (!key.startsWith(CACHE_PREFIX)) return null;

  const parts = key.split("::");
  const encodedUserScope = parts[1];
  if (!encodedUserScope) return null;

  try {
    return decodeURIComponent(encodedUserScope);
  } catch {
    return null;
  }
}

function clearCacheMatching(predicate: (cachedPath: string) => boolean): void {
  cleanupLegacyCacheOnce();
  cacheRevision += 1;
  pendingRequests.clear();

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => {
        const cachedPath = getCachedPathFromEntry(key);
        if (cachedPath && predicate(cachedPath)) {
          localStorage.removeItem(key);
        }
      });
  } catch {
    // Silencioso para no interrumpir la navegación.
  }
}

function clearCachedPaths(paths: string[]): void {
  const normalizedPaths = paths.map(normalizePath);
  clearCacheMatching((cachedPath) =>
    normalizedPaths.some(
      (path) => cachedPath === path || cachedPath.startsWith(`${path}?`),
    ),
  );
}

function clearCachedPrefixes(prefixes: string[]): void {
  const normalizedPrefixes = prefixes.map(normalizePath);
  clearCacheMatching((cachedPath) =>
    normalizedPrefixes.some((prefix) => cachedPath.startsWith(prefix)),
  );
}

function invalidateCacheAfterMutation(path: string): void {
  const normalizedPath = normalizePath(path);

  // El inicio de sesión no modifica catálogos ni datos del dashboard.
  if (normalizedPath.startsWith("/auth/")) return;

  if (normalizedPath.startsWith("/users/")) {
    clearCachedPaths(["/users/me"]);
    return;
  }

  if (
    normalizedPath.startsWith("/appointments") ||
    normalizedPath.startsWith("/api/customer/appointments") ||
    normalizedPath.startsWith("/api/owner/appointments")
  ) {
    clearCachedPrefixes([
      "/appointments",
      "/api/customer/appointments",
      "/api/owner/appointments",
      "/api/customer/available-times",
    ]);
    return;
  }

  if (
    normalizedPath.startsWith("/api/owner/barbers") ||
    normalizedPath.startsWith("/barbershops/invitations") ||
    normalizedPath.includes("/invitations")
  ) {
    clearCachedPrefixes([
      "/api/customer/barbers",
      "/api/owner/barbers",
      "/barbershops",
    ]);
    return;
  }

  if (normalizedPath.includes("/services")) {
    clearCachedPrefixes([
      "/api/customer/services",
      "/barbershops",
    ]);
    return;
  }

  if (normalizedPath.includes("/availabilities")) {
    clearCachedPrefixes([
      "/barbers",
      "/api/customer/available-times",
    ]);
    return;
  }

  if (normalizedPath.includes("/products")) {
    clearCachedPrefixes(["/barbershops"]);
    return;
  }

  if (
    normalizedPath === "/barbershops" ||
    normalizedPath.startsWith("/api/owner/barbershop")
  ) {
    clearCachedPrefixes([
      "/barbershops",
      "/api/owner/barbershops",
      "/api/owner/barbershop",
      "/api/customer/barbers",
      "/api/customer/services",
    ]);
    return;
  }

  // Para cualquier otra mutación se invalida únicamente la misma ruta.
  clearCachedPaths([normalizedPath]);
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readErrorMessage(responseBody: unknown): string {
  if (
    typeof responseBody === "object" &&
    responseBody !== null &&
    "detail" in responseBody
  ) {
    const detail = (responseBody as { detail: unknown }).detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join(". ");
    }

    return String(detail);
  }

  if (typeof responseBody === "string" && responseBody.trim()) {
    return responseBody;
  }

  return "Error en la petición";
}

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export async function request<T = any>(
  method: HttpMethod,
  path: string,
  body: unknown = null,
  customHeaders: Record<string, string> = {},
  options: RequestOptions = {},
): Promise<T> {
  const token = localStorage.getItem("token");
  const normalizedPath = normalizePath(path);
  const isAuthRequest = normalizedPath.startsWith("/auth/");
  const isTraditionalLogin = normalizedPath === "/auth/login";
  const activeShopId = localStorage.getItem("barbershop_id");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(!options.skipShopHeader && activeShopId
      ? { "X-Barbershop-Id": activeShopId }
      : {}),
    ...customHeaders,
  };

  if (token && !options.skipAuth && !isAuthRequest) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (
    body !== null &&
    (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
  ) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${normalizedPath}`, config);
  const responseBody = await readResponseBody(response);

  // Una respuesta 401 al intentar iniciar sesión significa credenciales incorrectas,
  // no una sesión expirada.
  if (isTraditionalLogin && (response.status === 400 || response.status === 401)) {
    throw new Error("Correo electrónico y/o contraseña incorrectos.");
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("barbershop_id");
    localStorage.removeItem("session_created_at");
    clearApiCache();

    if (!window.location.pathname.endsWith("/login")) {
      window.location.href = "/login";
    }

    throw new Error("Sesión expirada. Por favor inicie sesión de nuevo.");
  }

  if (!response.ok) {
    throw new Error(readErrorMessage(responseBody));
  }

  if (method !== "GET") {
    invalidateCacheAfterMutation(normalizedPath);
  }

  return responseBody as T;
}

export function getCachedData<T>(
  key: string,
  ttlMs: number = CACHE_TTL.CATALOG,
): T | null {
  cleanupLegacyCacheOnce();

  const entry = parseCacheEntry<T>(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttlMs) {
    localStorage.removeItem(key);
    return null;
  }

  return entry.data;
}

export function setCachedData<T>(key: string, data: T, path?: string): void {
  cleanupLegacyCacheOnce();

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      path,
      userScope: getUserScope(),
      shopScope: getShopScope(),
    };

    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Si localStorage está lleno o bloqueado, la app continúa sin caché.
  }
}

function getCachedRequestDataByKey<T>(
  key: string,
  ttlMs: number,
): T | null {
  cleanupLegacyCacheOnce();

  const entry = parseCacheEntry<T>(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttlMs) {
    localStorage.removeItem(key);
    return null;
  }

  return entry.data;
}

export function getCachedRequestData<T>(
  path: string,
  ttlMs: number = CACHE_TTL.CATALOG,
): T | null {
  return getCachedRequestDataByKey<T>(currentCacheKey(path), ttlMs);
}

export function getPublicCachedRequestData<T>(
  path: string,
  ttlMs: number = CACHE_TTL.LANDING_PUBLIC,
): T | null {
  return getCachedRequestDataByKey<T>(publicCacheKey(path), ttlMs);
}

async function cachedRequestWithKey<T>(
  path: string,
  key: string,
  ttlMs: number,
  forceRefresh: boolean,
  requestOptions: RequestOptions,
): Promise<T> {
  cleanupLegacyCacheOnce();

  const normalizedPath = normalizePath(path);

  if (forceRefresh) {
    cacheRevision += 1;
    pendingRequests.delete(key);
    localStorage.removeItem(key);
  } else {
    const cached = getCachedRequestDataByKey<T>(key, ttlMs);
    if (cached !== null) {
      console.info("[CACHE HIT]", normalizedPath);
      return cached;
    }

    const pending = pendingRequests.get(key);
    if (pending) {
      console.info("[CACHE PENDING]", normalizedPath);
      return pending as Promise<T>;
    }
  }

  console.info(forceRefresh ? "[CACHE REFRESH]" : "[CACHE MISS]", normalizedPath);

  const requestRevision = cacheRevision;
  const promise = request<T>("GET", normalizedPath, null, {}, requestOptions)
    .then((data) => {
      if (requestRevision === cacheRevision) {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          path: normalizedPath,
          userScope: requestOptions.skipAuth ? "public" : getUserScope(),
          shopScope: requestOptions.skipShopHeader ? "all-shops" : getShopScope(),
        };

        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch {
          // La aplicación sigue funcionando sin caché.
        }
      }
      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}

export async function cachedRequest<T = any>(
  path: string,
  ttlMs: number = CACHE_TTL.CATALOG,
  forceRefresh = false,
): Promise<T> {
  return cachedRequestWithKey<T>(
    path,
    currentCacheKey(path),
    ttlMs,
    forceRefresh,
    {},
  );
}

export async function cachedPublicRequest<T = any>(
  path: string,
  ttlMs: number = CACHE_TTL.LANDING_PUBLIC,
  forceRefresh = false,
): Promise<T> {
  return cachedRequestWithKey<T>(
    path,
    publicCacheKey(path),
    ttlMs,
    forceRefresh,
    {
      skipAuth: true,
      skipShopHeader: true,
    },
  );
}

/**
 * Elimina la caché privada de usuarios y sucursales.
 * Los datos públicos de la página principal se conservan por defecto.
 * Use clearApiCache(true) únicamente cuando también necesite eliminar la caché pública.
 */
export function clearApiCache(includePublic = false): void {
  cleanupLegacyCacheOnce();
  cacheRevision += 1;
  pendingRequests.clear();

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => {
        const userScope = getCachedUserScopeFromEntry(key);
        const isPublicEntry = userScope === "public";

        if (includePublic || !isPublicEntry) {
          localStorage.removeItem(key);
        }
      });
  } catch {
    // Silencioso para no romper la navegación.
  }
}

export function clearCachedPath(path: string): void {
  clearCachedPaths([path]);
}
