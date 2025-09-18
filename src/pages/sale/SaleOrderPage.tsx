import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { saleSearchOrders } from "../../services/sale/sale-order";
import {
    ORDER_STATUS,
    PAYMENT_STATUS,
    type OrderStatus,
    type PaymentStatus,
    type ResOrderAdmin,
} from "../../types/sale-order";
import { OrderStatusBadge, PaymentStatusBadge } from "../../components/sale/StatusBadge";

const nf = new Intl.NumberFormat("vi-VN");

export default function SaleOrdersPage() {
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState<ResOrderAdmin[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(Number(params.get("page") ?? 0));
    const [size, setSize] = useState(Number(params.get("size") ?? 10));
    const [loading, setLoading] = useState(false);

    const q = params.get("q") ?? "";

    // --- VALIDATE status / paymentStatus từ query (tránh TS lỗi & tránh runtime sai) ---
    const statusParam = params.get("status");
    const status: OrderStatus | "" =
        statusParam && Object.values(ORDER_STATUS).includes(statusParam as OrderStatus)
            ? (statusParam as OrderStatus)
            : "";

    const paymentStatusParam = params.get("paymentStatus");
    const paymentStatus: PaymentStatus | "" =
        paymentStatusParam && Object.values(PAYMENT_STATUS).includes(paymentStatusParam as PaymentStatus)
            ? (paymentStatusParam as PaymentStatus)
            : "";

    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    const sort = params.get("sort") ?? "createdAt,desc";

    useEffect(() => {
        let mounted = true;
        setLoading(true);

        saleSearchOrders({
            q,
            status: status || undefined,
            paymentStatus: paymentStatus || undefined,
            from,
            to,
            page,
            size,
            sort,
        })
            .then((res) => {
                if (!mounted) return;
                setData(res?.content ?? []);
                setTotal(res?.totalElements ?? 0);
            })
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, [q, status, paymentStatus, from, to, page, size, sort]);


    function updateParam(key: string, value: string) {
        const p = new URLSearchParams(params);
        if (!value) p.delete(key);
        else p.set(key, value);
        p.set("page", "0");
        setParams(p, { replace: true });
        setPage(0);
    }

    const totalPages = useMemo(() => Math.ceil(total / size), [total, size]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-end gap-3">
                <div className="flex-1">
                    <label className="text-sm text-gray-500">Tìm kiếm (code, tên, sđt, email)</label>
                    <input
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="VD: PKB-2025-0001"
                        defaultValue={q}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") updateParam("q", (e.target as HTMLInputElement).value.trim());
                        }}
                    />
                </div>

                <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <select
                        className="block rounded-xl border px-3 py-2 cursor-pointer"
                        value={status}
                        onChange={(e) => updateParam("status", e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        {Object.values(ORDER_STATUS).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm text-gray-500">Payment</label>
                    <select
                        className="block rounded-xl border px-3 py-2 cursor-pointer"
                        value={paymentStatus}
                        onChange={(e) => updateParam("paymentStatus", e.target.value)}
                    >
                        <option value="">Tất cả</option>
                        {Object.values(PAYMENT_STATUS).map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm text-gray-500">From (ISO)</label>
                    <input
                        className="block rounded-xl border px-3 py-2"
                        placeholder="2025-09-01T00:00:00Z"
                        defaultValue={from}
                        onBlur={(e) => updateParam("from", e.target.value.trim())}
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-500">To (ISO)</label>
                    <input
                        className="block rounded-xl border px-3 py-2"
                        placeholder="2025-09-30T23:59:59Z"
                        defaultValue={to}
                        onBlur={(e) => updateParam("to", e.target.value.trim())}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border bg-white/70 backdrop-blur p-3">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="px-3 py-2 text-left">Mã</th>
                            <th className="px-3 py-2 text-center">Trạng thái</th>
                            <th className="px-3 py-2 text-center">Thanh toán</th>
                            <th className="px-3 py-2 text-right">Tổng</th>
                            <th className="px-3 py-2 text-center">Ngày tạo</th>
                            <th className="px-3 py-2 text-center">Phụ trách</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-3 py-6 text-center">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-3 py-6 text-center">
                                    Không có đơn
                                </td>
                            </tr>
                        ) : (
                            data.map((o, idx) => (
                                <tr
                                    key={o.id}
                                    className={`transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-gray-100/60`}
                                >
                                    <td className="px-3 py-2 font-medium">{o.code}</td>
                                    <td className="px-3 py-2 text-center">
                                        <OrderStatusBadge value={o.status} />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <PaymentStatusBadge value={o.paymentStatus} />
                                    </td>
                                    <td className="px-3 py-2 text-right">{nf.format(Number(o.total))}</td>
                                    <td className="px-3 py-2 text-center">{new Date(o.createdAt).toLocaleString()}</td>
                                    <td className="px-3 py-2 text-center">
                                        {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "-")}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Link
                                            to={`/sale/orders/${o.id}`}
                                            className="rounded-lg border px-3 py-1 hover:bg-gray-100 cursor-pointer"
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
                        Tổng {total} bản ghi — Trang {page + 1}/{Math.max(totalPages, 1)}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="rounded-lg border px-3 py-1 disabled:opacity-50 cursor-pointer"
                            disabled={page <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            className="rounded-lg border px-3 py-1 disabled:opacity-50 cursor-pointer"
                            disabled={page + 1 >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </button>
                        <select
                            className="rounded-lg border px-2 py-1 cursor-pointer"
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
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
