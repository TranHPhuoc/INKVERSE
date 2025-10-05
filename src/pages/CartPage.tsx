import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingCart, CheckSquare, Square, Loader2 } from "lucide-react";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  selectAllCart,
} from "../services/cart";
import type { ResCartSummary, ResCartItem } from "../types/cart";
import { vnd } from "../utils/currency";
import { Link, useNavigate } from "react-router-dom";
import useCheckoutGuard from "../hooks/useCheckoutGuard.tsx";

/* ================= helpers ================= */
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

function sortByStableOrder<T extends { bookId: number }>(items: T[], order: number[]) {
  if (!order.length) return items;
  const pos = new Map(order.map((id, i) => [id, i]));
  return [...items].sort(
    (a, b) =>
      (pos.has(a.bookId) ? (pos.get(a.bookId) as number) : Number.MAX_SAFE_INTEGER) -
      (pos.has(b.bookId) ? (pos.get(b.bookId) as number) : Number.MAX_SAFE_INTEGER),
  );
}

/** Kiểu nhìn cho UI (không dùng any) */
type CartItemView = ResCartItem & {
  title?: string;
  slug?: string;
  thumbnail?: string | null;
  onSale?: boolean;
  originalUnitPrice?: number;
  unitPrice: number; // ResCartItem đã có
  lineTotal?: number;
  stockAvailable?: number;
};

const getTitle = (it: CartItemView): string => it.title ?? "Sản phẩm";
const getSlug = (it: CartItemView): string => it.slug ?? String(it.bookId);
const getThumb = (it: CartItemView): string => it.thumbnail ?? "/placeholder-160x240.png";
const getStock = (it: CartItemView): number => num(it.stockAvailable, 0);
const getLineTotal = (it: CartItemView): number =>
  num(it.lineTotal, num(it.unitPrice) * num(it.qty));
const getOriginal = (it: CartItemView): number | undefined =>
  typeof it.originalUnitPrice === "number" ? it.originalUnitPrice : undefined;

