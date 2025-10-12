// src/services/Admin/metrics.ts
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
  /** Chuỗi ngày chuẩn hoá từ BE (LocalDate) dạng "YYYY-MM-DD" */
  day: string;
  revenue: number;
  orders: number;
};

export type ResAdminTopBookDTO = {
  bookId: number;
  title: string;
  thumbnail: string | null;
  sold: number;
  revenue: number;
};

export type ResAdminCategorySalesDTO = {
  categoryId: number;
  categoryName: string;
  revenue: number;
};

/* ===== Helpers ===== */

// Một số endpoint trả {data: ...}, một số trả thẳng body
function pick<T>(body: unknown): T {
  const b = body as any;
  return (b?.data ?? b) as T;
}

/** Chuẩn hoá giá trị ngày từ BE (string | number | LocalDate object) -> "YYYY-MM-DD" */
function normalizeDay(input: unknown): string {
  if (typeof input === "string") return input; // "2025-10-08"
  if (typeof input === "number") return new Date(input).toISOString().slice(0, 10);
  if (typeof input === "object" && input !== null) {
    const obj = input as { year?: number; monthValue?: number; month?: number; dayOfMonth?: number; day?: number };
    if (obj.year) {
      const y = obj.year!;
      const m = (obj.monthValue ?? obj.month ?? 1) | 0;
      const d = (obj.dayOfMonth ?? obj.day ?? 1) | 0;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${y}-${pad(m)}-${pad(d)}`;
    }
  }
  return "";
}

/* ===== API calls (prefix /api/v1/Admin/metrics) ===== */

export async function getKpi(params: { from: string; to: string }): Promise<ResAdminKpiDTO> {
  const res = await api.get("/api/v1/admin/metrics/kpi", { params });
  return pick<ResAdminKpiDTO>(res.data);
}

export async function getRevenueDaily(params: { from: string; to: string }): Promise<ResAdminRevenuePointDTO[]> {
  const res = await api.get("/api/v1/admin/metrics/revenue/daily", { params });
  const raw = pick<Array<{ day: unknown; revenue: unknown; orders: unknown }>>(res.data) ?? [];
  return raw.map((r) => ({
    day: normalizeDay(r.day),
    revenue: Number(r.revenue ?? 0),
    orders: Number(r.orders ?? 0),
  }));
}

export async function getTopBooks(params: {
  from: string;
  to: string;
  metric: "sold" | "revenue";
  limit: number;
}): Promise<ResAdminTopBookDTO[]> {
  const res = await api.get("/api/v1/admin/metrics/top-books", { params });
  return pick<ResAdminTopBookDTO[]>(res.data) ?? [];
}

export async function getCategorySales(params: {
  from: string;
  to: string;
  limit: number;
}): Promise<ResAdminCategorySalesDTO[]> {
  const res = await api.get("/api/v1/admin/metrics/top-categories", { params });
  return pick<ResAdminCategorySalesDTO[]>(res.data) ?? [];
}
