// pages/sale/SaleOrderPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ClipboardCheck, Box, Truck, CheckCircle2, BadgeCheck, XCircle } from "lucide-react";

import type { OrderStatus, ResOrderAdmin } from "../../types/sale-order";
import { saleSearchOrders, saleUpdateStatus } from "../../services/sale/sale-order";
import { PaymentStatusBadge } from "../../components/sale/StatusBadge";

const nf = new Intl.NumberFormat("vi-VN");

/** màu theo trạng thái */
const statusColor: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-300",
  SHIPPED: "bg-cyan-100 text-cyan-800 border-cyan-300",
  DELIVERED: "bg-green-100 text-green-800 border-green-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELED: "bg-rose-100 text-rose-800 border-rose-300",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800 border-orange-300",
};

/** nhãn tiếng Việt */
const statusLabel: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELED: "Đã huỷ",
  CANCEL_REQUESTED: "Yêu cầu huỷ",
};

type TabId =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "delivered"
  | "completed"
  | "canceled";

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
    color: "text-yellow-600 border-yellow-300 bg-yellow-50",
  },
  {
    id: "confirmed",
    label: "Đã xác nhận",
    statuses: ["CONFIRMED"],
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "text-blue-600 border-blue-300 bg-blue-50",
  },
  {
    id: "processing",
    label: "Đang xử lý",
    statuses: ["PROCESSING"],
    icon: <Box className="h-4 w-4" />,
    color: "text-indigo-600 border-indigo-300 bg-indigo-50",
  },
  {
    id: "shipping",
    label: "Đang giao",
    statuses: ["SHIPPED"],
    icon: <Truck className="h-4 w-4" />,
    color: "text-cyan-600 border-cyan-300 bg-cyan-50",
  },
  {
    id: "delivered",
    label: "Đã giao",
    statuses: ["DELIVERED"],
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600 border-green-300 bg-green-50",
  },
  {
    id: "completed",
    label: "Hoàn tất",
    statuses: ["COMPLETED"],
    icon: <BadgeCheck className="h-4 w-4" />,
    color: "text-emerald-600 border-emerald-300 bg-emerald-50",
  },
  {
    id: "canceled",
    label: "Đã huỷ",
    statuses: ["CANCELED", "CANCEL_REQUESTED"],
    icon: <XCircle className="h-4 w-4" />,
    color: "text-rose-600 border-rose-300 bg-rose-50",
  },
];

function tabIdFromStatus(s: OrderStatus): TabId {
  if (s === "PENDING") return "pending";
  if (s === "CONFIRMED") return "confirmed";
  if (s === "PROCESSING") return "processing";
  if (s === "SHIPPED") return "shipping";
  if (s === "DELIVERED") return "delivered";
  if (s === "COMPLETED") return "completed";
  return "canceled";
}

const NEXT_ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCEL_REQUESTED", "CANCELED"],
  CONFIRMED: ["PROCESSING", "CANCELED"],
  PROCESSING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCEL_REQUESTED: ["CANCELED"],
  CANCELED: [],
};

const getSelectableStatuses = (cur: OrderStatus) => [cur, ...NEXT_ALLOWED[cur]];
const isTransitionAllowed = (cur: OrderStatus, next: OrderStatus) =>
  cur === next || NEXT_ALLOWED[cur]?.includes(next) === true;

