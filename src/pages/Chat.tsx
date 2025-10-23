// src/services/chat.ts
import axios, { AxiosHeaders, type RawAxiosRequestHeaders } from "axios";

export type Role = "user" | "assistant";
export type ChatMode = "USER" | "SALE" | "ADMIN";

export type ChatMessageDTO = {
  id?: number;
  role: Role;
  content: string;
  createdAt: string;
};

/* =======================
   Token helpers
   ======================= */
function readCookie(name: string): string | null {
  // match: start-of-string OR "; "  + name= + (value until ;)
  const re = new RegExp(`(?:^|; )${name}=([^;]*)`);
  const m = document.cookie.match(re);
  if (!m || typeof m[1] !== "string" || m[1].length === 0) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function getToken(): string | null {
  const local =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");
  if (local && local.trim()) return local;

  const session =
    sessionStorage.getItem("auth_token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("access_token");
  if (session && session.trim()) return session;

  const cookie =
    readCookie("jwt") || readCookie("token") || readCookie("access_token");
  return cookie && cookie.trim() ? cookie : null;
}

/* =======================
   Axios instance
   ======================= */
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/v1/chat`,
  withCredentials: true,
});

// Luôn gắn Authorization nếu có token
api.interceptors.request.use((config) => {
  const tok = getToken();
  if (tok) {
    if (!config.headers) config.headers = new AxiosHeaders();
    (config.headers as AxiosHeaders).set("Authorization", `Bearer ${tok}`);
  }
  return config;
});

/* =======================
   API
   ======================= */

/** Reset phiên chat hiện tại (server xác định user qua JWT) */
export async function startSophiaChat(): Promise<void> {
  await api.post("/reset", null);
}

/** Gửi câu hỏi tới Sophia (mode = USER | SALE | ADMIN) – BE trả thuần chuỗi markdown */
export async function askSophia(
  prompt: string,
  mode: ChatMode = "USER",
): Promise<{ markdown: string }> {
  const headers: RawAxiosRequestHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
  };
  const { data } = await api.post<string>("/chat", prompt, {
    params: { mode },
    headers,
  });
  return { markdown: data };
}

/** Lấy tin nhắn cũ (phân trang ngược) */
export async function getMessages({
                                    limit = 30,
                                    beforeId,
                                    mode,
                                  }: {
  limit?: number;
  beforeId?: number;
  mode?: ChatMode; // BE có thể dùng để phân chia history theo mode
}): Promise<ChatMessageDTO[]> {
  const { data } = await api.get<ChatMessageDTO[]>("/messages", {
    params: { limit, beforeId, mode },
  });
  return Array.isArray(data) ? data : [];
}
