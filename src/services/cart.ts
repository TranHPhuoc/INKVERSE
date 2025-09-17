// src/services/cart.ts
import api from "./api";
import type {
    ResCartSummary,
    ReqAddItem,
    ReqUpdateItem,
    ReqSelectAll,
    ClearReq,
} from "../types/cart";

function unwrap<T>(payload: any): T {
    if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
        return payload.data as T;
    }
    return payload as T;
}

// ---- NEW: emit kèm detail để Header cập nhật tức thì ----
type CartChangedDetail = {
    totalItems?: number;      // tổng quantity (nếu BE trả)
    uniqueItems?: number;     // số dòng khác nhau trong giỏ
};

function emitCartChanged(detail?: CartChangedDetail) {
    try {
        const ev = new CustomEvent<CartChangedDetail>("cart:changed", { detail: detail ?? {} });
        window.dispatchEvent(ev);
    } catch {
        // noop
    }
}

function parseError(e: any): never {
    const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Có lỗi xảy ra";
    if (/Inventory not found/i.test(msg)) throw new Error("Sản phẩm chưa có tồn kho hoặc đã hết hàng.");
    if (/Out of stock/i.test(msg)) throw new Error("Sản phẩm đã hết hàng.");
    throw new Error(msg);
}


export async function getCart() {
    const res = await api.get(`/api/v1/cart`);
    return unwrap<ResCartSummary>(res.data);
}

// tiện: tạo helper phát event từ summary
function notifyFromSummary(summary: ResCartSummary | undefined) {
    if (!summary) return emitCartChanged();
    const unique = Array.isArray((summary as any).items) ? (summary as any).items.length : undefined;
    const total = (summary as any).totalItems as number | undefined;
    emitCartChanged({ uniqueItems: unique, totalItems: total });
}

export async function addCartItem(payload: ReqAddItem) {
    try {
        const res = await api.post(`/api/v1/cart/items`, payload);
        const data = unwrap<ResCartSummary>(res.data);
        notifyFromSummary(data);
        return data;
    } catch (e) {
        parseError(e);
    }
}

export async function updateCartItem(bookId: number, payload: ReqUpdateItem) {
    try {
        const res = await api.put(`/api/v1/cart/items/${bookId}`, payload);
        const data = unwrap<ResCartSummary>(res.data);
        notifyFromSummary(data);
        return data;
    } catch (e) {
        parseError(e);
    }
}

export async function removeCartItem(bookId: number) {
    try {
        const res = await api.delete(`/api/v1/cart/items/${bookId}`);
        const data = unwrap<ResCartSummary>(res.data);
        notifyFromSummary(data);
        return data;
    } catch (e) {
        parseError(e);
    }
}

export async function clearCart(payload?: ClearReq) {
    try {
        const res = await api.post(`/api/v1/cart/clear`, payload ?? {});
        const data = unwrap<ResCartSummary>(res.data);
        notifyFromSummary(data);
        return data;
    } catch (e) {
        parseError(e);
    }
}

export async function selectAllCart(payload?: ReqSelectAll) {
    try {
        const res = await api.put(`/api/v1/cart/select-all`, payload ?? {});
        const data = unwrap<ResCartSummary>(res.data);
        notifyFromSummary(data);
        return data;
    } catch (e) {
        parseError(e);
    }
}

// Giữ nguyên flow “mua ngay”
export async function addAndSelectOne(payload: ReqAddItem) {
    const res = await addCartItem(payload);
    const after = await updateCartItem(payload.bookId, { selected: true });
    return after ?? res;
}
