import axios, { AxiosError } from "axios";
import { AUTH_TOKEN_KEY } from "../types/authKeys";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    withCredentials: true, // để cookie refresh-token được gửi
});

/** Các endpoint không cần Authorization */
const PUBLIC_PATHS = [
    "/api/v1/auth/login",
    "/api/v1/auth/register/start",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/resend-otp",
    "/api/v1/auth/forgot-password/start",
    "/api/v1/auth/forgot-password/verify",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
];

function normalizeUrl(url?: string): string {
    if (!url) return "";
    try {
        const u = new URL(url, api.defaults.baseURL);
        return u.pathname.replace(/\/+/g, "/");
    } catch {
        return url;
    }
}

function isPublic(url?: string) {
    const path = normalizeUrl(url);
    return PUBLIC_PATHS.some(
        (p) => path.endsWith(p) || path.includes(p)
    );
}

/** Gắn Authorization vào request */
api.interceptors.request.use((config) => {
    const path = normalizeUrl(config.url);

    if (isPublic(path)) {
        if (config.headers) delete (config.headers as any).Authorization;
        return config;
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

/** Xử lý refresh token khi 401 */
let isRefreshing = false;
let pendingQueue: Array<(t: string | null) => void> = [];

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config!;
        const status = error.response?.status;
        const path = normalizeUrl(original?.url);

        // Nếu 401 ở public API hoặc refresh API → trả lỗi luôn
        if (status === 401 && (isPublic(path) || path.endsWith("/api/v1/auth/refresh"))) {
            throw error;
        }

        // Nếu 401 ở API private → thử refresh token
        if (status === 401 && !((original.headers as any) ?? {})["x-retried"]) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const r = await axios.post(
                        `${api.defaults.baseURL}/api/v1/auth/refresh`,
                        {},
                        { withCredentials: true }
                    );
                    const next = (r.data as any)?.accessToken as string | undefined;

                    if (next) {
                        localStorage.setItem(AUTH_TOKEN_KEY, next);
                    } else {
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                    }

                    pendingQueue.forEach((ok) => ok(next || null));
                    pendingQueue = [];

                    return api({
                        ...original,
                        headers: {
                            ...original.headers,
                            Authorization: next ? `Bearer ${next}` : undefined,
                            "x-retried": "1",
                        },
                    });
                } catch (e) {
                    pendingQueue.forEach((ok) => ok(null));
                    pendingQueue = [];
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                    throw e;
                } finally {
                    isRefreshing = false;
                }
            } else {
                // Đợi refresh xong thì retry lại
                const token = await new Promise<string | null>((resolve) =>
                    pendingQueue.push(resolve)
                );
                if (!token) throw error;
                return api({
                    ...original,
                    headers: {
                        ...original.headers,
                        Authorization: `Bearer ${token}`,
                        "x-retried": "1",
                    },
                });
            }
        }

        throw error;
    }
);

export default api;
