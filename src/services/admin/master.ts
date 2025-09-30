import api from "../api";

/* ---------- helpers ---------- */
type ApiResp<T> = {
  statusCode?: number;
  message?: string | null;
  error?: unknown;
  data: T;
};

const isApiResp = <T>(v: unknown): v is ApiResp<T> =>
  typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);

const unwrap = <T>(payload: unknown): T => (isApiResp<T>(payload) ? payload.data : (payload as T));

/* ---------- types ---------- */
export type SimpleMaster = {
  id: number;
  name: string;
  slug: string;
};

export type MasterCreate = {
  name: string;
  slug: string; // FE tự sinh
};

/* ========== AUTHORS ========== */
export async function listAuthors(): Promise<SimpleMaster[]> {
  const res = await api.get(`/api/v1/admin/authors`, { validateStatus: (s) => s < 500 });
  return unwrap<SimpleMaster[]>(res.data) ?? [];
}

export async function createAuthor(payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.post(`/api/v1/admin/authors`, payload, { validateStatus: (s) => s < 500 });
  return unwrap<SimpleMaster>(res.data);
}

export async function updateAuthor(id: number, payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.put(`/api/v1/admin/authors/${id}`, payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<SimpleMaster>(res.data);
}

export async function deleteAuthor(id: number): Promise<void> {
  await api.delete(`/api/v1/admin/authors/${id}`, { validateStatus: (s) => s < 500 });
}

/* ========== PUBLISHERS ========== */
export async function listPublishers(): Promise<SimpleMaster[]> {
  const res = await api.get(`/api/v1/admin/publishers`, { validateStatus: (s) => s < 500 });
  return unwrap<SimpleMaster[]>(res.data) ?? [];
}

export async function createPublisher(payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.post(`/api/v1/admin/publishers`, payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<SimpleMaster>(res.data);
}

export async function updatePublisher(id: number, payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.put(`/api/v1/admin/publishers/${id}`, payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<SimpleMaster>(res.data);
}

export async function deletePublisher(id: number): Promise<void> {
  await api.delete(`/api/v1/admin/publishers/${id}`, { validateStatus: (s) => s < 500 });
}

/* ========== SUPPLIERS ========== */
export async function listSuppliers(): Promise<SimpleMaster[]> {
  const res = await api.get(`/api/v1/admin/suppliers`, { validateStatus: (s) => s < 500 });
  return unwrap<SimpleMaster[]>(res.data) ?? [];
}

export async function createSupplier(payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.post(`/api/v1/admin/suppliers`, payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<SimpleMaster>(res.data);
}

export async function updateSupplier(id: number, payload: MasterCreate): Promise<SimpleMaster> {
  const res = await api.put(`/api/v1/admin/suppliers/${id}`, payload, {
    validateStatus: (s) => s < 500,
  });
  return unwrap<SimpleMaster>(res.data);
}

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/api/v1/admin/suppliers/${id}`, { validateStatus: (s) => s < 500 });
}
