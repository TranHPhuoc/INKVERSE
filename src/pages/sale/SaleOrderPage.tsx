import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ClipboardCheck, Box, Truck, CheckCircle2, BadgeCheck, XCircle } from "lucide-react";

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ResOrderAdmin,
} from "../../types/sale-order";
import { PaymentStatusBadge } from "../../components/sale/StatusBadge";
import { saleSearchOrders, type SearchParams } from "../../services/sale/sale-order";

/* ================= helpers ================= */
const nf = new Intl.NumberFormat("vi-VN");

const PAY_LABEL: Record<PaymentMethod, string> = { COD: "Tiền mặt", VNPAY: "VNPay" };
const PAY_COLOR: Record<PaymentMethod, string> = {
  COD: "bg-gray-100 text-gray-800 border-gray-300",
  VNPAY: "bg-teal-100 text-teal-800 border-teal-300",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-300",
  SHIPPED: "bg-cyan-100 text-cyan-800 border-cyan-300",
  DELIVERED: "bg-green-100 text-green-800 border-green-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELED: "bg-rose-100 text-rose-800 border-rose-300",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800 border-orange-300",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELED: "Đã huỷ",
  CANCEL_REQUESTED: "Yêu cầu huỷ",
};

/* ================= Tabs ================= */
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

const DEFAULT_TAB: Tab = TABS[0]!;

/* ================= Row type ================= */
type Row = {
  id: number;
  code: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  total: number; // ✅ dùng total
  createdAt: string;
  assigneeName?: string | null;
};

function readPaymentMethod(x: unknown): PaymentMethod | null {
  if (typeof x === "object" && x !== null && "paymentMethod" in x) {
    const raw = (x as { paymentMethod?: unknown }).paymentMethod;
    if (raw === "COD" || raw === "VNPAY") return raw;
  }
  return null;
}
const getActiveTab = (id: TabId) => TABS.find((t) => t.id === id) ?? DEFAULT_TAB;

/* ================= Page ================= */
export default function SaleOrdersPage() {
  const [params, setParams] = useSearchParams();

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
        paymentMethod: readPaymentMethod(o),
        total: Number(o.total ?? 0), // ✅ lấy total từ BE
        createdAt: o.createdAt,
        assigneeName: o.assigneeName ?? null,
      }));

      setData(content);
      setTotal(res?.totalElements ?? content.length);
    })().finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q, from, to, page, size, sort, activeTab]);

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / Math.max(size, 1)));

  function switchTab(id: TabId) {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.set("page", "0");
    setParams(p, { replace: true });
    setPage(0);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="rounded-2xl border bg-white/70 p-2 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.id === activeTab.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${
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
            <thead className="bg-[#1a2954] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-center">Trạng thái</th>
                <th className="px-3 py-2 text-center">Thanh toán</th>
                <th className="px-3 py-2 text-center">Hình thức</th>
                <th className="px-3 py-2 text-right">Tổng</th>
                <th className="px-3 py-2 text-center">Ngày tạo</th>
                <th className="px-3 py-2 text-center">Phụ trách</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center">
                    Không có đơn
                  </td>
                </tr>
              ) : (
                data.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{o.code}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded-xl border px-2 py-1 text-xs ${STATUS_COLOR[o.status]}`}
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
                          className={`inline-flex rounded-xl border px-2 py-1 text-xs ${PAY_COLOR[o.paymentMethod]}`}
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
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/sale/orders/${o.id}`}
                        className="rounded-lg border px-3 py-1 hover:bg-gray-100"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
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
