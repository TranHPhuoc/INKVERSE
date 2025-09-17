import api from "../api";

export type ResUser = {
    id: number;
    email: string;
    username: string;
    enabled?: boolean;
    roles?: string[];
    role?: string;
};

export type Page<T> = {
    content: T[];
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

type Envelope<T> = {
    statusCode: number;
    message?: string;
    data?: {
        meta?: { page?: number; pageSize?: number; pages?: number; total?: number };
        result?: T[];
    };
};

export async function listUsers(params: { page?: number; size?: number; sort?: string }) {
    const { page = 0, size = 10, sort = "id,desc" } = params || {};
    const res = await api.get("/api/v1/users", { params: { page, size, sort } });

    const body = res.data as Envelope<ResUser>;
    const items = body?.data?.result ?? [];
    const meta = body?.data?.meta ?? {};

    const pageObj: Page<ResUser> = {
        content: items,
        number: meta.page ?? page,
        size: meta.pageSize ?? size,
        totalElements: meta.total ?? items.length,
        totalPages: meta.pages ?? 1,
    };
    return pageObj;
}

export async function getUser(id: number) {
    const res = await api.get(`/api/v1/users/${id}`);
    return (res.data?.data ?? res.data) as ResUser;
}

export async function softDeleteUser(id: number) {
    await api.delete(`/api/v1/users/${id}`);
}

export async function hardDeleteUser(id: number) {
    await api.delete(`/api/v1/users/${id}/hard`);
}
