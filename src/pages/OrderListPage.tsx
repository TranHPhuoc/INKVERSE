import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { listMyOrders } from "../services/order";
import type { ResOrderDetail, SpringPage } from "../types/order";
import { vnd } from "../utils/currency";
import { Loader2, ArrowRight, CircleX } from "lucide-react";

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
      return "Đã hủy";
    case "CANCEL_REQUESTED":
      return "Yêu cầu hủy";
    default:
      return "Không rõ";
  }
};

const statusChipCls = (s?: string) => {
  switch ((s || "").toUpperCase()) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CONFIRMED":
    case "PROCESSING":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "SHIPPED":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "COMPLETED":
      return "bg-slate-50 text-slate-700 ring-slate-200";
    case "CANCELED":
    case "CANCEL_REQUESTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
};

const fmtTime = (t: any) => {
  const d = new Date(t);
  if (isNaN(d.getTime())) return String(t);
  return d.toLocaleTimeString("vi-VN", { hour12: false }) + " " + d.toLocaleDateString("vi-VN");
};

const getThumbFromOrder = (o: ResOrderDetail): string => {
  const first = Array.isArray(o.items) ? o.items[0] : undefined;
  return (
    (first as any)?.thumbnail ||
    (first as any)?.imageUrl ||
    (first as any)?.book?.thumbnail ||
    (first as any)?.book?.imageUrl ||
    "/placeholder.svg"
  );
};

const getFirstTitle = (o: ResOrderDetail): string | undefined => {
  const first = Array.isArray(o.items) ? o.items[0] : undefined;
  return (first as any)?.title || (first as any)?.book?.title || undefined;
};

/* ===== Page ===== */
const OrdersListPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<ResOrderDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function fetchPage(p = 0) {
    try {
      setLoading(true);
      const res = await listMyOrders(p, 10); // chỉ gửi page/size
      setData(res);
      setPage(res.number);
      setError(null);
    } catch (e: any) {
      const beMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Không tải được danh sách đơn hàng";
      setError(beMsg);
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
          <h1 className="mb-2 text-xl font-semibold">Không tải được danh sách đơn</h1>
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
        <div className="rounded-2xl border p-8 text-center text-gray-600">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((o) => {
            const thumb = getThumbFromOrder(o);
            const firstTitle = getFirstTitle(o);
            const extraCount = (o.items?.length ?? 0) - 1;

            return (
              <motion.div
                key={o.code}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border bg-white/70 p-4 ring-1 ring-black/5 md:p-5"
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <img
                    src={thumb}
                    alt={firstTitle || "Sản phẩm"}
                    className="h-28 w-24 flex-shrink-0 rounded-lg border object-cover md:h-32 md:w-28"
                  />

                  {/* Nội dung */}
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
                    <div className="col-span-2">
                      <div className="text-sm text-gray-500">Mã đơn</div>
                      <Link
                        to={`/orders/${o.code}`}
                        className="font-semibold break-all hover:underline"
                      >
                        {o.code}
                      </Link>

                      {(firstTitle || extraCount > 0) && (
                        <div className="mt-1 line-clamp-1 text-sm text-gray-600">
                          {firstTitle}
                          {extraCount > 0 ? ` + ${extraCount} sp khác` : ""}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Ngày tạo</div>
                      <div className="font-medium">{fmtTime(o.createdAt)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">Trạng thái</div>
                      <div
                        className={`mt-0.5 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring ${statusChipCls(
                          o.status,
                        )}`}
                      >
                        {viStatus(o.status)}
                      </div>

                      <div className="mt-3 text-sm text-gray-500">Tổng tiền</div>
                      <div className="text-lg font-semibold text-rose-600">{vnd(o.grandTotal)}</div>
                    </div>
                  </div>

                  {/* nút (desktop) */}
                  <div className="hidden md:block">
                    <button
                      onClick={() => navigate(`/orders/${o.code}`)}
                      className="inline-flex transform-gpu cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-transform duration-150 hover:scale-105 hover:bg-gray-50 active:scale-95"
                    >
                      Xem chi tiết <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* nút (mobile) */}
                <div className="mt-4 md:hidden">
                  <button
                    onClick={() => navigate(`/orders/${o.code}`)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 hover:bg-gray-50"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchPage(Math.max(0, page - 1))}
            disabled={page <= 0}
            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang <b>{page + 1}</b> / {data.totalPages}
          </span>
          <button
            onClick={() => fetchPage(Math.min((data?.totalPages ?? 1) - 1, page + 1))}
            disabled={page >= (data?.totalPages ?? 1) - 1}
            className="rounded-lg border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdersListPage;
