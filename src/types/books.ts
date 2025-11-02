// src/types/books.ts
import api from "../services/api.ts";

function unwrap<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function toZeroBased(page?: number) {
  const p = Number(page ?? 1);
  return Math.max(0, p - 1);
}

function sanitizeQ(q: string | undefined | null) {
  const s = (q ?? "").trim();
  return s.length > 128 ? s.slice(0, 128) : s;
}

function compactParams(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

const SORT_MAP: Record<string, string> = {
  sold: "inventory.sold",
  "inventory.sold": "inventory.sold",

  price: "price",
  createdAt: "createdAt",
  updatedAt: "updatedAt",

};

function mapSort(sort?: string): string | undefined {
  if (!sort) return undefined;
  return SORT_MAP[sort] ?? sort;
}



/* ---------------------------------------------------
 * Types
 * --------------------------------------------------- */
export type IdName = { id: number; name: string; slug?: string | null };

export type BookListItem = {
  id: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  salePrice: number | null;
  saleStartAt: string | null;
  saleEndAt: string | null;
  effectivePrice: number;
  sold: number;
  likedByMe?: boolean;
  favoriteCount?: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  createdAt: string | null;
};

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type BookDetail = {
  id: number;
  title: string;
  slug: string;
  sku: string | null;
  isbn13: string | null;
  description: string | null;
  publisher: { id: number; name: string; slug: string | null } | null;
  supplier: { id: number; name: string; slug: string | null } | null;
  authors: { id: number; name: string; slug: string | null }[];
  categories: { id: number; name: string; slug: string | null }[];
  pageCount: number | null;
  publicationYear: number | null;
  language: string | null;
  weightGram: number | null;
  widthCm: number | null;
  heightCm: number | null;
  thicknessCm: number | null;
  coverType: string | null;
  ageRating: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | null;
  price: number;
  salePrice: number | null;
  saleStartAt: string | null;
  saleEndAt: string | null;
  effectivePrice: number;
  images: { id: number; url: string; sortOrder: number }[];
  stock: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
  likedByMe?: boolean;
  favoriteCount?: number;
};

export type HomeFeed = {
  featuredSale: BookListItem[];
  newArrivals: BookListItem[];
  bestSellers: BookListItem[];
  byCategories: {
    categoryId: number;
    categoryName: string;
    items: BookListItem[];
  }[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  parentId?: number | null;
};

export type CategoryTree = {
  id: number;
  name: string;
  slug: string;
  children: CategoryTree[];
};

/* ---------------------------------------------------
 * Public categories
 * --------------------------------------------------- */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  try {
    const res = await api.get("/api/v1/categories/tree", {
      validateStatus: (s) => s < 500,
    });
    const data = unwrap<CategoryTree[] | null>(res.data);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<CategoryTree[]> {
  return getCategoryTree();
}

/* ---------------------------------------------------
 * Listing & search
 * --------------------------------------------------- */
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
export type LanguageKey = "VI" | "EN" | "JA" | "ZH" | "KO" | string;
export type AgeBoundKey = "ALL" | "6" | "12" | "16" | "18";

export type CatalogFilters = {
  publisher?: string;
  supplier?: string;
  language?: LanguageKey;
  status?: ProductStatus;
  priceMin?: number;
  priceMax?: number;
  ageMin?: AgeBoundKey;
  ageMax?: AgeBoundKey;

  sort?: string;
  direction?: "ASC" | "DESC";
};

function ageKeyToYears(k?: AgeBoundKey): number | undefined {
  if (!k || k === "ALL") return undefined;
  const n = Number(k);
  return Number.isNaN(n) ? undefined : n;
}

export type ListParams = {
  status?: ProductStatus;
  authorId?: number;
  categoryId?: number;
  publisherId?: number;
  supplierId?: number;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
};

export type SearchBookReq = ListParams & { q: string };

/** Catalog theo category slug + filter nâng cao */
export async function listByCategorySlug(
  catSlug: string,
  page = 1,
  size = 15,
  filters?: CatalogFilters,
): Promise<SpringPage<BookListItem>> {
  const qp = compactParams({
    category: catSlug,
    page: toZeroBased(page),
    size,
    publisher: filters?.publisher,
    supplier: filters?.supplier,
    language: filters?.language,
    status: filters?.status,
    priceMin: filters?.priceMin,
    priceMax: filters?.priceMax,
    ageMinYears: ageKeyToYears(filters?.ageMin),
    ageMaxYears: ageKeyToYears(filters?.ageMax),
    sort: mapSort(filters?.sort),
    direction: filters?.direction,
  });
  const res = await api.get("/api/v1/books/catalog", { params: qp });
  return unwrap<SpringPage<BookListItem>>(res.data);
}

/** Danh sách sách theo filter  */
export async function listBooks(params: ListParams): Promise<SpringPage<BookListItem>> {
  const {
    page = 1,
    size = 15,
    sort = "createdAt",
    direction = "DESC",
    status,
    authorId,
    categoryId,
    publisherId,
    supplierId,
  } = params;

  const qp = compactParams({
    page: toZeroBased(page),
    size,
    sort: mapSort(sort),
    direction,
    status,
    authorId,
    categoryId,
    publisherId,
    supplierId,
  });

  const res = await api.get("/api/v1/books", { params: qp });
  return unwrap<SpringPage<BookListItem>>(res.data);
}

/** Search theo keyword + filter  */
export async function searchBooks(params: SearchBookReq): Promise<SpringPage<BookListItem>> {
  const {
    q,
    page = 1,
    size = 15,
    sort = "createdAt",
    direction = "DESC",
    status,
    authorId,
    categoryId,
    publisherId,
    supplierId,
  } = params;

  const keyword = sanitizeQ(q);

  if (!keyword) {
    return listBooks({
      page,
      size,
      sort,
      direction,
      ...(status !== undefined ? { status } : {}),
      ...(authorId !== undefined ? { authorId } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(publisherId !== undefined ? { publisherId } : {}),
      ...(supplierId !== undefined ? { supplierId } : {}),
    });
  }

  const qp = compactParams({
    q: keyword,
    page: toZeroBased(page),
    size,
    sort: mapSort(sort),
    direction,
    status,
    authorId,
    categoryId,
    publisherId,
    supplierId,
  });

  const res = await api.get("/api/v1/books/search", { params: qp });
  return unwrap<SpringPage<BookListItem>>(res.data);
}

/* ---------------------------------------------------
 * Home feed
 * --------------------------------------------------- */
export async function getHomeFeed(opts?: {
  status?: ProductStatus;
  featuredSize?: number;
  newSize?: number;
  bestSize?: number;
  categoryIds?: number[];
  perCategory?: number;
}): Promise<HomeFeed> {
  const params = compactParams({
    status: (opts?.status ?? "ACTIVE").toString().toUpperCase(),
    featuredSize: opts?.featuredSize,
    newSize: opts?.newSize,
    bestSize: opts?.bestSize,
    categoryIds: opts?.categoryIds && opts?.categoryIds.length ? opts.categoryIds : undefined,
    perCategory: opts?.perCategory ?? 8,
  });

  const res = await api.get("/api/v1/books/home", { params });
  return unwrap<HomeFeed>(res.data);
}

/* ---------------------------------------------------
 * Detail endpoints
 * --------------------------------------------------- */
/**
 * Lấy chi tiết theo slug.
 */
export async function getBookDetailBySlug(bookSlug: string): Promise<BookDetail> {
  const res = await api.get(`/api/v1/books/slug/${encodeURIComponent(bookSlug)}`);
  return unwrap<BookDetail>(res.data);
}

/** Lấy chi tiết theo ID */
export async function getBookDetailById(id: number): Promise<BookDetail> {
  const res = await api.get(`/api/v1/books/${id}`);
  return unwrap<BookDetail>(res.data);
}

export async function getBookDetailSmart(slugOrId: string | number): Promise<BookDetail> {
  const n = typeof slugOrId === "number" ? slugOrId : Number(slugOrId);
  if (Number.isFinite(n) && n > 0) {
    return getBookDetailById(n);
  }
  return getBookDetailBySlug(String(slugOrId));
}
export async function getRelatedBooks(bookId: number, limit = 12): Promise<BookListItem[]> {
  const res = await api.get(`/api/v1/books/${bookId}/related`, {
    params: { limit },
  });
  return unwrap<BookListItem[]>(res.data);
}
export async function getAdminPublishers(): Promise<IdName[]> {
  try {
    const res = await api.get("/api/v1/admin/publishers", {
      validateStatus: (s) => s < 500,
    });
    // ResPublisher: { id, name, slug }
    const data = unwrap<IdName[] | null>(res.data);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function getAdminSuppliers(): Promise<IdName[]> {
  try {
    const res = await api.get("/api/v1/admin/suppliers", {
      validateStatus: (s) => s < 500,
    });
    const data = unwrap<IdName[] | null>(res.data);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}