/* ================= component ================= */
export default function CartPage() {
  const [data, setData] = useState<ResCartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  /** giữ thứ tự hiển thị ổn định */
  const [itemOrder, setItemOrder] = useState<number[]>([]);

  const navigate = useNavigate();
  const guard = useCheckoutGuard("/checkout");

  /** Map sang kiểu view (chỉ là annotation type, không phải any) */
  const items: CartItemView[] = useMemo(() => {
    if (!data) return [];
    const ordered = sortByStableOrder<CartItemView>(data.items as CartItemView[], itemOrder);
    return ordered;
  }, [data, itemOrder]);

  const anySelected = useMemo(() => items.some((i) => i.selected), [items]);
  const allSelected = useMemo(() => items.length > 0 && items.every((i) => i.selected), [items]);

  const selectedItems = useMemo(() => items.filter((i) => i.selected), [items]);
  const selectedQty = useMemo(
    () => selectedItems.reduce((s, i) => s + num(i.qty), 0),
    [selectedItems],
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getCart();
        setData(res);
        setItemOrder(res.items.map((i) => i.bookId));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyServerCart = (next: ResCartSummary) => {
    setData({
      ...next,
      items: sortByStableOrder(
        next.items,
        itemOrder.length ? itemOrder : next.items.map((i) => i.bookId),
      ),
    });
    setItemOrder((prev) => {
      const known = new Set(prev);
      const append = next.items.map((i) => i.bookId).filter((id) => !known.has(id));
      return append.length ? [...prev, ...append] : prev;
    });
  };

  async function handleToggleAll() {
    if (!data) return;
    setWorking(true);
    try {
      const next = await selectAllCart({ selected: !allSelected });
      applyServerCart(next);
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
      applyServerCart(next);
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  }

  async function handleQty(it: ResCartItem, delta: number) {
    const nextQty = num(it.qty) + delta;
    setWorking(true);
    try {
      const next =
        nextQty <= 0
          ? await updateCartItem(it.bookId, { qty: 0 })
          : await updateCartItem(it.bookId, { qty: nextQty });
      applyServerCart(next);
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
      applyServerCart(next);
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
      applyServerCart(next);
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  }

  async function handleCheckout() {
    if (!anySelected || !data) return;
    const ok = await guard.ensureReady();
    if (!ok) return;

    const selectedIds = items.filter((i) => i.selected).map((i) => i.bookId);
    navigate("/checkout", { state: { selectedIds } });
  }

  /* ================= render ================= */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-300">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
        Đang tải giỏ hàng...
      </div>
    );
  }

  if (!data || items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 p-10 text-center backdrop-blur">
          <ShoppingCart className="mx-auto mb-4 h-10 w-10" />
          <h1 className="mb-2 text-2xl font-semibold">Giỏ hàng trống</h1>
          <p className="mb-6 text-gray-400">Tiếp tục mua sắm để thêm sản phẩm vào giỏ.</p>
          <Link
            to="/"
            className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
          >
            Về trang chủ
          </Link>
        </div>
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
          className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 transition hover:bg-gray-50"
        >
          {allSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
          {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => handleClear(false)}
            disabled={working}
            className="cursor-pointer rounded-xl border px-4 py-2 transition hover:bg-gray-50"
            title="Xoá các sản phẩm chưa chọn"
          >
            Xoá chưa chọn
          </button>
          <button
            onClick={() => handleClear(true)}
            disabled={working}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-white transition hover:bg-rose-500"
            title="Xoá toàn bộ giỏ"
          >
            <Trash2 className="h-5 w-5" />
            Xoá tất cả
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.map((it) => (
          <motion.div
            key={it.bookId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-gray-50"
          >
            <button
              onClick={() => handleToggleItem(it)}
              disabled={working}
              className="p-1"
              aria-label="toggle selected"
            >
              {it.selected ? (
                <CheckSquare className="h-5 w-5 cursor-pointer" />
              ) : (
                <Square className="h-5 w-5 cursor-pointer" />
              )}
            </button>

            <img
              src={getThumb(it)}
              alt={getTitle(it)}
              className="h-20 w-14 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-160x240.png";
              }}
            />

            <div className="flex-1">
              <Link
                to={`/books/${getSlug(it)}`}
                className="line-clamp-2 font-medium hover:underline"
              >
                {getTitle(it)}
              </Link>

              <div className="mt-1 flex items-center gap-2">
                {it.onSale && typeof getOriginal(it) === "number" && (
                  <span className="text-sm text-gray-400 line-through">
                    {vnd(getOriginal(it)!)}
                  </span>
                )}
                <span className="font-semibold">{vnd(num(it.unitPrice))}</span>
                <span className="text-sm text-gray-400">• Còn {getStock(it)}</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl border px-2 py-1">
                  <button
                    onClick={() => handleQty(it, -1)}
                    disabled={working}
                    className="p-1 hover:opacity-80"
                  >
                    <Minus className="h-4 w-4 cursor-pointer" />
                  </button>
                  <span className="min-w-6 text-center">{num(it.qty)}</span>
                  <button
                    onClick={() => handleQty(it, +1)}
                    disabled={working || num(it.qty) >= getStock(it) || num(it.qty) >= 99}
                    className="p-1 hover:opacity-80"
                  >
                    <Plus className="h-4 w-4 cursor-pointer" />
                  </button>
                </div>

                <button
                  onClick={() => handleRemove(it.bookId)}
                  disabled={working}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 transition hover:bg-gray-50"
                >
                  <Trash2 className="h-4 w-4 cursor-pointer" />
                  Xoá
                </button>

                <div className="ml-auto font-semibold">{vnd(getLineTotal(it))}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary  */}
      <div className="mt-8 w-[400px] h-[220px] border p-5 bg-white shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Tóm tắt</h2>
        <div className="space-y-2 text-sm">
          <div className="my-2 border-t" />
          <Row
            label={<span className="font-semibold">Tổng cộng (tất cả)</span>}
            value={
              <span className="font-semibold">{vnd(num((data as ResCartSummary).grandTotal))}</span>
            }
          />

          <div className="text-xs text-gray-500">
            Đã chọn: <b>{selectedQty}</b> / Tổng số lượng:{" "}
            <b>{num((data as ResCartSummary).totalItems)}</b>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={!anySelected || working}
          className="mt-5 w-full cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Tiến hành đặt hàng
        </button>
      </div>

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
