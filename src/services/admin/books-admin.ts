import api from "../api";
import type { BookDetail, SpringPage, BookListItem } from "../../types/books";

function unwrap<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload) {
        const inner = (payload as any).data;
        // Nếu BE bọc RestResponse thì inner là object/array hợp lệ
        if (inner && (typeof inner === "object" || Array.isArray(inner))) {
            return inner as T;
        }
    }
    return payload as T;
}

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

    status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
    price: number;
    salePrice?: number | null;
    saleStartAt?: string | null;
    saleEndAt?: string | null;

    images: { url: string; sortOrder: number }[];
    initialStock: number;
};

export type BookUpdate = Partial<BookCreate>;

export async function listBooks(params: {
    page: number;
    size: number;
    sort?: string;
    direction?: "ASC" | "DESC";
    status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "";
    q?: string;
}) {
    const common: any = {
        page: Math.max(0, params.page),
        size: params.size,
        sort: params.sort || "createdAt",
        direction: params.direction || "DESC",
    };
    if (params.status) common.status = params.status;

    const hasQ = !!params.q?.trim();
    const url = hasQ ? "/api/v1/books/search" : "/api/v1/books";
    const res = await api.get(url, {
        params: hasQ ? { ...common, q: params.q!.trim() } : common,
    });

    return unwrap<SpringPage<BookListItem>>(res.data);
}

export async function createBook(payload: BookCreate) {
    const res = await api.post(`/api/v1/admin/books`, payload);
    return unwrap<BookDetail>(res.data);
}

export async function updateBook(id: number, payload: BookUpdate) {
    const res = await api.put(`/api/v1/admin/books/${id}`, payload);
    return unwrap<BookDetail>(res.data);
}

export async function deleteBook(id: number) {
    await api.delete(`/api/v1/admin/books/${id}`);
}

export type { SpringPage, BookListItem } from "../../types/books";
