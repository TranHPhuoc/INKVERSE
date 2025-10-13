// src/services/api.ts
import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { AUTH_TOKEN_KEY } from "../types/authKeys";

/* =================== axios instance =================== */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
});

/* =================== public paths =================== */
const PUBLIC_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/resend-otp",
  "/api/v1/auth/forgot-password/start",
  "/api/v1/auth/forgot-password/verify",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
] as const;

function normalizeUrl(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url, api.defaults.baseURL);
    return u.pathname.replace(/\/+/g, "/");
  } catch {
    return url ?? "";
  }
}

function isPublic(url?: string): boolean {
  const path = normalizeUrl(url);
  return PUBLIC_PATHS.some((p) => path.endsWith(p) || path.includes(p));
}

/* =================== request interceptor =================== */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const path = normalizeUrl(config.url);
  const headers = AxiosHeaders.from(config.headers);

  if (isPublic(path)) {
    headers.delete("Authorization");
    config.headers = headers;
    return config;
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

/* =================== refresh token & retry =================== */
type RefreshResp = { accessToken?: string } | { data?: { accessToken?: string } };

let isRefreshing = false;
let pendingQueue: Array<(t: string | null) => void> = [];

function applyTokenToOriginal(original: InternalAxiosRequestConfig, token: string): void {
  const h = AxiosHeaders.from(original.headers);
  h.set("Authorization", `Bearer ${token}`);
  h.set("x-retried", "1");
  original.headers = h;
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const path = normalizeUrl(original?.url);

    if (!original || status !== 401) throw error;

    if (isPublic(path) || path.endsWith("/api/v1/auth/refresh")) {
      throw error;
    }

    const alreadyRetried = AxiosHeaders.from(original.headers).get("x-retried") === "1";

    if (!alreadyRetried) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const r = await axios.post<RefreshResp>(
            `${api.defaults.baseURL}/api/v1/auth/refresh`,
            {},
            { withCredentials: true },
          );

          const next =
            (r.data as { accessToken?: string })?.accessToken ??
            (r.data as { data?: { accessToken?: string } })?.data?.accessToken ??
            undefined;

          if (next) {
            localStorage.setItem(AUTH_TOKEN_KEY, next);
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          }

          pendingQueue.forEach((ok) => ok(next ?? null));
          pendingQueue = [];

          if (next) {
            applyTokenToOriginal(original, next);
            return api.request(original);
          }
          throw error;
        } catch (e) {
          pendingQueue.forEach((ok) => ok(null));
          pendingQueue = [];
          localStorage.removeItem(AUTH_TOKEN_KEY);
          throw e;
        } finally {
          isRefreshing = false;
        }
      }

      const token = await new Promise<string | null>((resolve) => pendingQueue.push(resolve));
      if (!token) throw error;

      applyTokenToOriginal(original, token);
      return api.request(original);
    }
    throw error;
  },
);

export default api;
