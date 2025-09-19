import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getOrderByCode } from "../services/order";
import type { ResOrderDetail, OrderStatus, PaymentStatus } from "../types/order";
import { vnd } from "../utils/currency";
import {
  Loader2,
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  CircleX,
  CreditCard,
} from "lucide-react";
import CancelOrderDialog from "../components/CancelOrderDialog";

const pillByStatus: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELED: "bg-rose-100 text-rose-700",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800",
};

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
      return s || "—";
  }
};

const pillByPayment: Record<PaymentStatus, string> = {
  UNPAID: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  REFUNDED: "bg-cyan-100 text-cyan-700",
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString("vi-VN");
}

const OrderDetailPage: React.FC = () => {
  const { code = "" } = useParams();
  const [data, setData] = useState<ResOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await getOrderByCode(code);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [code]);

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-600">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
        Đang tải chi tiết đơn hàng...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl border p-8 text-center">
          <CircleX className="mx-auto mb-3 h-10 w-10 text-rose-600" />
          <h1 className="mb-2 text-xl font-semibold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-gray-500">
            {error ?? "Mã đơn không tồn tại hoặc bạn không có quyền xem."}
          </p>
          <Link
            to="/don-hang"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách đơn
          </Link>
        </div>
      </div>
    );
  }

  // Cho phép huỷ khi đơn chưa hoàn tất/đã huỷ
  const cancelable = ["PENDING", "CONFIRMED", "PROCESSING", "CANCEL_REQUESTED"].includes(
    (data.status || "").toUpperCase(),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/don-hang"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
        </Link>

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm ${pillByStatus[data.status]}`}>
            {viStatus(data.status)}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm ${pillByPayment[data.paymentStatus]}`}>
            {data.paymentStatus}
          </span>

          {cancelable && (
            <CancelOrderDialog
              orderCode={data.code}
              onDone={(updated) => {
                if (updated) setData(updated);
                else load();
              }}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 lg:col-span-2"
        >
          {data.items.map((it) => (
            <div key={`${it.bookId}-${it.sku ?? "_"}`} className="flex gap-4 rounded-xl border p-4">
              <img
                src={it.imageUrl ?? "/placeholder-160x240.png"}
                alt={it.title}
                className="h-20 w-14 rounded-md object-cover"
              />
              <div className="flex-1">
                <div className="line-clamp-2 font-medium">{it.title}</div>
                <div className="mt-1 text-sm text-gray-500">SKU: {it.sku ?? "—"}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold">{vnd(it.price)}</span>
                  {Number(it.discount) > 0 && (
                    <span className="text-xs text-emerald-600">- {vnd(it.discount)} /sp</span>
                  )}
                  <span className="text-sm text-gray-500">× {it.qty}</span>
                </div>
              </div>
              <div className="ml-auto font-semibold">{vnd(it.lineTotal)}</div>
            </div>
          ))}
        </motion.div>

        {/* Right: summary + shipping */}
        <div className="h-fit space-y-6">
          <div className="rounded-xl border p-5">
            <h3 className="mb-4 text-lg font-semibold">Tóm tắt</h3>
            <Row label="Tạm tính" value={vnd(data.subtotal)} />
            <Row label="Giảm giá" value={vnd(data.discountTotal)} />
            <Row label="Phí vận chuyển" value={vnd(data.shippingFee)} />
            <Row label="Thuế" value={vnd(data.taxTotal)} />
            <div className="my-2 border-t" />
            <Row
              label={<span className="font-semibold">Tổng cộng</span>}
              value={<span className="font-semibold">{vnd(data.grandTotal)}</span>}
            />
          </div>

          <div className="rounded-xl border p-5">
            <h3 className="mb-4 text-lg font-semibold">Giao hàng & Thanh toán</h3>
            <div className="space-y-1 text-sm">
              <div>
                Người nhận: <b>{data.receiverName ?? "—"}</b>
              </div>
              <div>
                SĐT: <b>{data.receiverPhone ?? "—"}</b>
              </div>
              <div>Địa chỉ: {data.addressLine ?? "—"}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Tạo: <b>{fmtDate(data.createdAt)}</b>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Xác nhận: <b>{fmtDate(data.confirmedAt)}</b>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Giao: <b>{fmtDate(data.shippedAt)}</b>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Hoàn tất: <b>{fmtDate(data.completedAt)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default OrderDetailPage;
