import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useEnsureAddress from "../hooks/useEnsureAddress";
import { listMyAddresses, type Address } from "../services/account-address";
import { placeOrder, type PaymentMethod, type DeliveryMethod } from "../services/checkout";
import api from "../services/api";
import { motion } from "framer-motion";
import PaymentMethodGrid from "../components/PaymentMethodGrid";
import { createVnpayCheckout, parseVnpayReturnRaw, type ResVnpReturn } from "../services/payment";
import { getOrderByCode } from "../services/order";

/* =============== helpers =============== */
const formatVND = (n: number) => (Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0");

type CartItem = {
  id: number;
  bookId: number;
  title: string;
  thumbnail?: string | null;
  price: number;
  qty: number;
};

type ApiResp<T> = { statusCode?: number; data: T };

type OrderLookup = {
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "CANCELED" | string;
};

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
  } catch {
    /* ignore */
  }
  try {
    window.location.replace(url);
    return;
  } catch {
    /* ignore */
  }
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

function extractVnpFields(v: ResVnpReturn | Record<string, unknown>): {
  orderCode: string;
  responseCode: string;
} {
  const code = read<string>(v, "orderCode") ?? read<string>(v, "orderCode2") ?? "";
  const rsp = read<string>(v, "responseCode") ?? read<string>(v, "responseCode2") ?? "";
  return { orderCode: code || "", responseCode: rsp || "" };
}

/* =============== component =============== */
type VnpStatus = "success" | "pending" | "fail" | null;

