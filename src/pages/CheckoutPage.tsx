import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useEnsureAddress from "../hooks/useEnsureAddress";
import { listMyAddresses, type Address } from "../services/account-address";
import { placeOrder, type PaymentMethod, type DeliveryMethod } from "../services/checkout";
import api from "../services/api";
import { motion } from "framer-motion";
import PaymentMethodGrid from "../components/PaymentMethodGrid";
import { createVnpayCheckout } from "../services/payment";

/* =============== helpers =============== */
const formatVND = (n: number) => (Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0");
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

type CartItem = {
  id: number;
  bookId: number;
  title: string;
  thumbnail?: string | null;
  price: number;
  qty: number;
  selected?: boolean;
};

type ApiResp<T> = { statusCode?: number; data: T };

type PlaceOrderResult =
  | { code: string }
  | { code: number }
  | { orderCode: string }
  | { id: number; code?: string | number };

function isApiResp<T>(v: unknown): v is ApiResp<T> {
  return typeof v === "object" && v !== null && "data" in (v as Record<string, unknown>);
}
function unwrap<T>(payload: unknown): T {
  return isApiResp<T>(payload) ? payload.data : (payload as T);
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function toBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return v === "true" || v === "1";
  return undefined;
}

function read<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
    return (obj as Record<string, T | undefined>)[key];
  }
  return undefined;
}

function pickUnitPrice(
  x: Record<string, unknown>,
  b: Record<string, unknown>,
  qty: number,
): number {
  const candidates = [
    read(x, "unitPrice"),
    read(x, "price"),
    read(x, "effectivePrice"),
    read(x, "sellingPrice"),
    read(x, "salePrice"),
    read(x, "originalPrice"),
    read(b, "effectivePrice"),
    read(b, "price"),
    read(b, "sellingPrice"),
    read(b, "salePrice"),
    read(read(x, "price"), "amount"),
    read(read(b, "price"), "amount"),
  ].map(toNumber);

  const found = candidates.find((v) => typeof v === "number");
  if (typeof found === "number") return found;

  const line =
    toNumber(read(x, "lineTotal")) ??
    toNumber(read(x, "subtotal")) ??
    toNumber(read(x, "subTotal")) ??
    toNumber(read(x, "total")) ??
    toNumber(read(x, "amount"));

  return typeof line === "number" && qty > 0 ? Math.round(line / qty) : 0;
}

function normalizeCart(payload: unknown): CartItem[] {
  const arr: unknown[] = Array.isArray((payload as { items?: unknown[] })?.items)
    ? ((payload as { items?: unknown[] }).items as unknown[])
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  return arr.map((raw, idx): CartItem => {
    const x = (raw as Record<string, unknown>) || {};
    const b = (read<Record<string, unknown>>(x, "book") ??
      read<Record<string, unknown>>(x, "product") ??
      {}) as Record<string, unknown>;
    const qty = Number(read(x, "qty") ?? read(x, "quantity") ?? 1) || 1;

    const maybeSelected = toBool(read(x, "selected"));

    return {
      id: Number(read(x, "id") ?? idx + 1),
      bookId: Number(read(x, "bookId") ?? read(b, "id") ?? read(x, "productId") ?? 0),
      title: String(read(x, "title") ?? read(b, "title") ?? "Sản phẩm"),
      thumbnail:
        read<string | null>(x, "thumbnail") ??
        read<string | null>(b, "thumbnail") ??
        read<string | null>(b, "imageUrl") ??
        null,
      price: pickUnitPrice(x, b, qty),
      qty,
      ...(typeof maybeSelected === "boolean" ? { selected: maybeSelected } : {}),
    };
  });
}

