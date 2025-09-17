import api from "./api";
import type { ReqCreateOrder, ResOrderCreated, ResOrderDetail, SpringPage } from "../types/order";

function unwrap<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
        return payload.data as T;
    }
    return payload as T;
}

export async function createOrder(payload: ReqCreateOrder) {
    const res = await api.post(`/api/v1/orders`, payload);
    return unwrap<ResOrderCreated>(res.data);
}

export async function getOrderByCode(code: string) {
    const res = await api.get(`/api/v1/orders/${encodeURIComponent(code)}`);
    return unwrap<ResOrderDetail>(res.data);
}

export async function listMyOrders(page = 0, size = 10) {
    const res = await api.get(`/api/v1/orders/me`, { params: { page, size } });
    return unwrap<SpringPage<ResOrderDetail>>(res.data);
}
