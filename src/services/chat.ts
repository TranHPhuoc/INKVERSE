import api from "./api";

/** ===== Types ===== */
export type Role = "user" | "assistant";

export type ChatMessageDTO = {
  id?: number;
  role: Role;
  content: string;
  createdAt: string; // ISO/Offset
};

type ApiWrapped<T> =
  | T
  | { data: T }
  | { statusCode?: number; message?: string; error?: unknown; data: T }
  | { data: { data: T } };

/** ===== Helpers ===== */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function extractArray<T>(payload: ApiWrapped<T[]> | unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) {
    const d1 = payload.data;
    if (Array.isArray(d1)) return d1 as T[];
    if (isRecord(d1) && Array.isArray(d1.data)) return d1.data as T[];
  }
  return [];
}

/** ===== API ===== */
export async function startSophiaChat(): Promise<void> {
  await api.post("/api/v1/chat/reset");
}

export type ChatResp = { markdown: string };

/** Ask Sophia  */
export async function askSophia(message: string): Promise<unknown> {
  const { data } = await api.post<ChatResp>(
    "/api/v1/chat/ask",
    message,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
  return data;
}

/** History */
export async function getMessages(params?: {
  limit?: number;
  beforeId?: number;
}): Promise<ChatMessageDTO[]> {
  const { data } = await api.get<ApiWrapped<ChatMessageDTO[]>>(
    "/api/v1/chat/messages",
    { params },
  );
  return extractArray<ChatMessageDTO>(data);
}