export default function SaleOrdersPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ResOrderAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(params.get("page") ?? 0));
  const [size, setSize] = useState(Number(params.get("size") ?? 10));
  const [loading, setLoading] = useState(false);

  const activeTabId = (params.get("tab") as TabId) || "pending";
  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const sort = params.get("sort") ?? "createdAt,desc";

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      const statusParam = activeTab.statuses.length === 1 ? activeTab.statuses[0] : undefined;

      const res = await saleSearchOrders({
        q,
        from,
        to,
        page,
        size,
        sort,
        status: statusParam,
      });

      let content = res?.content ?? [];
      let totalEl = res?.totalElements ?? content.length;

      if (!statusParam && activeTab.statuses.length > 1) {
        const wanted = new Set(activeTab.statuses);
        content = content.filter((o) => wanted.has(o.status));
        totalEl = content.length;
      }

      if (mounted) {
        setData(content);
        setTotal(totalEl);
      }
    })().finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q, from, to, page, size, sort, activeTabId]);

  function switchTab(id: TabId) {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.set("page", "0");
    setParams(p, { replace: true });
    setPage(0);
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(size, 1))),
    [total, size],
  );

  async function handleChangeStatus(orderId: number, current: OrderStatus, next: OrderStatus) {
    if (!isTransitionAllowed(current, next)) {
      alert("Không thể chuyển trạng thái này do không đúng quy trình.");
      return;
    }
    if (current === next) return;
    try {
      await saleUpdateStatus(orderId, { status: next });
      switchTab(tabIdFromStatus(next));
    } catch (e: any) {
      alert(e?.message || "Đổi trạng thái thất bại.");
    }
  }

  const handleConfirm = (o: ResOrderAdmin) => handleChangeStatus(o.id, o.status, "CONFIRMED");
  const handleCancel = (o: ResOrderAdmin) => handleChangeStatus(o.id, o.status, "CANCELED");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="rounded-2xl border bg-white/70 p-2 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.id === activeTabId;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab(t.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 ${
                  active
                    ? `${t.color} font-semibold ring-2 ring-gray-300`
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white/70 p-3 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1a2954]">
              <tr>
                <th className="px-3 py-2 text-left text-white">Mã</th>
                <th className="px-3 py-2 text-center text-white">Trạng thái</th>
                <th className="px-3 py-2 text-center text-white">Thanh toán</th>
                <th className="px-3 py-2 text-right text-white">Tổng</th>
                <th className="px-3 py-2 text-center text-white">Ngày tạo</th>
                <th className="px-3 py-2 text-center text-white">Phụ trách</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center">
                    Không có đơn
                  </td>
                </tr>
              ) : (
                data.map((o) => {
                  const isPending = o.status === "PENDING";
                  const options = getSelectableStatuses(o.status);
                  const isLocked = options.length <= 1;

                  return (
                    <tr key={o.id} className="transition hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{o.code}</td>

                      {/* STATUS CELL */}
                      <td className="px-3 py-2 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs ${statusColor[o.status]}`}
                            >
                              {statusLabel[o.status]}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleConfirm(o)}
                              className="cursor-pointer rounded-lg border bg-white px-2 py-1 text-xs hover:border-blue-300 hover:bg-blue-100"
                              title="Xác nhận đơn"
                            >
                              Xác nhận
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleCancel(o)}
                              className="cursor-pointer rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-100"
                              title="Huỷ đơn"
                            >
                              Huỷ
                            </motion.button>
                          </div>
                        ) : (
                          <select
                            disabled={isLocked}
                            className={`rounded-xl border px-2 py-1 text-xs ${statusColor[o.status]} ${isLocked ? "cursor-not-allowed opacity-70" : ""}`}
                            value={o.status}
                            onChange={(e) =>
                              handleChangeStatus(o.id, o.status, e.target.value as OrderStatus)
                            }
                          >
                            {options.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel[s] ?? s}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-3 py-2 text-center">
                        <PaymentStatusBadge value={o.paymentStatus} />
                      </td>
                      <td className="px-3 py-2 text-right">{nf.format(Number(o.total))}</td>
                      <td className="px-3 py-2 text-center">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "-")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/sale/orders/${o.id}`}
                          className="rounded-lg border px-3 py-1 hover:bg-gray-100"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Tổng {total} — Trang {page + 1}/{totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border px-3 py-1"
            >
              Prev
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1"
            >
              Next
            </button>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-lg border px-2 py-1"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/trang
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
