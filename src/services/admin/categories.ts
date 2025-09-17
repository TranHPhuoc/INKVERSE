// services/admin/categories.ts
import api from "../api";

export type ResCategoryFlat = {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
    leaf: boolean;
};

export type ResCategoryTreeDTO = {
    id: number;
    name: string;
    slug: string;
    children: ResCategoryTreeDTO[];
};

export type ReqCategoryCreate = {
    name: string;
    parentId?: number | null;
    parentSlug?: string | null;
};

function unwrap<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
        return payload.data as T;
    }
    return payload as T;
}


export async function listFlatCategories(): Promise<ResCategoryFlat[]> {
    const res = await api.get(`/api/v1/admin/categories/flat`);
    return unwrap<ResCategoryFlat[]>(res.data);
}


export async function listTreeCategories(): Promise<ResCategoryTreeDTO[]> {
    const res = await api.get(`/api/v1/admin/categories`);
    return unwrap<ResCategoryTreeDTO[]>(res.data);
}

export async function createCategory(payload: ReqCategoryCreate) {
    const res = await api.post(`/api/v1/admin/categories`, payload);
    // BE trả CategoryDTO bọc/không bọc đều ok
    return unwrap<any>(res.data);
}

export async function listAdminCategories() {
    return listFlatCategories();
}

export async function createAdminCategory(payload: { name: string; slug?: string; parent?: { id: number } | null }) {
    const req: ReqCategoryCreate = {
        name: payload.name,
        parentId: payload.parent?.id ?? null,
    };
    return createCategory(req);
}
