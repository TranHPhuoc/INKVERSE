import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useEnsureAddress from "../hooks/useEnsureAddress";
import { listMyAddresses, type Address } from "../services/account-address";
import { placeOrder, type PaymentMethod, type DeliveryMethod } from "../services/checkout";
import api from "../services/api";
import { motion } from "framer-motion";

/* ================= constants ================= */
const PAYMENT_METHODS: PaymentMethod[] = [
  "COD",
  "BANK_TRANSFER",
  "MOMO",
  "VNPAY",
  "ZALOPAY",
  "STRIPE",
];
const DELIVERY_METHODS: DeliveryMethod[] = ["STANDARD", "EXPRESS"];

/* ================= utils ================= */
const formatVND = (n: number) => (Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0");

type CartItem = {
  id: number;
  bookId: number;
  title: string;
  thumbnail?: string | null;
  price: number;
  qty: number;
};

// parse number từ nhiều kiểu unknown
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.replace(/[^\d.-]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// đọc thuộc tính an toàn từ object unknown
function read<T = unknown>(obj: unknown, key: string): T | undefined {
  if (obj && typeof obj === "object" && key in obj) {
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

  if (typeof line === "number" && qty > 0) return Math.round(line / qty);
  return 0;
}

function normalizeCart(payload: unknown): CartItem[] {
  const items: unknown[] = Array.isArray((payload as { items?: unknown[] })?.items)
    ? ((payload as { items?: unknown[] }).items as unknown[])
    : Array.isArray(payload)
      ? (payload as unknown[])
      : [];

  return items.map((raw, idx): CartItem => {
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
        null ??
        null,
      price: pickUnitPrice(x, b, qty),
      qty,
    };
  });
}

// lỗi API → message
function extractErr(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "response" in e) {
    const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

/* ================= component ================= */
export default function CheckoutPage() {
  const { checking, ready } = useEnsureAddress("/checkout");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | "">("");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [delivery, setDelivery] = useState<DeliveryMethod>("STANDARD");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  /* -------- Địa chỉ -------- */
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const list = await listMyAddresses();
        setAddresses(list);
        const def = list.find((x) => x.isDefault) ?? list[0];
        setAddressId(def?.id ?? "");
      } catch {
        setAddresses([]);
        setAddressId("");
      }
    })();
  }, [ready]);

  /* -------- Giỏ hàng -------- */
  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoadingCart(true);
      try {
        const res = await api.get("/api/v1/cart", { validateStatus: (s) => s < 500 });
        const payload = (res?.data as { data?: unknown })?.data ?? res?.data;
        setItems(normalizeCart(payload));
      } catch {
        setItems([]);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [ready]);

  const subTotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.qty, 0), [items]);

  const shippingFee = useMemo(() => {
    if (items.length === 0) return 0;
    return delivery === "EXPRESS" ? 35_000 : 20_000;
  }, [delivery, items.length]);

  const grandTotal = subTotal + shippingFee;

  const canPlace = useMemo(
    () => !!addressId && !!payment && !!delivery && items.length > 0 && !submitting,
    [addressId, payment, delivery, items.length, submitting],
  );

  async function onPlaceOrder() {
    if (!canPlace || addressId === "") return;
    try {
      setSubmitting(true);
      setErr(null);

      // Không truyền undefined khi dùng exactOptionalPropertyTypes
      const payload = {
        addressId: Number(addressId),
        paymentMethod: payment,
        deliveryMethod: delivery,
        ...(note.trim() ? { note: note.trim() } : {}),
      };

      const res = await placeOrder(payload);

      if (res && typeof res === "object" && "paymentRedirectUrl" in res) {
        const url = (res as { paymentRedirectUrl?: string }).paymentRedirectUrl;
        if (url) {
          window.location.href = url;
          return;
        }
      }
      if (res && typeof res === "object" && "code" in res) {
        const code = (res as { code?: string | number }).code;
        window.location.href = `/orders/${String(code ?? "")}`;
      } else {
        // fallback nếu API không trả expected fields
        window.location.href = "/orders";
      }
    } catch (e: unknown) {
      setErr(extractErr(e, "Đặt hàng thất bại"));
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Đang kiểm tra thông tin tài khoản &amp; địa chỉ...
      </div>
    );
  }
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <h1 className="mb-5 text-2xl font-semibold">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* LEFT: Product list */}
          <section className="flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Sản phẩm</h2>

            {loadingCart ? (
              <div className="flex-1 py-14 text-center text-base text-gray-500">
                Đang tải giỏ hàng…
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 py-14 text-center text-base text-gray-500">
                Không có sản phẩm nào để thanh toán.
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-start gap-5 py-4">
                      <img
                        src={it.thumbnail || "/placeholder.svg"}
                        alt={it.title}
                        className="h-36 w-28 rounded-lg border object-cover md:h-40 md:w-32"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-base leading-snug font-semibold md:text-lg">
                          {it.title}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">SL: {it.qty}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-rose-600 md:text-lg">
                          {formatVND(it.price * it.qty)} ₫
                        </div>
                        <div className="text-xs text-gray-500 md:text-sm">
                          {formatVND(it.price)} ₫ / sp
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto border-t pt-4">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-medium text-gray-700">Tạm tính</span>
                    <span className="font-semibold text-gray-900">{formatVND(subTotal)} ₫</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* RIGHT: Checkout form */}
          <aside className="space-y-4">
            <section className="space-y-5 rounded-2xl border bg-white p-5 text-[15px] leading-6 shadow-sm">
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
                  className="w-full cursor-pointer rounded-lg border px-3 py-2.5 text-[15px]"
                  value={addressId}
                  onChange={(e) => setAddressId(Number(e.target.value))}
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

              {/* Payment + Delivery */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-base font-medium">Phương thức thanh toán</label>
                  <select
                    className="w-full cursor-pointer rounded-lg border px-3 py-2.5 text-[15px]"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value as PaymentMethod)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-base font-medium">Vận chuyển</label>
                  <select
                    className="w-full cursor-pointer rounded-lg border px-3 py-2.5 text-[15px]"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value as DeliveryMethod)}
                  >
                    {DELIVERY_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
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
                  className="w-full rounded-lg border px-3 py-2.5 text-[15px]"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính…"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2 border-t pt-4 text-[15px]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Tạm tính</span>
                  <span className="font-medium">{formatVND(subTotal)} ₫</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Phí vận chuyển</span>
                  <span className="font-medium">{formatVND(shippingFee)} ₫</span>
                </div>
                <div className="flex items-center justify-between text-lg font-semibold">
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
