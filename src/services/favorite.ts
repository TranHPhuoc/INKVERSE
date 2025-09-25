// src/services/favorite.ts
import api from "./api";
import type { BookListItem, ProductStatus } from "../types/books";

/* -------------------- helpers -------------------- */
type DataWrapper<T> = { data: T } & Record<string, unknown>;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function hasData<T>(v: unknown): v is DataWrapper<T> {
  return isObject(v) && "data" in v;
}
function unwrap<T>(payload: unknown): T {
  return hasData<T>(payload) ? payload.data : (payload as T);
}

/* -------------------- DTO từ BE -------------------- */
export type ResBookFavoriteDTO = {
  id: number;
  title: string;
  slug: string;
  coverUrl: string | null;
  price: string | number | null; // BigDecimal -> number/string
  effectivePrice: string | number | null; // BigDecimal -> number/string
  likedByMe: boolean;
  favoriteCount: number;
};

/* Page kiểu Spring */
export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

/* Item cho FE: mở rộng BookListItem + flag yêu thích */
export type FavoriteBookItem = BookListItem & {
  likedByMe: boolean;
  favoriteCount: number;
};

/* Map từ DTO -> item dùng cho ProductCard */
export function mapFavoriteDTO(b: ResBookFavoriteDTO): FavoriteBookItem {
  const price = Number(b.price ?? 0);
  const eff = Number(b.effectivePrice ?? price);

  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    thumbnail: b.coverUrl,

    price,
    effectivePrice: eff,

    // các field bắt buộc của BookListItem (API yêu thích không trả)
    salePrice: null,
    saleStartAt: null,
    saleEndAt: null,
    status: "ACTIVE" as ProductStatus,
    sold: 0,
    createdAt: null,

    // extra
    likedByMe: b.likedByMe,
    favoriteCount: b.favoriteCount,
  };
}

/* -------------------- APIs -------------------- */
export async function getMyFavorites(page = 0, size = 20): Promise<Page<FavoriteBookItem>> {
  const res = await api.get(`/api/v1/books/favorites/me`, {
    params: { page, size, sort: "id,desc" },
  });
  const raw = unwrap<Page<ResBookFavoriteDTO>>(res.data);
  return {
    ...raw,
    content: raw.content.map(mapFavoriteDTO),
  };
}

export type FavoriteToggleRes = { liked: boolean };

/** Toggle yêu thích (true = đã thích, false = đã bỏ thích) */
export async function toggleFavorite(bookId: number): Promise<boolean> {
  const res = await api.post(`/api/v1/books/favorites/${bookId}/toggle`);
  const body = unwrap<FavoriteToggleRes>(res.data);
  return !!body.liked;
}
