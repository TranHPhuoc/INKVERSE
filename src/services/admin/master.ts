import api from "../api";

/* ---------- helpers ---------- */
type ApiResp<T> = {
  statusCode?: number;
  message?: string | null;
  error?: unknown;
  data: T;
};

function isApiResp<T>(v: unknown): v is ApiResp<T> {
  return typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);
}

function unwrap<T>(payload: unknown): T {
  return isApiResp<T>(payload) ? payload.data : (payload as T);
}

/* ---------- types ---------- */
export type SimpleMaster = { id?: number; name: string; slug: string };

/* ---------- calls ---------- */
export async function listAuthors(): Promise<SimpleMaster[]> {
  const res = await api.get(`/admin/authors`);
  return unwrap<SimpleMaster[]>(res.data);
}

export async function createAuthor(payload: SimpleMaster): Promise<SimpleMaster> {
  const res = await api.post(`/admin/authors`, payload);
  return unwrap<SimpleMaster>(res.data);
}

export async function listPublishers(): Promise<SimpleMaster[]> {
  const res = await api.get(`/admin/publishers`);
  return unwrap<SimpleMaster[]>(res.data);
}

export async function createPublisher(payload: SimpleMaster): Promise<SimpleMaster> {
  const res = await api.post(`/admin/publishers`, payload);
  return unwrap<SimpleMaster>(res.data);
}

export async function listSuppliers(): Promise<SimpleMaster[]> {
  const res = await api.get(`/admin/suppliers`);
  return unwrap<SimpleMaster[]>(res.data);
}

export async function createSupplier(payload: SimpleMaster): Promise<SimpleMaster> {
  const res = await api.post(`/admin/suppliers`, payload);
  return unwrap<SimpleMaster>(res.data);
}
