// src/pages/OrderDetailPage.tsx
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
  Check,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

/* ===== Labels ===== */
const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  COD: "Tiền mặt (COD)",
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

/* ===== Helpers ===== */
function fmtVND(n: string | number) {
  const x = Number(n);
  return Number.isFinite(x) ? `${x.toLocaleString("vi-VN")} ₫` : String(n);
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("vi-VN");
}
function badgeClassByOrderStatus(s: OrderStatus) {
  switch (s) {
    case "PENDING":
    case "PROCESSING":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
      return "bg-sky-100 text-sky-800";
    case "SHIPPED":
    case "DELIVERED":
      return "bg-indigo-100 text-indigo-800";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCEL_REQUESTED":
      return "bg-rose-100 text-rose-800";
    case "CANCELED":
    default:
      return "bg-gray-200 text-gray-700";
  }
}
function badgeClassByPaymentStatus(s: PaymentStatus) {
  switch (s) {
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "UNPAID":
      return "bg-gray-200 text-gray-700";
    case "FAILED":
    case "CANCELED":
      return "bg-rose-100 text-rose-800";
    case "REFUNDED":
      return "bg-sky-100 text-sky-800";
    case "REFUND_PENDING":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

/* ===== status order to infer steps when timestamps missing ===== */
const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCEL_REQUESTED",
  "CANCELED",
];

const STEP_TO_MIN_STATUS: Record<
  "createdAt" | "confirmedAt" | "shippedAt" | "completedAt",
  OrderStatus
> = {
  createdAt: "PENDING",
  confirmedAt: "CONFIRMED",
  shippedAt: "SHIPPED",
  completedAt: "COMPLETED",
};

function isStepDoneByStatus(stepKey: keyof typeof STEP_TO_MIN_STATUS, status: OrderStatus) {
  const cur = STATUS_ORDER.indexOf(status);
  const need = STATUS_ORDER.indexOf(STEP_TO_MIN_STATUS[stepKey]);
  return cur >= need;
}

/* ===== Page ===== */
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

  // prepare
  const paymentMethod =
    (data as unknown as { paymentMethod?: PaymentMethod | null })?.paymentMethod ?? null;

  const timeline = [
    { key: "createdAt" as const, label: "Tạo đơn", at: data?.createdAt, icon: Package },
    { key: "confirmedAt" as const, label: "Xác nhận", at: data?.confirmedAt, icon: CheckCircle2 },
    { key: "shippedAt" as const, label: "Đang giao", at: data?.shippedAt, icon: Truck },
    { key: "completedAt" as const, label: "Hoàn tất", at: data?.completedAt, icon: CreditCard },
  ];

  const isDone = (stepKey: (typeof timeline)[number]["key"], dt?: string | null) =>
    !!dt || (data ? isStepDoneByStatus(stepKey, data.status) : false);

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white/80 p-10 text-center shadow-md backdrop-blur">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-600" />
          <div className="text-gray-600">Đang tải chi tiết đơn hàng...</div>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-md">
          <CircleX className="mx-auto mb-3 h-10 w-10 text-rose-600" />
          <h1 className="mb-2 text-xl font-semibold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-gray-500">{err ?? "Có lỗi xảy ra"}</p>
          <Link
            to="/don-hang"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm hover:shadow"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách đơn
          </Link>
        </div>
      </div>
    );
  }

  const items: ResOrderItem[] = data.items ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header (no border) */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-rose-50 p-[1px] shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link
              to="/don-hang"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm hover:shadow"
            >
              <ArrowLeft className="h-4 w-4" /> Đơn hàng của tôi
            </Link>
            <div className="text-sm text-gray-500">Mã đơn:</div>
            <div className="rounded-lg bg-gray-100 px-2 py-1 font-medium tracking-wide">
              {data.code}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm ${badgeClassByOrderStatus(data.status)}`}
            >
              {ORDER_STATUS_VI[data.status]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm ${badgeClassByPaymentStatus(
                data.paymentStatus,
              )}`}
            >
              {PAYMENT_STATUS_VI[data.paymentStatus]}
            </span>
          </div>
        </div>

        {/* Timeline (no borders) */}
        <div className="bg-white/70 px-5 py-4">
          <ol className="relative ml-1 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map(({ key, label, at, icon: Icon }, idx) => {
              const done = isDone(key, at);
              return (
                <li key={idx} className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm ${
                      done ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{fmtDate(at)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items (no border) */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((it: ResOrderItem) => (
            <motion.div
              key={`${it.bookId}-${it.sku ?? "_"}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative">
                <img
                  src={it.imageUrl ?? "/placeholder-160x240.png"}
                  alt={it.title}
                  className="h-24 w-16 rounded-lg object-cover"
                />
                {Number(it.discount) > 0 && (
                  <div className="absolute -top-1 -right-1 rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                    -{fmtVND(it.discount)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="line-clamp-2 font-medium group-hover:text-indigo-600">
                  {it.title}
                </div>
                <div className="mt-1 text-xs text-gray-500">SKU: {it.sku ?? "—"}</div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{fmtVND(it.price)}</span>
                  <span className="text-sm text-gray-500">× {it.qty}</span>
                </div>
              </div>

              <div className="ml-auto self-center text-right">
                <div className="text-sm text-gray-500">Tạm tính</div>
                <div className="text-base font-semibold">{fmtVND(it.lineTotal)}</div>
              </div>
            </motion.div>
          ))}

          {items.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
              <Clock className="mx-auto mb-2 h-6 w-6" />
              Không có sản phẩm trong đơn.
            </div>
          )}
        </div>

        {/* Right: summary + shipping (no border) */}
        <div className="h-fit space-y-6 lg:sticky lg:top-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-md"
          >
            <h3 className="mb-4 text-lg font-semibold">Tóm tắt</h3>
            <Row label="Tạm tính" value={fmtVND(data.subtotal)} />
            <Row label="Giảm giá" value={fmtVND(data.discountTotal)} />
            <Row label="Phí vận chuyển" value={fmtVND(data.shippingFee)} />
            <Row label="Thuế" value={fmtVND(data.taxTotal)} />
            <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <Row
              label={<span className="font-semibold">Tổng cộng</span>}
              value={<span className="text-lg font-bold">{fmtVND(data.grandTotal)}</span>}
            />
            <div className="mt-3 text-sm text-gray-600">
              Phương thức: <b>{paymentMethod ? PAYMENT_METHOD_LABEL[paymentMethod] : "—"}</b>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Trạng thái thanh toán: {PAYMENT_STATUS_VI[data.paymentStatus]}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white p-5 shadow-md"
          >
            <h3 className="mb-4 text-lg font-semibold">Giao hàng & Thanh toán</h3>
            <div className="space-y-1 text-sm">
              <div>
                Người nhận: <b>{data.receiverName ?? "—"}</b>
              </div>
              <div>
                SĐT: <b>{data.receiverPhone ?? "—"}</b>
              </div>
              {data.receiverEmail && (
                <div>
                  Email: <b>{data.receiverEmail}</b>
                </div>
              )}
              <div className="text-gray-700">{data.addressLine ?? "—"}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Field icon={Package} label="Tạo" value={fmtDate(data.createdAt)} />
              <Field icon={CheckCircle2} label="Xác nhận" value={fmtDate(data.confirmedAt)} />
              <Field icon={Truck} label="Giao" value={fmtDate(data.shippedAt)} />
              <Field icon={CreditCard} label="Hoàn tất" value={fmtDate(data.completedAt)} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ===== Small UI ===== */
function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-500" /> {label}: <b>{value}</b>
    </div>
  );
}
