// src/services/chat.ts
import type { AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from "axios";
import api from "./api";

/* ========= Types ========= */
export type Role = "user" | "assistant";
export type ChatMode = "USER" | "SALE" | "ADMIN";

export interface ChatMessageDTO {
  id?: number;
  role: Role;
  content: string;
  createdAt: string;
}

export interface ApiResp<T> {
  statusCode: number;
  error: unknown;
  message: string;
  data: T;
}

type RequestOpts = {
  /** Có thể truyền AbortController.signal; để tránh lỗi TS, mình sẽ gán có điều kiện */
  signal?: AbortSignal;
};

/* ========= API ========= */

/** Reset hội thoại hiện tại (server xác định user qua JWT) */
export async function startSophiaChat(opts?: RequestOpts): Promise<void> {
  const cfg: AxiosRequestConfig = {};
  if (opts?.signal) cfg.signal = opts.signal as unknown as AbortSignal;
  await api.post("/api/v1/chat/reset", null, cfg);
}

/** Gửi câu hỏi tới Sophia */
export async function askSophia(
  prompt: string,
  mode: ChatMode = "USER",
  opts?: RequestOpts,
): Promise<{ markdown: string }> {
  const headers: RawAxiosRequestHeaders = {
    "Content-Type": "text/plain; charset=utf-8",
  };

  const cfg: AxiosRequestConfig = {
    params: { mode }, // giữ đúng query ?mode=
    headers,
  };
  if (opts?.signal) cfg.signal = opts.signal as unknown as AbortSignal;

  const res: AxiosResponse<string> = await api.post("/api/v1/chat/chat", prompt, cfg);
  return { markdown: res.data };
}

/** Lấy danh sách tin nhắn cũ  */
export async function getMessages(opts?: {
  limit?: number;
  beforeId?: number;
  mode?: ChatMode;
  signal?: AbortSignal;
}): Promise<ChatMessageDTO[]> {
  const { limit = 30, beforeId, signal } = opts ?? {};

  const cfg: AxiosRequestConfig = {
    params: { limit, beforeId },
  };
  if (signal) cfg.signal = signal as unknown as AbortSignal;

  const res: AxiosResponse<ApiResp<ChatMessageDTO[]> | ChatMessageDTO[]> =
    await api.get("/api/v1/chat/messages", cfg);

  const body = res.data;

  if (Array.isArray(body)) return body;

  const maybeWrapped = body as ApiResp<ChatMessageDTO[]>;
  if (maybeWrapped && Array.isArray(maybeWrapped.data)) return maybeWrapped.data;

  return [];
}
