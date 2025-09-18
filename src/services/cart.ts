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

type CartChangedDetail = {
    totalItems?: number;   // vẫn gửi nếu muốn dùng chỗ khác
    uniqueItems?: number;  // HEADER dùng cái này
};

function emitCartChanged(detail?: CartChangedDetail) {
    try {
        const ev = new CustomEvent<CartChangedDetail>("cart:changed", { detail: detail ?? {} });
        window.dispatchEvent(ev);
    } catch {}
}

// đồng bộ cache nho nhỏ với Header
const BADGE_KEY = "CART_BADGE_COUNT";
function setBadgeCache(n: number) {
    localStorage.setItem(BADGE_KEY, String(Math.max(0, n | 0)));
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

/** Tính số unique items & total quantity (nếu cần) */
function calcTotals(summary: any) {
    const items = Array.isArray(summary?.items) ? summary.items : [];
    const unique = typeof summary?.uniqueItems === "number" ? summary.uniqueItems : items.length || 0;
    const total =
        summary?.totalItems ??
        summary?.totalQuantity ??
        (items.length ? items.reduce((s: number, it: any) => s + (it?.quantity ?? it?.qty ?? 0), 0) : 0);
    return { uniqueItems: unique, totalItems: total };
}

/** Phát event + cập nhật cache từ summary trả về */
function notifyFromSummary(summary: ResCartSummary | undefined) {
    if (!summary) {
        emitCartChanged();
        return;
    }
    const { uniqueItems, totalItems } = calcTotals(summary as any);
    // HEADER chỉ hiển thị unique
    setBadgeCache(uniqueItems);
    emitCartChanged({ uniqueItems, totalItems });
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

// “Mua ngay”
export async function addAndSelectOne(payload: ReqAddItem) {
    const res = await addCartItem(payload);
    const after = await updateCartItem(payload.bookId, { selected: true });
    return after ?? res;
}
