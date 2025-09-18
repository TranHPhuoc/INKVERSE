import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useEnsureAddress from "../hooks/useEnsureAddress";
import { listMyAddresses, type Address } from "../services/account-address";
import { placeOrder, type PaymentMethod, type DeliveryMethod } from "../services/checkout";
import api from "../services/api";
import {motion} from "framer-motion";

const PAYMENT_METHODS: PaymentMethod[] = ["COD", "BANK_TRANSFER", "MOMO", "VNPAY", "ZALOPAY", "STRIPE"];
const DELIVERY_METHODS: DeliveryMethod[] = ["STANDARD", "EXPRESS"];

const formatVND = (n: number) => (Number.isFinite(n) ? n.toLocaleString("vi-VN") : "0");

type CartItem = {
    id: number;
    bookId: number;
    title: string;
    thumbnail?: string | null;
    price: number;
    qty: number;
};

function num(v: any): number | undefined {
    if (v == null) return undefined;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
        const s = v.replace(/[^\d.-]/g, "");
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function pickUnitPrice(x: any, b: any, qty: number): number {
    const candidates = [
        x?.unitPrice, x?.price, x?.effectivePrice, x?.sellingPrice, x?.salePrice, x?.originalPrice,
        b?.effectivePrice, b?.price, b?.sellingPrice, b?.salePrice,
        x?.price?.amount, b?.price?.amount,
    ].map(num);

    const found = candidates.find((v) => typeof v === "number");
    if (typeof found === "number") return found;

    const line =
        num(x?.lineTotal) ??
        num(x?.subtotal) ??
        num(x?.subTotal) ??
        num(x?.total) ??
        num(x?.amount);
    if (typeof line === "number" && qty > 0) return Math.round(line / qty);

    return 0;
}

function normalizeCart(payload: any): CartItem[] {
    const raw = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
    return raw.map((x: any, idx: number): CartItem => {
        const b = x.book || x.product || {};
        const qty = Number(x.qty ?? x.quantity ?? 1) || 1;

        return {
            id: Number(x.id ?? idx + 1),
            bookId: Number(x.bookId ?? b.id ?? x.productId ?? 0),
            title: String(x.title ?? b.title ?? "Sản phẩm"),
            thumbnail: x.thumbnail ?? b.thumbnail ?? b.imageUrl ?? null,
            price: pickUnitPrice(x, b, qty),
            qty,
        };
    });
}

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

    // Địa chỉ
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

    // Giỏ hàng
    useEffect(() => {
        if (!ready) return;
        (async () => {
            setLoadingCart(true);
            try {
                const res = await api.get("/api/v1/cart", { validateStatus: (s) => s < 500 });
                const payload = res?.data?.data ?? res?.data;
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
        return delivery === "EXPRESS" ? 35000 : 20000;
    }, [delivery, items.length]);

    const grandTotal = subTotal + shippingFee;

    const canPlace = useMemo(
        () => !!addressId && !!payment && !!delivery && items.length > 0 && !submitting,
        [addressId, payment, delivery, items.length, submitting]
    );

    async function onPlaceOrder() {
        if (!canPlace || addressId === "") return;
        try {
            setSubmitting(true);
            setErr(null);

            const res = await placeOrder({
                addressId: Number(addressId),
                paymentMethod: payment,
                deliveryMethod: delivery,
                note: note.trim() || undefined,
            });

            if ((res as any).paymentRedirectUrl) {
                window.location.href = (res as any).paymentRedirectUrl;
            } else {
                window.location.href = `/orders/${(res as any).code}`;
            }
        } catch (e: any) {
            setErr(e?.response?.data?.message || "Đặt hàng thất bại");
        } finally {
            setSubmitting(false);
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Đang kiểm tra thông tin tài khoản &amp; địa chỉ...
            </div>
        );
    }
    if (!ready) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
                <h1 className="text-2xl font-semibold mb-5">Thanh toán</h1>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
                    {/* LEFT: Product list */}
                    <section className="bg-white border rounded-2xl shadow-sm p-5 flex flex-col h-full">
                        <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>

                        {loadingCart ? (
                            <div className="flex-1 py-14 text-center text-gray-500 text-base">
                                Đang tải giỏ hàng…
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex-1 py-14 text-center text-gray-500 text-base">
                                Không có sản phẩm nào để thanh toán.
                            </div>
                        ) : (
                            <>
                                {/* danh sách sản phẩm */}
                                <div className="divide-y flex-1">
                                    {items.map((it) => (
                                        <div key={it.id} className="flex items-start gap-5 py-4">
                                            <img
                                                src={it.thumbnail || "/placeholder.svg"}
                                                alt={it.title}
                                                className="w-28 h-36 md:w-32 md:h-40 object-cover rounded-lg border"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-base md:text-lg leading-snug line-clamp-2">
                                                    {it.title}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">SL: {it.qty}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-rose-600 text-base md:text-lg">
                                                    {formatVND(it.price * it.qty)} ₫
                                                </div>
                                                <div className="text-xs md:text-sm text-gray-500">
                                                    {formatVND(it.price)} ₫ / sp
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t mt-auto">
                                    <div className="flex items-center justify-between text-base">
                                        <span className="text-gray-700 font-medium">Tạm tính</span>
                                        <span className="font-semibold text-gray-900">{formatVND(subTotal)} ₫</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>


                    {/* RIGHT: Checkout form */}
                    <aside className="space-y-4">
                        <section className="bg-white border rounded-2xl shadow-sm p-5 space-y-5 text-[15px] leading-6">
                            {/* Address */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-base font-medium mb-2">Địa chỉ nhận hàng</label>
                                    <Link className="text-xs text-indigo-600 hover:underline" to="/tai-khoan/dia-chi?return=/checkout">
                                        Quản lý địa chỉ
                                    </Link>
                                </div>
                                <select
                                    className="w-full border rounded-lg px-3 py-2.5 cursor-pointer text-[15px]"
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
                                    <label className="block text-base font-medium mb-2">Phương thức thanh toán</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2.5 cursor-pointer text-[15px]"
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
                                    <label className="block text-base font-medium mb-2">Vận chuyển</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2.5 cursor-pointer text-[15px]"
                                        value={delivery}
                                        onChange={(e) => setDelivery(e.target.value as DeliveryMethod)}
                                    >
                                        {DELIVERY_METHODS.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-1 text-xs text-gray-500">Phí ước tính: {formatVND(shippingFee)} ₫</div>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-base font-medium mb-2">Ghi chú</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2.5 text-[15px]"
                                    rows={3}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Ví dụ: Giao giờ hành chính…"
                                />
                            </div>

                            {/* Summary */}
                            <div className="border-t pt-4 space-y-2 text-[15px]">
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
                                className="w-full h-12 rounded-lg bg-rose-600 text-white text-base font-semibold
             disabled:opacity-60 hover:opacity-90 cursor-pointer cursor-pointer "
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
