// src/services/admin/books-admin.ts
import api from "../api";
import type { BookDetail, SpringPage, BookListItem, ProductStatus } from "../../types/books";

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

type Direction = "ASC" | "DESC";

/* ---------- types ---------- */
export type RefId = number;

export type BookCreate = {
  title: string;
  slug: string;
  sku?: string | null;
  isbn13?: string | null;
  description?: string | null;

  publisherId: RefId;
  supplierId: RefId;
  authorIds: RefId[];
  categoryIds: RefId[];

  language: string;
  pageCount: number;
  publicationYear: number;
  widthCm: number;
  heightCm: number;
  thicknessCm: number;
  weightGram: number;
  coverType: string;
  ageRating: string;

  status: ProductStatus;
  price: number;
  salePrice?: number | null;
  saleStartAt?: string | null;
  saleEndAt?: string | null;

  images: { url: string; sortOrder: number }[];
  initialStock: number;
};

export type BookUpdate = Partial<BookCreate>;

export type ListReq = {
  page: number; // 0-based (API)
  size: number;
  sort?: string;
  direction?: Direction;
  status?: ProductStatus | ""; // empty => ignore
  q?: string; // when provided -> /search
};

/* ---------- calls ---------- */
export async function listBooks(params: ListReq): Promise<SpringPage<BookListItem>> {
  const query: Record<string, unknown> = {
    page: Math.max(0, params.page),
    size: params.size,
    sort: params.sort ?? "createdAt",
    direction: params.direction ?? "DESC",
  };
  if (params.status) query.status = params.status;

  const hasQ = !!params.q?.trim();
  if (hasQ) query.q = params.q!.trim();

  const url = hasQ ? "/api/v1/books/search" : "/api/v1/books";
  const res = await api.get(url, { params: query });
  return unwrap<SpringPage<BookListItem>>(res.data);
}

export async function createBook(payload: BookCreate): Promise<BookDetail> {
  const res = await api.post(`/api/v1/admin/books`, payload);
  return unwrap<BookDetail>(res.data);
}

export async function updateBook(id: number, payload: BookUpdate): Promise<BookDetail> {
  const res = await api.put(`/api/v1/admin/books/${id}`, payload);
  return unwrap<BookDetail>(res.data);
}

export async function deleteBook(id: number): Promise<void> {
  await api.delete(`/api/v1/admin/books/${id}`);
}

// re-exports if other files import from admin service
export type { SpringPage, BookListItem } from "../../types/books";
