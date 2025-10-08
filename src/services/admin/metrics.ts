// src/services/admin/metrics.ts
import api from "../api";

/* ===== Types ===== */
export type ResAdminKpiDTO = {
  revenue: number;
  orders: number;
  orderValue: number;
  conversionRate: number;
  totalOrders: number;
};
export type ResAdminRevenuePointDTO = {
  day: string; revenue: number; orders: number;
};
export type ResAdminTopBookDTO = {
  bookId: number; title: string; thumbnail: string; sold: number; revenue: number;
};
export type ResAdminCategorySalesDTO = {
  categoryId: number; categoryName: string; revenue: number;
};

/* ===== API calls (đúng prefix /api) ===== */
export async function getKpi(params: { from: string; to: string }) {
  const res = await api.get("/api/v1/admin/metrics/kpi", { params });
  return res.data?.data as ResAdminKpiDTO;
}
export async function getRevenueDaily(params: { from: string; to: string }) {
  const res = await api.get("/api/v1/admin/metrics/revenue/daily", { params });
  return (res.data?.data ?? []) as ResAdminRevenuePointDTO[];
}
export async function getTopBooks(params: { from: string; to: string; metric: "sold" | "revenue"; limit: number }) {
  const res = await api.get("/api/v1/admin/metrics/top-books", { params });
  return (res.data?.data ?? []) as ResAdminTopBookDTO[];
}
export async function getCategorySales(params: { from: string; to: string; limit: number }) {
  const res = await api.get("/api/v1/admin/metrics/top-categories", { params });
  return (res.data?.data ?? []) as ResAdminCategorySalesDTO[];
}
