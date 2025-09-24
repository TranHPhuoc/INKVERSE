// src/services/admin/categories.ts
import api from "../api";

/* ========== Helpers ========== */
type ApiResp<T> = { statusCode?: number; message?: string | null; error?: unknown; data: T };

const isApiResp = <T>(v: unknown): v is ApiResp<T> =>
  typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);

const unwrap = <T>(payload: unknown): T =>
  isApiResp<T>(payload) ? (payload as ApiResp<T>).data : (payload as T);

/* ========== Types ========== */
// Phù hợp với ResCategoryFlat ở BE
export type ResCategoryFlat = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  leaf: boolean;
};

// Payload tạo mới category ở BE (slug có thể để trống để BE tự sinh)
export type CategoryCreate = {
  name: string;
  parentId?: number | null;
};

/* ========== Calls ========== */

/** Public: lấy toàn bộ danh mục dạng phẳng (không phân trang) */
export async function listFlatCategories(): Promise<ResCategoryFlat[]> {
  const res = await api.get("/api/v1/categories/flat", { validateStatus: (s) => s < 500 });
  const data = unwrap<ResCategoryFlat[] | null>(res.data);
  return Array.isArray(data) ? data : [];
}

/** Public: lấy toàn bộ lá (optional, nếu cần) */
export async function listFlatLeafCategories(): Promise<ResCategoryFlat[]> {
  const res = await api.get("/api/v1/categories/flat/leaf", { validateStatus: (s) => s < 500 });
  const data = unwrap<ResCategoryFlat[] | null>(res.data);
  return Array.isArray(data) ? data : [];
}

/** Admin: tạo category mới */
export async function createCategory(payload: CategoryCreate) {
  const res = await api.post("/api/v1/admin/categories", payload);
  return unwrap(res.data);
}
