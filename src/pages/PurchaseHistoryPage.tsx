// src/pages/PurchaseHistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { History } from "lucide-react";
import { listMyOrders } from "../services/order";
import type { ResOrderDetail, SpringPage } from "../types/order";
import { vnd } from "../utils/currency";

/* ---------- helpers ---------- */
type OrderStatus = "COMPLETED" | "CANCELED" | "CANCEL_REQUESTED";

type OrderMetaDates = {
  completedAt?: string | null;
  canceledAt?: string | null;
  updatedAt?: string | null;
};
type OrderWithMeta = ResOrderDetail & Partial<OrderMetaDates>;

const asWithMeta = (o: ResOrderDetail): OrderWithMeta => o as unknown as OrderWithMeta;

const viStatus = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "COMPLETED":
      return "Hoàn tất";
    case "CANCELED":
      return "Đã huỷ";
    case "CANCEL_REQUESTED":
      return "Yêu cầu huỷ";
    default:
      return "Không rõ";
  }
};

const fmtTime = (t?: string | null): string => {
  if (!t) return "—";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return String(t);
  return `${d.toLocaleTimeString("vi-VN", { hour12: false })} ${d.toLocaleDateString("vi-VN")}`;
};

type OrderItemLite = {
  thumbnail?: string | null;
  imageUrl?: string | null;
  title?: string | null;
  book?: {
    id?: number | null;
    title?: string | null;
    thumbnail?: string | null;
    imageUrl?: string | null;
  } | null;
  bookId?: number | null;
};

const getThumb = (o: ResOrderDetail): string => {
  const first = (o.items?.[0] ?? null) as OrderItemLite | null;
  if (!first) return "/placeholder.svg";
  return (
    first.thumbnail ||
    first.imageUrl ||
    first.book?.thumbnail ||
    first.book?.imageUrl ||
    "/placeholder.svg"
  );
};

const getTitle = (o: ResOrderDetail): string => {
  const first = (o.items?.[0] ?? null) as OrderItemLite | null;
  return first?.title || first?.book?.title || "Sản phẩm";
};

const getFirstProductLinkById = (o: ResOrderDetail): string | null => {
  const first = (o.items?.[0] ?? null) as OrderItemLite | null;
  const id = Number(first?.book?.id ?? first?.bookId ?? 0);
  return id ? `/books/${id}?by=id` : null;
};

/** Lấy label + value ngày theo trạng thái */
const getDisplayDate = (
  o: ResOrderDetail,
  status: OrderStatus,
): { label: string; value: string } => {
  const meta = asWithMeta(o);
  if (status === "COMPLETED") {
    return {
      label: "Ngày hoàn thành",
      value: fmtTime(meta.completedAt ?? o.createdAt),
    };
  }
  if (status === "CANCELED" || status === "CANCEL_REQUESTED") {
    return {
      label: "Ngày huỷ",
      value: fmtTime(meta.canceledAt ?? meta.updatedAt ?? o.createdAt),
    };
  }
  return { label: "Ngày tạo", value: fmtTime(o.createdAt) };
};

