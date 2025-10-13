// src/services/bookTop.ts
import api from "./api";

/* ================== Types ================== */
export interface ResBookTopWithTrendDTO {
  category: string;
  bookId: number;
  title: string;
  authorNames: string;
  imageUrl?: string | null;
  sold: number;
  lastWeekSold: number;
  growthPercent: number;
  rank: number;
}

export type TopSellingMap = Record<string, ResBookTopWithTrendDTO[]>;

/* Book detail  */
export interface ResBookDetailDTO {
  id: number;
  slug?: string;
  title: string;
  authors?: { name: string }[];
  description?: string | null;
  price?: number | null;
  salePrice?: number | null;
  finalPrice?: number | null;
  images?: { url: string; sortOrder: number }[];
  thumbnail?: string | null;
  cover?: string | null;
  imageUrl?: string | null;
}

/* ================== API calls ================== */
export async function getTopSelling(limit = 5): Promise<TopSellingMap> {
  const res = await api.get(`/api/v1/books/top-selling`, { params: { limit } });

  const raw: unknown = (res as any)?.data?.data ?? (res as any)?.data;

  if (Array.isArray(raw)) {
    return raw.reduce<TopSellingMap>((acc, item: any) => {
      const key = (item.category as string) || "Khác";
      (acc[key] ||= []).push(item as ResBookTopWithTrendDTO);
      return acc;
    }, {});
  }

  if (raw && typeof raw === "object") {
    return raw as TopSellingMap;
  }

  return {};
}

export async function getBookDetailById(id: number): Promise<ResBookDetailDTO> {
  const res = await api.get(`/api/v1/books/${id}`);
  const raw: unknown = (res as any)?.data?.data ?? (res as any)?.data;
  return raw as ResBookDetailDTO;
}
