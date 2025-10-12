// src/pages/Sale/SaleOrderPage.tsx
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  ClipboardCheck,
  Box,
  Truck,
  CheckCircle2,
  BadgeCheck,
  XCircle,
  Loader2,
} from "lucide-react";

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ResOrderAdmin,
} from "../../types/sale-order";
import { PaymentStatusBadge } from "../../components/Sale/StatusBadge";
import {
  saleSearchOrders,
  type SearchParams,
  saleUpdateStatus,
  saleCancelOrder,
} from "../../services/sale/sale-order";

/* ================= helpers ================= */
const nf = new Intl.NumberFormat("vi-VN");

const PAY_LABEL: Record<PaymentMethod, string> = {
  COD: "Tiền mặt",
  VNPAY: "VNPay",
};
const PAY_COLOR: Record<PaymentMethod, string> = {
  COD: "bg-gray-100 text-gray-800",
  VNPAY: "bg-teal-100 text-teal-800",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELED: "Huỷ đơn",
  CANCEL_REQUESTED: "Yêu cầu huỷ",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-rose-100 text-rose-800",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800",
};

const NEXT_BY_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELED"],
  PROCESSING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: [],
  CANCEL_REQUESTED: ["CANCELED", "CONFIRMED"],
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
  statuses: [OrderStatus, ...OrderStatus[]];
  icon: React.ReactNode;
  color: string;
};

const TABS: Tab[] = [
  {
    id: "pending",
    label: "Chờ xử lý",
    statuses: ["PENDING"],
    icon: <Clock className="h-4 w-4" />,
    color: "bg-yellow-50 text-yellow-700",
  },
  {
    id: "confirmed",
    label: "Đã xác nhận",
    statuses: ["CONFIRMED"],
    icon: <ClipboardCheck className="h-4 w-4" />,
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "processing",
    label: "Đang xử lý",
    statuses: ["PROCESSING"],
    icon: <Box className="h-4 w-4" />,
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: "shipping",
    label: "Đang giao",
    statuses: ["SHIPPED"],
    icon: <Truck className="h-4 w-4" />,
    color: "bg-cyan-50 text-cyan-700",
  },
  {
    id: "delivered",
    label: "Đã giao",
    statuses: ["DELIVERED"],
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-50 text-green-700",
  },
  {
    id: "completed",
    label: "Hoàn tất",
    statuses: ["COMPLETED"],
    icon: <BadgeCheck className="h-4 w-4" />,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: "canceled",
    label: "Đã huỷ",
    statuses: ["CANCELED", "CANCEL_REQUESTED"],
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-rose-50 text-rose-700",
  },
];

const DEFAULT_TAB: Tab = TABS[0]!;

/* ================= Row mapping ================= */
type Row = {
  id: number;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  total: number;
  createdAt: string;
  assigneeName?: string | null;
};

function getActiveTab(id: TabId): Tab {
  const found = TABS.find((t) => t.id === id);
  return found ?? DEFAULT_TAB;
}

