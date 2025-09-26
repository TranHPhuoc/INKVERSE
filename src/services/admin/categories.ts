import api from "../api";

/* ========== Helpers ========== */
type ApiResp<T> = {
  statusCode?: number;
  message?: string | null;
  error?: unknown;
  data: T;
};

const isApiResp = <T>(v: unknown): v is ApiResp<T> =>
  typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);

const unwrap = <T>(payload: unknown): T =>
  isApiResp<T>(payload) ? (payload as ApiResp<T>).data : (payload as T);

/* ========== Types ========== */
export type ResCategoryFlat = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  leaf: boolean;
};

export type ResCategoryTree = {
  id: number;
  name: string;
  slug: string;
  children: ResCategoryTree[];
};

export type CategoryCreate = {
  name: string;
  parentId?: number | null;
};

export type CategoryDTO = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
};

/* ========== Public calls ========== */
export async function listFlatCategories(): Promise<ResCategoryFlat[]> {
  const res = await api.get("/api/v1/categories/flat", { validateStatus: (s) => s < 500 });
  const data = unwrap<ResCategoryFlat[] | null>(res.data);
  return Array.isArray(data) ? data : [];
}

export async function listFlatLeafCategories(): Promise<ResCategoryFlat[]> {
  const res = await api.get("/api/v1/categories/flat/leaf", { validateStatus: (s) => s < 500 });
  const data = unwrap<ResCategoryFlat[] | null>(res.data);
  return Array.isArray(data) ? data : [];
}

/* ========== Admin ========= */
export async function adminListCategories(leaf = false): Promise<ResCategoryFlat[]> {
  const path = leaf ? "/api/v1/categories/flat/leaf" : "/api/v1/categories/flat";
  const res = await api.get(path, { validateStatus: (s) => s < 500 });
  const data = unwrap<ResCategoryFlat[] | null>(res.data);
  return Array.isArray(data) ? data : [];
}

export async function adminListCategoriesTree(): Promise<ResCategoryTree[]> {
  const res = await api.get("/api/v1/categories/tree", { validateStatus: (s) => s < 500 });
  return unwrap<ResCategoryTree[]>(res.data);
}

export async function createCategory(payload: CategoryCreate): Promise<CategoryDTO> {
  const res = await api.post("/api/v1/admin/categories", payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<CategoryDTO>(res.data);
}
