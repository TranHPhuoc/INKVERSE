import axios from "axios";
import type { AxiosInstance } from "axios";
import api from "../api";
import type {
  Page,
  ResOrderAdmin,
  ReqUpdateOrderStatus,
  ReqUpdatePayment,
  ReqUpdateShipping,
  ReqAssignOrder,
  ReqCreateNote,
  ReqCancelOrder,
  ReqRefundManual,
  OrderStatus,
  PaymentStatus,
} from "../../types/sale-order";

/* -------------------- types & helpers -------------------- */
type ApiResp<T> = {
  statusCode: number;
  message?: string | null;
  error?: unknown;
  data: T;
};

export type SearchParams = {
  q?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  from?: string; // ISO Instant
  to?: string; // ISO Instant
  page?: number; // 0-based
  size?: number; // <= 100
  sort?: string; // "createdAt,desc"
};

type SaleQuery = {
  page: number;
  size: number;
  sort: string;
  q?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
};

// unwrap payload dạng { statusCode, data }
function unwrap<T>(resp: { data: ApiResp<T> }): T {
  return resp.data.data;
}

/* -------------------- axios client -------------------- */
const client: AxiosInstance =
  (api as AxiosInstance | undefined) ??
  axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
    withCredentials: true,
  });

// attach bearer token nếu có
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* -------------------- Calls -------------------- */
export async function saleSearchOrders(params: SearchParams): Promise<Page<ResOrderAdmin>> {
  const query: SaleQuery = {
    page: params.page ?? 0,
    size: params.size ?? 10,
    sort: params.sort ?? "createdAt,desc",
  };
  if (params.q) query.q = params.q;
  if (params.status) query.status = params.status; // gửi status để BE lọc & phân trang
  if (params.paymentStatus) query.paymentStatus = params.paymentStatus;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;

  const r = await client.get<ApiResp<Page<ResOrderAdmin>>>("/api/v1/sales/orders", {
    params: query,
  });
  return unwrap(r);
}

export async function saleGetOrder(id: number): Promise<ResOrderAdmin> {
  const r = await client.get<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}`);
  return unwrap(r);
}

export async function saleUpdateStatus(
  id: number,
  body: ReqUpdateOrderStatus,
): Promise<ResOrderAdmin> {
  const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/status`, body);
  return unwrap(r);
}

export async function saleUpdatePayment(
  id: number,
  body: ReqUpdatePayment,
): Promise<ResOrderAdmin> {
  const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/payment`, body);
  return unwrap(r);
}

export async function saleUpdateShipping(
  id: number,
  body: ReqUpdateShipping,
): Promise<ResOrderAdmin> {
  const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/shipping`, body);
  return unwrap(r);
}

export async function saleAssignOrder(id: number, body: ReqAssignOrder): Promise<ResOrderAdmin> {
  const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/assign`, body);
  return unwrap(r);
}

export async function saleAddNote(id: number, body: ReqCreateNote): Promise<void> {
  await client.post<ApiResp<void>>(`/api/v1/sales/orders/${id}/notes`, body);
}

export async function saleCancelOrder(id: number, body: ReqCancelOrder): Promise<ResOrderAdmin> {
  const r = await client.post<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/cancel`, body);
  return unwrap(r);
}

export async function saleRefundManual(id: number, body: ReqRefundManual): Promise<ResOrderAdmin> {
  const r = await client.post<ApiResp<ResOrderAdmin>>(
    `/api/v1/sales/orders/${id}/refund-manual`,
    body,
  );
  return unwrap(r);
}
