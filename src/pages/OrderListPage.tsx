import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { listMyOrders } from "../services/order";
import type { ResOrderDetail, SpringPage } from "../types/order";
import { vnd } from "../utils/currency";
import { Loader2, ArrowRight, CircleX } from "lucide-react";

const OrdersListPage: React.FC = () => {
    const [page, setPage] = useState(0);
    const [data, setData] = useState<SpringPage<ResOrderDetail> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function fetchPage(p = 0) {
        try {
            setLoading(true);
            const res = await listMyOrders(p, 10);
            setData(res);
            setPage(res.number);
        } catch (e: any) {
            setError(e?.message || "Không tải được danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchPage(0);
    }, []);

    if (loading && !data) {
        return (
            <div className="container mx-auto px-4 py-12 text-center text-gray-600">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
                Đang tải đơn hàng...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-2xl rounded-xl border p-8 text-center">
                    <CircleX className="mx-auto mb-3 h-10 w-10 text-rose-600" />
                    <h1 className="text-xl font-semibold mb-2">Không tải được danh sách đơn</h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    const items = data?.content ?? [];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-6 text-2xl font-semibold">Đơn hàng của tôi</h1>

            {items.length === 0 ? (
                <div className="rounded-xl border p-8 text-center text-gray-600">Chưa có đơn hàng nào.</div>
            ) : (
                <div className="space-y-3">
                    {items.map((o) => (
                        <motion.div key={o.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm text-gray-500">Mã đơn</div>
                                    <Link to={`/orders/${o.code}`} className="font-semibold hover:underline">{o.code}</Link>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Ngày tạo</div>
                                    <div className="font-medium">{new Date(o.createdAt).toLocaleString("vi-VN")}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Trạng thái</div>
                                    <div className="font-medium">{o.status}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Tổng tiền</div>
                                    <div className="font-semibold">{vnd(o.grandTotal)}</div>
                                </div>
                                <button onClick={() => navigate(`/orders/${o.code}`)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50">
                                    Xem chi tiết <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                        onClick={() => fetchPage(Math.max(0, page - 1))}
                        disabled={page <= 0}
                        className="rounded-lg border px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-gray-600">
            Trang <b>{page + 1}</b> / {data.totalPages}
          </span>
                    <button
                        onClick={() => fetchPage(Math.min(data.totalPages - 1, page + 1))}
                        disabled={page >= data.totalPages - 1}
                        className="rounded-lg border px-3 py-1.5 disabled:opacity-50 hover:bg-gray-50"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrdersListPage;
