// src/pages/Sale/SaleOrderPage.tsx
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ResOrderAdmin,
} from "../../types/sale-order";

import {
  saleSearchOrders,
  type SearchParams,
  saleUpdateStatus,
  saleCancelOrder,
} from "../../services/sale/sale-order";

import {
  SaleStatusTabs,
  OrderStatusBadge,
} from "../../components/Sale/StatusBadge";
import { TAB_DEF, type TabId } from "../../components/Sale/Status";

/* ================= helpers ================= */
const nf = new Intl.NumberFormat("vi-VN");

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

const ACTIONS_BY_TAB: Record<TabId, OrderStatus[]> = {
  pending: [],
  confirmed: ["PROCESSING", "SHIPPED", "CANCELED"],
  processing: ["SHIPPED", "CANCELED"],
  shipping: ["DELIVERED"],
  delivered: ["COMPLETED"],
  completed: [],
  canceled: [],
};

const BTN_STYLE: Record<OrderStatus, string> = {
  PROCESSING: "text-indigo-800 bg-indigo-50 ring-1 ring-indigo-200 hover:bg-indigo-100",
  SHIPPED: "text-cyan-800 bg-cyan-50 ring-1 ring-cyan-200 hover:bg-cyan-100",
  DELIVERED: "text-green-800 bg-green-50 ring-1 ring-green-200 hover:bg-green-100",
  COMPLETED: "text-emerald-800 bg-emerald-50 ring-1 ring-emerald-200 hover:bg-emerald-100",
  CANCELED: "text-rose-800 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100",
  CONFIRMED: "text-blue-800 bg-blue-50 ring-1 ring-blue-200 hover:bg-blue-100",
  PENDING: "",
  CANCEL_REQUESTED: "",
};

function getActiveTab(id: TabId) {
  return TAB_DEF.find((t) => t.id === id) ?? TAB_DEF[0]!;
}

/* ================= types ================= */
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

