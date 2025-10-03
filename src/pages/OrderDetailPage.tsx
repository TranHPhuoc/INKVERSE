import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  ResOrderDetail,
  ResOrderItem,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from "../types/order";
import { getOrderByCode } from "../services/order";
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  CheckCircle2,
  CreditCard,
  CircleX,
} from "lucide-react";

/* Labels */
const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Tiền mặt",
  VNPAY: "VNPay",
};

const PAYMENT_STATUS_VI: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang xử lý",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  CANCELED: "Đã huỷ",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

const ORDER_STATUS_VI: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELED: "Đã huỷ",
  CANCEL_REQUESTED: "Yêu cầu huỷ",
};

function fmtVND(n: string | number) {
  const x = Number(n);
  return Number.isFinite(x) ? `${x.toLocaleString("vi-VN")} ₫` : String(n);
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("vi-VN");
}

export default function OrderDetailPage() {
  const { code = "" } = useParams<{ code: string }>();

  const [data, setData] = useState<ResOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getOrderByCode(code);
        if (alive) {
          setData(res);
          setErr(null);
        }
      } catch (e) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as { message?: string })?.message ||
          "Không tải được chi tiết đơn hàng";
        if (alive) setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-600">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
        Đang tải chi tiết đơn hàng...
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl border p-8 text-center">
          <CircleX className="mx-auto mb-3 h-10 w-10 text-rose-600" />
          <h1 className="mb-2 text-xl font-semibold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-gray-500">{err ?? "Có lỗi xảy ra"}</p>
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

  const items: ResOrderItem[] = data.items ?? [];
  const maybeMethod =
    (data as unknown as { paymentMethod?: PaymentMethod | null }).paymentMethod ?? null;

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

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {ORDER_STATUS_VI[data.status]}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {PAYMENT_STATUS_VI[data.paymentStatus]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((it: ResOrderItem) => (
            <div
              key={`${it.bookId}-${it.sku ?? "_"}`}
              className="flex gap-4 rounded-xl border p-4"
            >
              <img
                src={it.imageUrl ?? "/placeholder-160x240.png"}
                alt={it.title}
                className="h-20 w-14 rounded-md object-cover"
              />
              <div className="flex-1">
                <div className="line-clamp-2 font-medium">{it.title}</div>
                <div className="mt-1 text-sm text-gray-500">SKU: {it.sku ?? "—"}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold">{fmtVND(it.price)}</span>
                  {Number(it.discount) > 0 && (
                    <span className="text-xs text-emerald-600">
                      - {fmtVND(it.discount)} /sp
                    </span>
                  )}
                  <span className="text-sm text-gray-500">× {it.qty}</span>
                </div>
              </div>
              <div className="ml-auto font-semibold">{fmtVND(it.lineTotal)}</div>
            </div>
          ))}
        </div>

        {/* Right: summary + shipping */}
        <div className="h-fit space-y-6">
          <div className="rounded-xl border p-5">
            <h3 className="mb-4 text-lg font-semibold">Tóm tắt</h3>
            <Row label="Tạm tính" value={fmtVND(data.subtotal)} />
            <Row label="Giảm giá" value={fmtVND(data.discountTotal)} />
            <Row label="Phí vận chuyển" value={fmtVND(data.shippingFee)} />
            <Row label="Thuế" value={fmtVND(data.taxTotal)} />
            <div className="my-2 border-t" />
            <Row
              label={<span className="font-semibold">Tổng cộng</span>}
              value={<span className="font-semibold">{fmtVND(data.grandTotal)}</span>}
            />
            <div className="mt-3 text-sm text-gray-600">
              Phương thức: <b>{maybeMethod ? PAYMENT_METHOD_LABEL[maybeMethod] : "—"}</b>
            </div>
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
                <CheckCircle2 className="h-4 w-4" /> Xác nhận:{" "}
                <b>{fmtDate(data.confirmedAt)}</b>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Giao: <b>{fmtDate(data.shippedAt)}</b>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Hoàn tất:{" "}
                <b>{fmtDate(data.completedAt)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
