import axios from "axios";
import api from "../api";
import type {
    ResOrderAdmin,
    ReqUpdateOrderStatus,
    ReqUpdatePayment,
    ReqUpdateShipping,
    ReqAssignOrder,
    ReqCreateNote,
    ReqCancelOrder,
    ReqRefundManual,
    OrderStatus,
    PaymentStatus,
} from "../../types/sale-order";

type ApiResp<T> = {
    statusCode: number;
    message?: string | null;
    error?: unknown;
    data: T;
};

type Page<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort?: unknown;
    numberOfElements: number;
    first: boolean;
    last: boolean;
};

export type SearchParams = {
    q?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
    sort?: string;
};

const client = api ?? axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
    withCredentials: true,
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

function unwrap<T>(resp: { data: ApiResp<T> }): T {
    return resp.data?.data as T;
}

export async function saleSearchOrders(params: SearchParams) {
    const query: Record<string, any> = {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? "createdAt,desc",
    };
    if (params.q) query.q = params.q;
    if (params.status) query.status = params.status;
    if (params.paymentStatus) query.paymentStatus = params.paymentStatus;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;

    const r = await client.get<ApiResp<Page<ResOrderAdmin>>>("/api/v1/sales/orders", { params: query });
    return unwrap(r);
}

export async function saleGetOrder(id: number) {
    const r = await client.get<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}`);
    return unwrap(r);
}

export async function saleUpdateStatus(id: number, body: ReqUpdateOrderStatus) {
    const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/status`, body);
    return unwrap(r);
}

export async function saleUpdatePayment(id: number, body: ReqUpdatePayment) {
    const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/payment`, body);
    return unwrap(r);
}

export async function saleUpdateShipping(id: number, body: ReqUpdateShipping) {
    const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/shipping`, body);
    return unwrap(r);
}

export async function saleAssignOrder(id: number, body: ReqAssignOrder) {
    const r = await client.put<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/assign`, body);
    return unwrap(r);
}

export async function saleAddNote(id: number, body: ReqCreateNote) {
    await client.post<ApiResp<void>>(`/api/v1/sales/orders/${id}/notes`, body);
}

export async function saleCancelOrder(id: number, body: ReqCancelOrder) {
    const r = await client.post<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/cancel`, body);
    return unwrap(r);
}

export async function saleRefundManual(id: number, body: ReqRefundManual) {
    const r = await client.post<ApiResp<ResOrderAdmin>>(`/api/v1/sales/orders/${id}/refund-manual`, body);
    return unwrap(r);
}