/* ================= Page ================= */
export default function SaleOrdersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTabId = (params.get("tab") as TabId) || "pending";
  const activeTab = useMemo(() => getActiveTab(activeTabId), [activeTabId]);

  const [page, setPage] = useState<number>(Number(params.get("page") ?? 0));
  const SIZE = 15; // cố định 15 đơn/trang

  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const sort = params.get("sort") ?? "createdAt,desc";

  useEffect(() => {
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    setParams(p, { replace: true });
  }, [page]);

  const [data, setData] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Busy state theo từng nút
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const status = activeTab.statuses[0]!;
      const query: SearchParams = { q, from, to, page, size: SIZE, sort, status };
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
  }, [q, from, to, page, sort, activeTab, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / SIZE));

  function switchTab(id: TabId) {
    const p = new URLSearchParams(params);
    p.set("tab", id);
    p.set("page", "0");
    setParams(p, { replace: true });
    setPage(0);
  }

  const goDetail = (id: number) => navigate(`/sale/orders/${id}`);
  const stop = (e: MouseEvent) => e.stopPropagation();

  /* ================= actions (không nhảy tab) ================= */
  async function confirmOrder(id: number) {
    try {
      setBusyId(id);
      setBusyAction("confirm");
      await saleUpdateStatus(id, { status: "CONFIRMED" });
    } finally {
      setBusyId(null);
      setBusyAction(null);
      setReloadKey((k) => k + 1);
    }
  }

  async function cancelOrder(id: number) {
    if (!window.confirm("Huỷ đơn này?")) return;
    try {
      setBusyId(id);
      setBusyAction("cancel");
      await saleCancelOrder(id, { reason: "Seller canceled" });
    } finally {
      setBusyId(null);
      setBusyAction(null);
      setReloadKey((k) => k + 1);
    }
  }

  async function changeStatus(id: number, next: OrderStatus) {
    try {
      setBusyId(id);
      setBusyAction(`status-${next}`);
      await saleUpdateStatus(id, { status: next });
    } finally {
      setBusyId(null);
      setBusyAction(null);
      setReloadKey((k) => k + 1);
    }
  }

  return (
    <div className="mx-auto max-w-[1550px] space-y-4 p-2">
      {/* Tabs */}
      <SaleStatusTabs activeId={activeTab.id as TabId} onSwitch={switchTab} />

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#12213f] text-white">
            <tr className="text-[13px]">
              <th className="px-3 py-2 text-center w-14">STT</th>
              <th className="px-3 py-2 text-left">Mã đơn hàng</th>
              <th className="px-3 py-2 text-center w-40">Trạng thái</th>
              <th className="px-3 py-2 text-left w-56">Thanh toán</th>
              <th className="px-3 py-2 text-right w-40">Tổng tiền</th>
              <th className="px-3 py-2 text-left w-56">Ngày tạo</th>
              <th className="px-3 py-2 text-right w-72">Hành động</th>
            </tr>
            </thead>

            <tbody className="text-gray-900">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                    </span>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center">
                  Không có đơn
                </td>
              </tr>
            ) : (
              data.map((o, i) => {
                const disabledConfirm = busyId === o.id && busyAction === "confirm";
                const disabledCancel = busyId === o.id && busyAction === "cancel";

                const stt = page * SIZE + i + 1;
                const methodLabel = o.paymentMethod === "VNPAY" ? "VNPay" : "Tiền mặt";
                const paid = o.paymentStatus === "PAID";
                const payText = paid ? "Đã thanh toán" : "Chưa thanh toán";
                const payColor = paid ? "text-emerald-600" : "text-rose-600";

                return (
                  <tr
                    key={o.id}
                    className="hover:bg-[#f2f6ff] transition-colors cursor-pointer"
                    onClick={() => goDetail(o.id)}
                  >
                    {/* STT */}
                    <td className="px-3 py-3 text-center align-middle">{stt}</td>

                    {/* Mã đơn hàng */}
                    <td className="px-3 py-3 align-middle">
                        <span className="text-[#2f66ff] hover:underline font-medium">
                          {o.code}
                        </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-3 py-3 text-center align-middle">
                      <OrderStatusBadge value={o.status} />
                    </td>

                    {/* Thanh toán  */}
                    <td className="px-3 py-3 align-middle">
                      <div className="leading-tight">
                        <div className="text-[13px] font-medium">{methodLabel}</div>
                        <div className={`text-xs mt-0.5 ${payColor}`}>{payText}</div>
                      </div>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-3 py-3 text-right align-middle">
                      {nf.format(o.total)}đ
                    </td>

                    {/* Ngày tạo */}
                    <td className="px-3 py-3 align-middle">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>

                    {/* Hành động (không có nút 'Xem') */}
                    <td className="px-3 py-3 text-right align-middle">
                      <div className="flex justify-end gap-2" onClick={stop}>
                        {activeTab.id === "pending" ? (
                          <>
                            <button
                              disabled={disabledConfirm}
                              onClick={() => confirmOrder(o.id)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-50 ring-1 ring-blue-200 hover:bg-blue-100 disabled:opacity-60"
                            >
                              {disabledConfirm ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Xác nhận"
                              )}
                            </button>
                            <button
                              disabled={disabledCancel}
                              onClick={() => cancelOrder(o.id)}
                              className="rounded-full px-3 py-1 text-xs font-semibold text-rose-800 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100 disabled:opacity-60"
                            >
                              {disabledCancel ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Huỷ đơn"
                              )}
                            </button>
                          </>
                        ) : (
                          (ACTIONS_BY_TAB[activeTab.id as TabId] ?? []).map((next) => {
                            const disabledChange =
                              busyId === o.id && busyAction === `status-${next}`;
                            return (
                              <button
                                key={next}
                                disabled={disabledChange}
                                onClick={() => changeStatus(o.id, next)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60 ${BTN_STYLE[next]}`}
                                title={STATUS_LABEL[next]}
                              >
                                {disabledChange ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  STATUS_LABEL[next]
                                )}
                              </button>
                            );
                          })
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

        {/* Pagination (không có dropdown số dòng/trang) */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Tổng {total} — Trang {page + 1}/{totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg bg-white px-3 py-1 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              Prev
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-3 py-1 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
