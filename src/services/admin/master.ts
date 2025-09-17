import api from "../api";

export type SimpleMaster = { id?: number; name: string; slug: string };

function unwrap<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
        return payload.data as T;
    }
    return payload as T;
}

export async function listAuthors() {
    const res = await api.get(`/admin/authors`);
    return unwrap<SimpleMaster[]>(res.data);
}
export async function createAuthor(payload: SimpleMaster) {
    const res = await api.post(`/admin/authors`, payload);
    return unwrap<SimpleMaster>(res.data);
}

export async function listPublishers() {
    const res = await api.get(`/admin/publishers`);
    return unwrap<SimpleMaster[]>(res.data);
}
export async function createPublisher(payload: SimpleMaster) {
    const res = await api.post(`/admin/publishers`, payload);
    return unwrap<SimpleMaster>(res.data);
}

export async function listSuppliers() {
    const res = await api.get(`/admin/suppliers`);
    return unwrap<SimpleMaster[]>(res.data);
}
export async function createSupplier(payload: SimpleMaster) {
    const res = await api.post(`/admin/suppliers`, payload);
    return unwrap<SimpleMaster>(res.data);
}
