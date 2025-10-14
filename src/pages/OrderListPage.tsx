// src/pages/OrdersListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ClipboardCheck,
  Boxes,
  Truck,
  CheckCircle2,
} from "lucide-react";

import { listMyOrders } from "../services/order";
import type { ResOrderDetail, SpringPage } from "../types/order";
import { vnd } from "../utils/currency";
import type React from "react";

/* ---------- types ---------- */
type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"

/* ---------- Tabs ---------- */
type TabId =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "delivered"


type Tab = {
  id: TabId;
  label: string;
  statuses: OrderStatus[];
  icon: React.ReactNode;
  color: string; 
};

const TABS: Tab[] = [
  {
    id: "pending",
    label: "Chờ xử lý",
    statuses: ["PENDING"],
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-700 bg-amber-50",
  },
  {
    id: "confirmed",
    label: "Đã xác nhận",
    statuses: ["CONFIRMED"],
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "text-blue-700 bg-blue-50",
  },
  {
    id: "processing",
    label: "Đang xử lý",
    statuses: ["PROCESSING"],
    icon: <Boxes className="h-4 w-4" />,
    color: "text-indigo-700 bg-indigo-50",
  },
  {
    id: "shipping",
    label: "Đang giao",
    statuses: ["SHIPPED"],
    icon: <Truck className="h-4 w-4" />,
    color: "text-cyan-700 bg-cyan-50",
  },
  {
    id: "delivered",
    label: "Đã giao",
    statuses: ["DELIVERED"],
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-700 bg-green-50",
  },
];

/* ---------- helpers ---------- */
const viStatus = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "PENDING":
      return "Chờ xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PROCESSING":
      return "Đang xử lý";
    case "SHIPPED":
      return "Đang giao";
    case "DELIVERED":
      return "Đã giao";
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
  const first = (o.items?.[0] ?? null) as unknown;
  if (first && typeof first === "object") {
    const it = first as OrderItemLite;
    const t =
      (typeof it.thumbnail === "string" && it.thumbnail) ||
      (typeof it.imageUrl === "string" && it.imageUrl) ||
      (it.book && (it.book.thumbnail || it.book.imageUrl)) ||
      null;
    if (t) return t;
  }
  return "/placeholder.svg";
};

const getTitle = (o: ResOrderDetail): string => {
  const first = (o.items?.[0] ?? null) as unknown;
  if (first && typeof first === "object") {
    const it = first as OrderItemLite;
    const t =
      (typeof it.title === "string" && it.title) ||
      (it.book && typeof it.book.title === "string" && it.book.title) ||
      null;
    if (t) return t;
  }
  return "Sản phẩm";
};


/* ---------- page ---------- */
export default function OrdersListPage() {
  const [params, setParams] = useSearchParams();

  const [page, setPage] = useState<number>(Number(params.get("page") ?? 0));
  const [size, setSize] = useState<number>(Number(params.get("size") ?? 10));
  const [data, setData] = useState<SpringPage<ResOrderDetail> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const activeTabId = (params.get("tab") as TabId) || "pending";
  const activeTab = useMemo<Tab>(
    () => TABS.find((t) => t.id === activeTabId) ?? TABS[0]!,
    [activeTabId],
  );

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
    const wanted = new Set(activeTab.statuses);
    return (data.content ?? []).filter((o) =>
      wanted.has(((o.status || "") as string).toUpperCase() as OrderStatus),
    );
  }, [data, activeTab]);

  function switchTab(id: TabId) {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.set("page", "0");
    setParams(p, { replace: true });
    setPage(0);
  }

  return (
    <div className="container mx-auto space-y-5 px-4 py-8">
      <h1 className="text-2xl font-semibold">Đơn hàng của tôi</h1>

      {/* Tabs */}
      <div className="rounded-2xl bg-white/80 p-2 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="relative flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.id === activeTabId;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => switchTab(t.id)}
                className={`relative flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 transition ${
                  active
                    ? `font-semibold ring-1 ring-black/5 ${t.color}`
                    : "bg-white/70 text-gray-700 ring-1 ring-gray-200 hover:bg-white"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-0 -z-10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Đang tải...</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-gray-500">Không có đơn</div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="divide-y divide-gray-200">
              {items.map((o) => {
                const thumb = getThumb(o);
                const title = getTitle(o);
                const extra = Math.max(0, (o.items?.length ?? 1) - 1);

                return (
                  <motion.div
                    key={o.code}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 350, damping: 26 }}
                    className="flex flex-col gap-3 rounded-xl bg-white p-4 md:flex-row md:items-start md:gap-4"
                  >
                    <img
                      src={thumb}
                      alt={title}
                      className="h-24 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-gray-200 md:h-28 md:w-24"
                    />

                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
                      <div className="col-span-2">
                        <div className="text-sm text-gray-500">Mã đơn</div>
                        <Link
                          to={`/orders/${o.code}`}
                          className="font-semibold break-all hover:underline"
                        >
                          {o.code}
                        </Link>
                        <div className="mt-1 line-clamp-1 text-sm text-gray-600">
                          {title}
                          {extra > 0 ? ` + ${extra} sp khác` : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Trạng thái</div>
                        <span className="mt-1 inline-block rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold ring-1 ring-gray-200">
                          {viStatus(o.status)}
                        </span>

                        <div className="mt-3 text-sm text-gray-500">Tổng tiền</div>
                        <div className="text-lg font-semibold text-rose-600">
                          {vnd(o.grandTotal)}
                        </div>
                      </div>
                    </div>

                    {/* Actions (right) */}
                    <div className="flex gap-2 md:flex-col md:items-end">
                      <Link
                        to={`/orders/${o.code}`}
                        className="inline-flex items-center rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-gray-200 hover:bg-gray-50"
                      >
                        Chi tiết
                      </Link>
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
