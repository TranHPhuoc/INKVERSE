import api from "../api";

/* ---------- Kiểu dữ liệu từ BE ---------- */
export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
};

export type ApiResp<T> = {
  statusCode: number;
  error: string | null;
  message: string;
  data: T;
};

export type ResStockRowDTO = {
  bookId: number;
  sku: string;
  title: string;
  stock: number;
  sold: number;
};

export type BatchType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT";

export type ReqCreateBatchLine = {
  bookId?: number;
  sku?: string;
  qty: number;           // > 0
  unitCost?: number;     // required if INBOUND
};

export type ReqCreateBatch = {
  type: BatchType;
  reason?: string;
  note?: string;
  lines: ReqCreateBatchLine[];
};

export type ResBatch = {
  id: number;
  code: string;
  type: BatchType;
  reason: string | null;
  note: string | null;
  performedBy: { userId: number; name: string };
  performedAt: string;
  totals: { items: number; qty: number; amount: string };
  lines: Array<{
    bookId: number;
    sku: string;
    title: string;
    qty: number;
    unitCost: string;
    lineTotal: string;
  }>;
};

export type ResBatchHistoryRow = {
  id: number;
  code: string;
  type: BatchType;
  reason: string | null;
  note: string | null;
  performedByName: string;
  performedById: number;
  performedAt: string;
  totalItems: number;
  totalQty: number;
  totalAmount: string;
  items?: Array<{
    bookId: number;
    sku: string;
    title: string;
    qty: number;
    unitCost: string;
    lineTotal: string;
  }> | null;
};

/* ---------- API CALLS ---------- */

// ✅ Lấy danh sách tồn kho
export async function fetchStocks(params: {
  q?: string;
  page?: number;
  size?: number;
  sort?: "stock,asc" | "stock,desc" | "sold,asc" | "sold,desc";
}): Promise<Page<ResStockRowDTO>> {
  const { q, page = 0, size = 20, sort = "stock,asc" } = params ?? {};
  const res = await api.get<ApiResp<Page<ResStockRowDTO>>>("/api/v1/warehouse/stocks", {
    params: { q, page, size, sort },
  });
  return res.data.data; // ✅ unwrap
}

// ✅ Tạo batch mới
export async function createBatch(payload: ReqCreateBatch): Promise<ResBatch> {
  const res = await api.post<ApiResp<ResBatch>>("/api/v1/warehouse/batches", payload);
  return res.data.data; // ✅ unwrap
}

// ✅ Lịch sử nhập/xuất kho
export async function fetchBatchHistory(params: {
  type?: BatchType | "";
  code?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  includeItems?: boolean;
  page?: number;
  size?: number;
}): Promise<Page<ResBatchHistoryRow>> {
  const res = await api.get<ApiResp<Page<ResBatchHistoryRow>>>("/api/v1/warehouse/batches", {
    params,
  });
  return res.data.data; // ✅ unwrap
}

// ✅ Chi tiết một batch
export async function fetchBatchDetail(id: number): Promise<ResBatch> {
  const res = await api.get<ApiResp<ResBatch>>(`/api/v1/warehouse/batches/${id}`);
  return res.data.data; // ✅ unwrap
}