/* ================= Page ================= */
export default function SaleOrdersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTabId = (params.get("tab") as TabId) || "pending";
  const activeTab = useMemo<Tab>(() => getActiveTab(activeTabId), [activeTabId]);

  const [page, setPage] = useState<number>(Number(params.get("page") ?? 0));
  const [size, setSize] = useState<number>(Number(params.get("size") ?? 10));

  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const sort = params.get("sort") ?? "createdAt,desc";

  useEffect(() => {
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    p.set("size", String(size));
    setParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const [data, setData] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      const status = activeTab.statuses[0]!;
      const query: SearchParams = { q, from, to, page, size, sort, status };
      const res = await saleSearchOrders(query);
      if (!mounted) return;

      const content: Row[] = (res?.content ?? []).map((o: ResOrderAdmin) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod ?? null,
        total: Number(o.total ?? 0),
        createdAt: String(o.createdAt),
        assigneeName: o.assigneeName ?? null,
      }));

      setData(content);
      setTotal(res?.totalElements ?? content.length);
    })().finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q, from, to, page, size, sort, activeTab, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(size, 1)));

  function switchTab(id: TabId) {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.set("page", "0");
    setParams(p, { replace: true });
    setPage(0);
  }

  function goDetail(id: number) {
    navigate(`/sale/orders/${id}`);
  }
  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  /* ===== actions ===== */
  async function confirmOrder(id: number) {
    try {
      setBusyId(id);
      await saleUpdateStatus(id, { status: "CONFIRMED" });
      switchTab("confirmed");
      setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }
  async function cancelOrder(id: number) {
    if (!window.confirm("Huỷ đơn này?")) return;
    try {
      setBusyId(id);
      await saleCancelOrder(id, { reason: "Seller canceled" });
      switchTab("canceled");
      setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }
  async function changeStatus(id: number, next: OrderStatus) {
    try {
      setBusyId(id);
      await saleUpdateStatus(id, { status: next });
      const target =
        (TABS.find((t) => t.statuses.includes(next))?.id as TabId | undefined) ?? activeTab.id;
      switchTab(target);
      setReloadKey((k) => k + 1);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1550px] space-y-4 p-2">
      {/* Tabs – bỏ border, dùng nền mềm + shadow */}
      <div className="rounded-2xl bg-white/70 p-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.id === activeTab.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab(t.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 transition ${
                  active
                    ? `${t.color} font-semibold ring-2 ring-black/5`
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
      <div className="rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1a2954] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-center">Thanh toán</th>
                <th className="px-3 py-2 text-center">Hình thức</th>
                <th className="px-3 py-2 text-right">Tổng</th>
                <th className="px-3 py-2 text-center">Ngày tạo</th>
                <th className="px-3 py-2 text-center">Phụ trách</th>
                <th className="px-3 py-2 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                    </span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    Không có đơn
                  </td>
                </tr>
              ) : (
                data.map((o) => {
                  const disabled = busyId === o.id;
                  const inPending = o.status === "PENDING";
                  const nextOptions = NEXT_BY_STATUS[o.status]?.filter((s) => s !== o.status) ?? [];

                  return (
                    <tr
                      key={o.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => goDetail(o.id)}
                    >
                      <td className="px-3 py-2 font-medium">{o.code}</td>

                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex rounded-xl px-2 py-1 text-xs ${STATUS_COLOR[o.status]}`}
                        >
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-center">
                        <PaymentStatusBadge value={o.paymentStatus} />
                      </td>

                      <td className="px-3 py-2 text-center">
                        {o.paymentMethod ? (
                          <span
                            className={`inline-flex rounded-xl px-2 py-1 text-xs ${PAY_COLOR[o.paymentMethod]}`}
                          >
                            {PAY_LABEL[o.paymentMethod]}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">{nf.format(o.total)}</td>

                      <td className="px-3 py-2 text-center">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>

                      <td className="px-3 py-2 text-center">{o.assigneeName ?? "-"}</td>

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-2" onClick={stop}>
                          {inPending ? (
                            <>
                              <button
                                disabled={disabled}
                                onClick={() => confirmOrder(o.id)}
                                className="cursor-pointer rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                              >
                                {disabled ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Xác nhận"
                                )}
                              </button>
                              <button
                                disabled={disabled}
                                onClick={() => cancelOrder(o.id)}
                                className="cursor-pointer rounded-lg bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                              >
                                {disabled ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Huỷ đơn"
                                )}
                              </button>
                            </>
                          ) : nextOptions.length ? (
                            nextOptions.map((s) => (
                              <button
                                key={s}
                                disabled={disabled}
                                onClick={() => changeStatus(o.id, s)}
                                className={`cursor-pointer rounded-lg px-3 py-1 text-xs transition disabled:opacity-60 ${s === "PROCESSING" ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : ""} ${s === "SHIPPED" ? "bg-cyan-50 text-cyan-700 hover:bg-cyan-100" : ""} ${s === "DELIVERED" ? "bg-green-50 text-green-700 hover:bg-green-100" : ""} ${s === "COMPLETED" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""} ${s === "CANCELED" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : ""} ${s === "CONFIRMED" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""} `}
                                title={STATUS_LABEL[s]}
                              >
                                {disabled ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  STATUS_LABEL[s]
                                )}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
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
              className="cursor-pointer rounded-lg bg-white px-3 py-1 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Prev
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="cursor-pointer rounded-lg bg-white px-3 py-1 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Next
            </button>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="cursor-pointer rounded-lg bg-white px-2 py-1 shadow-sm"
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
