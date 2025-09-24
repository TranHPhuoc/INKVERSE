// src/services/cart.ts
import api from "./api";
import type {
  ResCartSummary,
  ReqAddItem,
  ReqUpdateItem,
  ReqSelectAll,
  ClearReq,
} from "../types/cart";

/* ---------- helpers ---------- */
type ApiResp<T> = { statusCode?: number; message?: string | null; data: T };

function isApiResp<T>(v: unknown): v is ApiResp<T> {
  return typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);
}
function unwrap<T>(payload: unknown): T {
  return isApiResp<T>(payload) ? payload.data : (payload as T);
}

type CartChangedDetail = {
  totalItems?: number;
  uniqueItems?: number;
};

function emitCartChanged(detail?: CartChangedDetail) {
  // Không dùng try/catch rỗng; kiểm tra an toàn trước khi dispatch
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    const ev = new CustomEvent<CartChangedDetail>("cart:changed", { detail: detail ?? {} });
    window.dispatchEvent(ev);
  }
}

// đồng bộ nhỏ cho badge ở header
const BADGE_KEY = "CART_BADGE_COUNT";
function setBadgeCache(n: number) {
  localStorage.setItem(BADGE_KEY, String(Math.max(0, n | 0)));
}

function parseError(e: unknown): never {
  const err = e as { response?: { data?: { message?: string; error?: string } }; message?: string };
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message || "Có lỗi xảy ra";
  if (/Inventory not found/i.test(msg)) {
    throw new Error("Sản phẩm chưa có tồn kho hoặc đã hết hàng.");
  }
  if (/Out of stock/i.test(msg)) {
    throw new Error("Sản phẩm đã hết hàng.");
  }
  throw new Error(msg);
}

/* ---------- totals ---------- */
type ItemLike = { quantity?: number; qty?: number };
function calcTotals(summary: ResCartSummary) {
  const items: ItemLike[] = Array.isArray((summary as unknown as { items?: ItemLike[] }).items)
    ? (summary as unknown as { items: ItemLike[] }).items
    : [];

  const unique =
    typeof (summary as unknown as { uniqueItems?: number }).uniqueItems === "number"
      ? (summary as unknown as { uniqueItems: number }).uniqueItems
      : items.length || 0;

  const total =
    (summary as unknown as { totalItems?: number }).totalItems ??
    (summary as unknown as { totalQuantity?: number }).totalQuantity ??
    (items.length ? items.reduce((s, it) => s + Number(it.quantity ?? it.qty ?? 0), 0) : 0);

  return { uniqueItems: unique, totalItems: total };
}

function notifyFromSummary(summary: ResCartSummary | undefined) {
  if (!summary) {
    emitCartChanged();
    return;
  }
  const { uniqueItems, totalItems } = calcTotals(summary);
  // HEADER chỉ hiển thị unique
  setBadgeCache(uniqueItems);
  emitCartChanged({ uniqueItems, totalItems });
}

/* ---------- calls ---------- */
export async function getCart(): Promise<ResCartSummary> {
  const res = await api.get(`/api/v1/cart`);
  return unwrap<ResCartSummary>(res.data);
}

export async function addCartItem(payload: ReqAddItem): Promise<ResCartSummary> {
  try {
    const res = await api.post(`/api/v1/cart/items`, payload);
    const data = unwrap<ResCartSummary>(res.data);
    notifyFromSummary(data);
    return data;
  } catch (e) {
    parseError(e);
  }
}

export async function updateCartItem(
  bookId: number,
  payload: ReqUpdateItem,
): Promise<ResCartSummary> {
  try {
    const res = await api.put(`/api/v1/cart/items/${bookId}`, payload);
    const data = unwrap<ResCartSummary>(res.data);
    notifyFromSummary(data);
    return data;
  } catch (e) {
    parseError(e);
  }
}

export async function removeCartItem(bookId: number): Promise<ResCartSummary> {
  try {
    const res = await api.delete(`/api/v1/cart/items/${bookId}`);
    const data = unwrap<ResCartSummary>(res.data);
    notifyFromSummary(data);
    return data;
  } catch (e) {
    parseError(e);
  }
}

export async function clearCart(payload?: ClearReq): Promise<ResCartSummary> {
  try {
    const res = await api.post(`/api/v1/cart/clear`, payload ?? {});
    const data = unwrap<ResCartSummary>(res.data);
    notifyFromSummary(data);
    return data;
  } catch (e) {
    parseError(e);
  }
}

export async function selectAllCart(payload?: ReqSelectAll): Promise<ResCartSummary> {
  try {
    const res = await api.put(`/api/v1/cart/select-all`, payload ?? {});
    const data = unwrap<ResCartSummary>(res.data);
    notifyFromSummary(data);
    return data;
  } catch (e) {
    parseError(e);
  }
}

/** “Mua ngay”: thêm vào giỏ rồi chọn */
export async function addAndSelectOne(payload: ReqAddItem): Promise<ResCartSummary> {
  const first = await addCartItem(payload);
  const after = await updateCartItem(payload.bookId, { selected: true });
  return after ?? first;
}