function extractErr(e: unknown, fallback: string): string {
  if (
    e &&
    typeof e === "object" &&
    "response" in (e as Record<string, unknown>) &&
    (e as { response?: { data?: { message?: string } } }).response
  ) {
    const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function hardRedirect(url: string) {
  try {
    window.location.assign(url);
    return;
  } catch {/**/}
  try {
    window.location.replace(url);
    return;
  } catch {/**/}
  window.location.href = url;
}

function getCodeFromPlaceOrder(res: unknown): string | null {
  const r = res as PlaceOrderResult;
  if (r && typeof r === "object") {
    if ("code" in r) {
      const c = (r as { code?: string | number }).code;
      if (typeof c === "string") return c;
      if (typeof c === "number") return String(c);
    }
    if ("orderCode" in r && typeof (r as { orderCode?: string }).orderCode === "string") {
      return (r as { orderCode: string }).orderCode;
    }
  }
  return null;
}

/* =============== component =============== */
export default function CheckoutPage() {
  const { checking, ready } = useEnsureAddress("/checkout");
  const location = useLocation();
  const selectedIdsFromCart = (location.state?.selectedIds as number[] | undefined) ?? undefined;
  const selectedIdSet = useMemo(
    () => (selectedIdsFromCart && selectedIdsFromCart.length ? new Set(selectedIdsFromCart) : null),
    [selectedIdsFromCart],
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [delivery, setDelivery] = useState<DeliveryMethod>("STANDARD");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState<boolean>(true);

  useEffect(() => {
    if (payment !== "COD" && payment !== "VNPAY") setPayment("COD");
  }, [payment]);

  /* -------- Địa chỉ -------- */
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const list = await listMyAddresses();
        setAddresses(list);
        const def = list.find((x) => x.isDefault) ?? list[0];
        setAddressId(def?.id ?? null);
      } catch {
        setAddresses([]);
        setAddressId(null);
      }
    })();
  }, [ready]);

  /* -------- Giỏ hàng (lọc theo selectedIds/flag) -------- */
  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoadingCart(true);
      try {
        const res = await api.get("/api/v1/cart");
        const payload = unwrap<unknown>(res.data);
        const all = normalizeCart(payload);

        let filtered: CartItem[] | null = null;
        if (selectedIdSet) filtered = all.filter((it) => selectedIdSet.has(it.bookId));
        if (!filtered || filtered.length === 0) {
          const byFlag = all.filter((it) => it.selected === true);
          if (byFlag.length > 0) filtered = byFlag;
        }
        setItems(filtered && filtered.length > 0 ? filtered : all);
      } catch {
        setItems([]);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [ready, selectedIdSet]);

  /* -------- totals -------- */
  const subTotal = useMemo(
    () => items.reduce((s, it) => s + num(it.price) * num(it.qty), 0),
    [items],
  );
  const shippingFee = delivery === "EXPRESS" ? 35_000 : 30_000;
  const grandTotal = subTotal + shippingFee;
  const canPlace = addressId !== null && !!payment && !!delivery && items.length > 0 && !submitting;

  /* -------- Place order -------- */
  async function onPlaceOrder() {
    if (!canPlace || addressId == null) return;
    try {
      setSubmitting(true);
      setErr(null);

      const payload = {
        addressId,
        paymentMethod: payment,
        deliveryMethod: delivery,
        ...(note.trim() ? { note: note.trim() } : {}),
      } as const;

      const res = await placeOrder(payload);
      const orderCode = getCodeFromPlaceOrder(res);
      if (!orderCode) throw new Error("Không nhận được mã đơn hàng");

      if (payment === "VNPAY") {
        sessionStorage.setItem("intro.skip.once", "1");
        const returnUrl = `${window.location.origin}/payment/vnpay/return?vnp_cb=1&skipIntro=1`;
        const { checkoutUrl } = await createVnpayCheckout(orderCode, returnUrl);
        hardRedirect(checkoutUrl);
        return;
      }

      window.location.href = `/order-success?code=${orderCode}&skipIntro=1`;
    } catch (e: unknown) {
      setErr(extractErr(e, "Đặt hàng thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  /* -------- render -------- */
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Đang kiểm tra tài khoản & địa chỉ...
      </div>
    );
  }
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h1 className="mb-8 text-3xl font-semibold text-gray-800">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* LEFT */}
          <section className="self-start rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h2 className="mb-5 text-xl font-semibold text-gray-800">Sản phẩm</h2>

            {loadingCart ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse gap-4">
                    <div className="h-28 w-20 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                Không có sản phẩm nào để thanh toán.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((it) => (
                  <div
                    key={`${it.bookId}-${it.id}`}
                    className="flex items-start gap-5 rounded-xl px-2 py-5 transition hover:bg-gray-50"
                  >
                    <img
                      src={it.thumbnail || "/placeholder.svg"}
                      alt={it.title}
                      className="h-28 w-20 rounded-lg border border-gray-100 object-cover shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.src = "/placeholder.svg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-base font-semibold text-gray-800">
                        {it.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">Số lượng: {it.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-rose-600">
                        {formatVND(num(it.price) * num(it.qty))} ₫
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatVND(num(it.price))} ₫ / sản phẩm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT */}
          <aside className="space-y-5 rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            {/* Địa chỉ */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-base font-medium text-gray-800">Địa chỉ nhận hàng</label>
                <Link
                  className="text-sm text-indigo-600 hover:underline"
                  to="/tai-khoan/dia-chi?return=/checkout"
                >
                  Quản lý
                </Link>
              </div>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-100"
                value={addressId ?? ""}
                onChange={(e) => setAddressId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="" disabled>
                  -- Chọn địa chỉ --
                </option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} • {a.phone} — {a.line1}, {a.ward}, {a.district}, {a.province}
                    {a.isDefault ? " (mặc định)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Thanh toán */}
            <div>
              <label className="mb-2 block text-base font-medium text-gray-800">
                Phương thức thanh toán
              </label>
              <PaymentMethodGrid value={payment} onChange={setPayment} />
            </div>

            {/* Giao hàng */}
            <div>
              <label className="mb-2 block text-base font-medium text-gray-800">
                Phương thức vận chuyển
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-100"
                value={delivery}
                onChange={(e) => setDelivery(e.target.value as DeliveryMethod)}
              >
                <option value="STANDARD">Tiêu chuẩn</option>
                <option value="EXPRESS">Hỏa tốc</option>
              </select>
              <div className="mt-1 text-xs text-gray-500">
                Phí ước tính: {formatVND(shippingFee)} ₫
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="mb-2 block text-base font-medium text-gray-800">Ghi chú</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-100"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú cho đơn hàng..."
              />
            </div>

            {/* Tổng */}
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span>Tạm tính</span>
                <span>{formatVND(subTotal)} ₫</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span>Phí vận chuyển</span>
                <span>{formatVND(shippingFee)} ₫</span>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 text-lg font-semibold text-gray-800">
                <span>Tổng thanh toán</span>
                <span className="text-rose-600">{formatVND(grandTotal)} ₫</span>
              </div>
            </div>

            {err && <div className="text-sm text-rose-600">{err}</div>}

            <motion.button
              disabled={!canPlace}
              onClick={onPlaceOrder}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-12 w-full cursor-pointer rounded-lg bg-rose-600 text-base font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {" "}
              {submitting ? "Đang đặt..." : "Đặt hàng"}{" "}
            </motion.button>
          </aside>
        </div>
      </div>
    </div>
  );
}