export default function CheckoutPage() {
  const { checking, ready } = useEnsureAddress("/checkout");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [delivery, setDelivery] = useState<DeliveryMethod>("STANDARD");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState<boolean>(true);

  // trạng thái banner thanh toán
  const [vnpStatus, setVnpStatus] = useState<VnpStatus>(null);
  const [vnpMessage, setVnpMessage] = useState<string>("");

  /* -------- Reset payment về COD nếu state cũ != COD/VNPAY -------- */
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

  /* -------- Giỏ hàng -------- */
  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoadingCart(true);
      try {
        const res = await api.get("/api/v1/cart", { validateStatus: (s: number) => s < 500 });
        const payload = unwrap<unknown>(res.data);
        setItems(normalizeCart(payload));
      } catch {
        setItems([]);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [ready]);

  const subTotal = useMemo(() => items.reduce((s, it) => s + it.price * it.qty, 0), [items]);
  const shippingFee = useMemo(
    () => (delivery === "EXPRESS" ? 35_000 : 30_000),
    [delivery, items.length],
  );
  const grandTotal = subTotal + shippingFee;
  const canPlace = addressId !== null && !!payment && !!delivery && items.length > 0 && !submitting;

  useEffect(() => {
    const qs = window.location.search;
    if (!qs.includes("vnp_")) return;

    (async () => {
      try {
        const ret = await parseVnpayReturnRaw(qs);
        const { orderCode, responseCode } = extractVnpFields(ret);

        window.history.replaceState({}, "", "/checkout");

        if (!orderCode) {
          setVnpStatus(responseCode === "00" ? "pending" : "fail");
          setVnpMessage(
            responseCode === "00"
              ? "VNPay báo thành công, đang chờ xác nhận."
              : "Thanh toán VNPay thất bại. Vui lòng thử lại.",
          );
          return;
        }

        let paid = false;
        for (let i = 0; i < 5 && !paid; i++) {
          try {
            const o: OrderLookup = await getOrderByCode(orderCode);
            paid = o?.paymentStatus === "PAID";
          } catch {
            /* noop */
          }
          if (!paid) await new Promise((r) => setTimeout(r, 1200));
        }

        if (paid) {
          setVnpStatus("success");
          setVnpMessage("Thanh toán thành công. Hãy quay về Trang chủ để tiếp tục mua sắm.");
        } else if (responseCode === "00") {
          setVnpStatus("pending");
          setVnpMessage("VNPay đã ghi nhận. Đang chờ hệ thống xác nhận thanh toán.");
        } else {
          setVnpStatus("fail");
          setVnpMessage("Thanh toán VNPay không thành công.");
        }
      } catch {
        // Nếu call BE fail, vẫn xoá param & báo lỗi nhẹ
        window.history.replaceState({}, "", "/checkout");
        setVnpStatus("fail");
        setVnpMessage("Không đọc được kết quả thanh toán VNPay.");
      }
    })();
  }, []);

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
        const returnUrl = `${window.location.origin}/#/checkout?skipIntro=1`;
        const { checkoutUrl } = await createVnpayCheckout(orderCode, returnUrl);
        hardRedirect(checkoutUrl);
        return;
      }

      window.location.href = `/orders/${orderCode}`;
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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <h1 className="mb-5 text-2xl font-semibold">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT */}
          <section className="flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Sản phẩm</h2>
            {loadingCart ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse gap-4">
                    <div className="h-28 w-20 rounded bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 py-14 text-center text-base text-gray-500">
                Không có sản phẩm nào để thanh toán.
              </div>
            ) : (
              <div className="flex-1 divide-y">
                {items.map((it) => (
                  <div key={it.id} className="flex items-start gap-5 py-4">
                    <img
                      src={it.thumbnail || "/placeholder.svg"}
                      alt={it.title}
                      className="h-28 w-20 rounded-lg border object-cover md:h-36 md:w-28"
                      loading="lazy"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.src = "/placeholder.svg";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-base font-semibold">{it.title}</div>
                      <div className="mt-1 text-sm text-gray-500">SL: {it.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-rose-600">
                        {formatVND(it.price * it.qty)} ₫
                      </div>
                      <div className="text-xs text-gray-500">{formatVND(it.price)} ₫ / sp</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RIGHT */}
          <aside className="space-y-4">
            <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
              {/* VNPay banner */}
              {vnpStatus && (
                <div
                  className={
                    "rounded-xl border px-4 py-3 text-sm " +
                    (vnpStatus === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : vnpStatus === "pending"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-rose-200 bg-rose-50 text-rose-800")
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {vnpStatus === "success"
                        ? "Thanh toán thành công"
                        : vnpStatus === "pending"
                          ? "Đang chờ xác nhận"
                          : "Thanh toán thất bại"}
                    </p>
                    <div className="flex gap-2">
                      {vnpStatus === "success" && (
                        <button
                          onClick={() => (window.location.href = "/")}
                          className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-white hover:opacity-90"
                        >
                          Quay về trang chủ
                        </button>
                      )}
                      {vnpStatus === "pending" && (
                        <button
                          onClick={() => (window.location.href = "/don-hang")}
                          className="rounded-lg bg-amber-600 px-3 py-1.5 text-white hover:opacity-90"
                        >
                          Xem đơn hàng
                        </button>
                      )}
                      {vnpStatus === "fail" && (
                        <button
                          onClick={() => setVnpStatus(null)}
                          className="rounded-lg border px-3 py-1.5 hover:bg-white/60"
                        >
                          Đóng
                        </button>
                      )}
                    </div>
                  </div>
                  {vnpMessage && <div className="mt-1 text-[13px] opacity-90">{vnpMessage}</div>}
                </div>
              )}

              {/* Address */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-2 block text-base font-medium">Địa chỉ nhận hàng</label>
                  <Link
                    className="text-xs text-indigo-600 hover:underline"
                    to="/tai-khoan/dia-chi?return=/checkout"
                  >
                    Quản lý địa chỉ
                  </Link>
                </div>
                <select
                  className="w-full rounded-lg border px-3 py-2.5"
                  value={addressId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAddressId(v ? Number(v) : null);
                  }}
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

              {/* Payment & Delivery */}
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-base font-medium">Phương thức thanh toán</label>
                  <PaymentMethodGrid value={payment} onChange={setPayment} className="mt-1" />
                </div>
                <div>
                  <label className="mb-2 block text-base font-medium">Phương thức vận chuyển</label>
                  <select
                    className="w-full rounded-lg border px-3 py-2.5"
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
              </div>

              {/* Note */}
              <div>
                <label className="mb-2 block text-base font-medium">Ghi chú</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2.5"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-medium">{formatVND(subTotal)} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium">{formatVND(shippingFee)} ₫</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
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
                {submitting ? "Đang đặt..." : "Đặt hàng"}
              </motion.button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