/** Thời điểm dùng để sort (mới nhất lên đầu) */
const getComparableTime = (o: ResOrderDetail): number => {
  const meta = asWithMeta(o);
  const raw =
    meta.completedAt ??
    meta.canceledAt ??
    meta.updatedAt ??
    o.createdAt ??
    null;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

/* ---------- page ---------- */
export default function PurchaseHistoryPage() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState<number>(Number(params.get("page") ?? 0));
  const [size, setSize] = useState<number>(Number(params.get("size") ?? 10));
  const [data, setData] = useState<SpringPage<ResOrderDetail> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const res = await listMyOrders(page, size);
      if (!mounted) return;
      setData(res);
    })().finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [page, size]);

  const items = useMemo(() => {
    if (!data) return [];
    return (data.content ?? [])
      .filter((o) => {
        const s = ((o.status || "") as string).toUpperCase() as OrderStatus;
        return s === "COMPLETED" || s === "CANCELED" || s === "CANCEL_REQUESTED";
      })
      .sort((a, b) => getComparableTime(b) - getComparableTime(a));
  }, [data]);

  return (
    <div className="container mx-auto space-y-5 px-4 py-8">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-emerald-600" />
        <h1 className="text-2xl font-semibold">Lịch sử mua hàng</h1>
      </div>

      <div className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-gray-500">Chưa có đơn hàng nào</div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="divide-y divide-gray-200">
              {items.map((o) => {
                const thumb = getThumb(o);
                const title = getTitle(o);
                const extra = Math.max(0, (o.items?.length ?? 1) - 1);
                const productLink = getFirstProductLinkById(o);
                const status = (o.status || "").toUpperCase() as OrderStatus;
                const isCompleted = status === "COMPLETED";
                const { label: dateLabel, value: dateValue } = getDisplayDate(o, status);

                return (
                  <motion.div
                    key={o.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="flex flex-col gap-4 rounded-xl bg-white p-4"
                  >
                    <div className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(0,2fr)_220px_220px_220px]">
                      {/* Col 1: Info */}
                      <div className="flex min-w-0 items-start gap-4">
                        <img
                          src={thumb}
                          alt={title}
                          className="h-24 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-gray-200 md:h-28 md:w-24"
                        />
                        <div className="min-w-0">
                          <div className="text-sm text-gray-500">Mã đơn</div>
                          <Link
                            to={`/orders/${o.code}`}
                            className="break-all font-semibold hover:underline"
                          >
                            {o.code}
                          </Link>
                          <div className="mt-1 line-clamp-1 text-sm text-gray-600">
                            {title}
                            {extra > 0 ? ` + ${extra} sp khác` : ""}
                          </div>
                        </div>
                      </div>

                      {/* Col 2: Date */}
                      <div className="md:w-[220px]">
                        <div className="text-sm text-gray-500">{dateLabel}</div>
                        <div className="font-medium">{dateValue}</div>
                      </div>

                      {/* Col 3: Status + Total */}
                      <div className="md:w-[220px] text-right">
                        <div className="text-sm text-gray-500">Trạng thái</div>
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-rose-50 text-rose-700 ring-rose-200"
                          }`}
                        >
                          {viStatus(o.status)}
                        </span>
                        <div className="mt-3 text-sm text-gray-500">Tổng tiền</div>
                        <div className="text-lg font-semibold text-rose-600">
                          {vnd(o.grandTotal)}
                        </div>
                      </div>

                      {/* Col 4: Actions */}
                      <div className="md:w-[220px] flex flex-wrap gap-2 md:justify-end">
                        <Link
                          to={`/orders/${o.code}`}
                          className="inline-flex items-center rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-gray-200 hover:bg-gray-50"
                        >
                          Chi tiết
                        </Link>

                        {productLink && isCompleted && (
                          <>
                            <Link
                              to={`${productLink}&action=review`}
                              className="inline-flex cursor-pointer items-center rounded-xl bg-emerald-600 px-3.5 py-2.5 text-white hover:bg-emerald-500"
                            >
                              Đánh giá
                            </Link>
                            <Link
                              to={productLink}
                              className="inline-flex cursor-pointer items-center rounded-xl bg-rose-600 px-3.5 py-2.5 text-white hover:bg-rose-500"
                            >
                              Mua lại
                            </Link>
                          </>
                        )}

                        {productLink && !isCompleted && (
                          <Link
                            to={productLink}
                            className="inline-flex cursor-pointer items-center rounded-xl bg-rose-600 px-3.5 py-2.5 text-white hover:bg-rose-500"
                          >
                            Mua lại
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page <= 0}
            className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang <b>{page + 1}</b> / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min((data?.totalPages ?? 1) - 1, p + 1))}
            disabled={page >= (data?.totalPages ?? 1) - 1}
            className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
              const p = new URLSearchParams(params);
              p.set("size", e.target.value);
              p.set("page", "0");
              setParams(p, { replace: true });
            }}
            className="rounded-lg bg-white px-2 py-1 ring-1 ring-gray-200"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/trang
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
