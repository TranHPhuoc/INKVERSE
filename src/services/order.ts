// src/services/order.ts
import api from "./api";
import type { ReqCreateOrder, ResOrderCreated, ResOrderDetail, SpringPage } from "../types/order";

/* -------- unwrap helper -------- */
type ApiResp<T> = { statusCode?: number; data: T };

function isApiResp<T>(v: unknown): v is ApiResp<T> {
  return typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);
}

function unwrap<T>(payload: unknown): T {
  return isApiResp<T>(payload) ? payload.data : (payload as T);
}

/* -------- API calls -------- */
export async function createOrder(payload: ReqCreateOrder): Promise<ResOrderCreated> {
  const res = await api.post(`/api/v1/orders`, payload);
  return unwrap<ResOrderCreated>(res.data);
}

export async function getOrderByCode(code: string): Promise<ResOrderDetail> {
  const res = await api.get(`/api/v1/orders/${encodeURIComponent(code)}`);
  return unwrap<ResOrderDetail>(res.data);
}

export async function cancelMyOrder(code: string, reason: string): Promise<ResOrderDetail> {
  const res = await api.post(`/api/v1/orders/${encodeURIComponent(code)}/cancel`, { reason });
  return unwrap<ResOrderDetail>(res.data);
}

export async function listMyOrders(page = 0, size = 10): Promise<SpringPage<ResOrderDetail>> {
  const res = await api.get(`/api/v1/orders/me`, { params: { page, size } });
  return unwrap<SpringPage<ResOrderDetail>>(res.data);
}
