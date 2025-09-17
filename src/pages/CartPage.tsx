import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingCart, CheckSquare, Square, Loader2 } from "lucide-react";
import { getCart, updateCartItem, removeCartItem, clearCart, selectAllCart } from "../services/cart";
import type { ResCartSummary, ResCartItem } from "../types/cart";
import { vnd } from "../utils/currency";
import { Link, useNavigate } from "react-router-dom";
import useCheckoutGuard from "../hooks/useCheckoutGuard.tsx";

export default function CartPage() {
    const [data, setData] = useState<ResCartSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    const navigate = useNavigate();
    const guard = useCheckoutGuard("/checkout");

    const anySelected = useMemo(() => (data?.items ?? []).some((i) => i.selected), [data]);
    const allSelected = useMemo(() => {
        const items = data?.items ?? [];
        return items.length > 0 && items.every((i) => i.selected);
    }, [data]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await getCart();
                setData(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function handleToggleAll() {
        if (!data) return;
        setWorking(true);
        try {
            const next = await selectAllCart({ selected: !allSelected });
            setData(next);
        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    }

    async function handleToggleItem(it: ResCartItem) {
        setWorking(true);
        try {
            const next = await updateCartItem(it.bookId, { selected: !it.selected });
            setData(next);
        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    }

    async function handleQty(it: ResCartItem, delta: number) {
        const nextQty = it.qty + delta;
        setWorking(true);
        try {
            const next =
                nextQty <= 0 ? await updateCartItem(it.bookId, { qty: 0 }) : await updateCartItem(it.bookId, { qty: nextQty });
            setData(next);
        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    }

    async function handleRemove(bookId: number) {
        setWorking(true);
        try {
            const next = await removeCartItem(bookId);
            setData(next);
        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    }

    async function handleClear(all = false) {
        setWorking(true);
        try {
            const next = await clearCart(all ? { onlyUnselected: false } : { onlyUnselected: true });
            setData(next);
        } catch (e) {
            console.error(e);
        } finally {
            setWorking(false);
        }
    }

    /** NEW: đi tới checkout qua guard (bắt login + có địa chỉ) */
    async function handleCheckout() {
        if (!anySelected || !data) return;
        const ok = await guard.ensureReady();
        if (ok) navigate("/checkout");
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center text-gray-300">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                Đang tải giỏ hàng...
            </div>
        );
    }

    if (!data || data.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 p-10 text-center backdrop-blur">
                    <ShoppingCart className="mx-auto mb-4 h-10 w-10" />
                    <h1 className="mb-2 text-2xl font-semibold">Giỏ hàng trống</h1>
                    <p className="mb-6 text-gray-400">Tiếp tục mua sắm để thêm sản phẩm vào giỏ.</p>
                    <Link
                        to="/"
                        className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500 transition"
                    >
                        Về trang chủ
                    </Link>
                </div>

                {/* modal guard (không hiển thị nếu không cần) */}
                {guard.modal}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header actions */}
            <div className="mb-4 flex items-center justify-between">
                <button
                    onClick={handleToggleAll}
                    disabled={working}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50 transition"
                >
                    {allSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={() => handleClear(false)}
                        disabled={working}
                        className="rounded-xl border px-4 py-2 hover:bg-gray-50 transition"
                        title="Xoá các sản phẩm chưa chọn"
                    >
                        Xoá chưa chọn
                    </button>
                    <button
                        onClick={() => handleClear(true)}
                        disabled={working}
                        className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-500 transition"
                        title="Xoá toàn bộ giỏ"
                    >
                        <Trash2 className="h-5 w-5" />
                        Xoá tất cả
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* List */}
                <div className="lg:col-span-2 space-y-3">
                    {data.items.map((it) => (
                        <motion.div
                            key={it.bookId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-gray-50 transition"
                        >
                            <button onClick={() => handleToggleItem(it)} disabled={working} className="p-1" aria-label="toggle selected">
                                {it.selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                            </button>

                            <img
                                src={it.thumbnail ?? "/placeholder-160x240.png"}
                                alt={it.title}
                                className="h-20 w-14 rounded-lg object-cover"
                            />

                            <div className="flex-1">
                                <Link to={`/books/${it.slug}`} className="line-clamp-2 font-medium hover:underline">
                                    {it.title}
                                </Link>

                                <div className="mt-1 flex items-center gap-2">
                                    {it.onSale && <span className="text-sm text-gray-400 line-through">{vnd(it.originalUnitPrice)}</span>}
                                    <span className="font-semibold">{vnd(it.unitPrice)}</span>
                                    <span className="text-sm text-gray-400">• Còn {it.stockAvailable}</span>
                                </div>

                                <div className="mt-3 flex items-center gap-3">
                                    <div className="inline-flex items-center gap-2 rounded-xl border px-2 py-1">
                                        <button onClick={() => handleQty(it, -1)} disabled={working} className="p-1 hover:opacity-80">
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="min-w-6 text-center">{it.qty}</span>
                                        <button
                                            onClick={() => handleQty(it, +1)}
                                            disabled={working || it.qty >= it.stockAvailable || it.qty >= 99}
                                            className="p-1 hover:opacity-80"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleRemove(it.bookId)}
                                        disabled={working}
                                        className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-gray-50 transition"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Xoá
                                    </button>

                                    <div className="ml-auto font-semibold">{vnd(it.lineTotal)}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Summary */}
                <div className="h-fit rounded-2xl border p-5">
                    <h2 className="mb-4 text-lg font-semibold">Tóm tắt</h2>
                    <div className="space-y-2 text-sm">
                        <Row label="Tạm tính" value={vnd(data.subtotal)} />
                        <Row label="Giảm giá" value={vnd(data.discountTotal)} />
                        <Row label="Phí vận chuyển" value={vnd(data.shippingFee)} />
                        <Row label="Thuế" value={vnd(data.taxTotal)} />
                        <div className="my-2 border-t" />
                        <Row label={<span className="font-semibold">Tổng cộng</span>} value={<span className="font-semibold">{vnd(data.grandTotal)}</span>} />
                        <div className="text-xs text-gray-500">
                            Đã chọn: <b>{data.totalSelected}</b> / Tổng số lượng: <b>{data.totalItems}</b>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={!anySelected || working}
                        className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                    >
                        Tiến hành đặt hàng
                    </button>
                    <p className="mt-2 text-xs text-gray-400">* Đơn chỉ tạo từ những sản phẩm đang được chọn.</p>
                </div>
            </div>

            {/* Modal nhắc thêm địa chỉ khi cần */}
            {guard.modal}
        </div>
    );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-600">{label}</span>
            <span>{value}</span>
        </div>
    );
}
