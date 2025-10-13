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
import api from "../services/api";
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
  X,
} from "lucide-react";
import { motion } from "framer-motion";

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

const CANCELABLE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];
const CANCEL_REASONS = [
  "Đặt nhầm sản phẩm",
  "Muốn chỉnh sửa đơn hàng",
  "Thời gian giao dự kiến quá lâu",
  "Tìm giá tốt hơn",
  "Không còn nhu cầu",
  "Thay đổi địa chỉ / SĐT",
  "Khác",
];

export default function OrderDetailPage() {
  const { code = "" } = useParams<{ code: string }>();

  const [data, setData] = useState<ResOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCancel, setShowCancel] = useState(false);
  const [reasonChecks, setReasonChecks] = useState<string[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  async function refetch() {
    const res = await getOrderByCode(code);
    setData(res);
    setErr(null);
  }

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

  const paymentMethod =
    (data as unknown as { paymentMethod?: PaymentMethod | null })?.paymentMethod ?? null;

  const canceledAt = (data as unknown as { canceledAt?: string | null })?.canceledAt ?? null;

  const isCanceledLike =
    !!data && (data.status === "CANCELED" || data.status === "CANCEL_REQUESTED");

  type StepKey = "createdAt" | "confirmedAt" | "shippedAt" | "completedAt" | "canceled";

  const baseTimeline = [
    { key: "createdAt" as const, label: "Tạo đơn", at: data?.createdAt, icon: Package },
    { key: "confirmedAt" as const, label: "Xác nhận", at: data?.confirmedAt, icon: CheckCircle2 },
    { key: "shippedAt" as const, label: "Đang giao", at: data?.shippedAt, icon: Truck },
    { key: "completedAt" as const, label: "Hoàn tất", at: data?.completedAt, icon: CreditCard },
  ];

  type TimelineStep = {
    key: StepKey;
    label: string;
    at: string | null | undefined;
    icon: React.ElementType;
  };

  const timeline: TimelineStep[] = isCanceledLike
    ? ([
        baseTimeline[0],
        baseTimeline[1],
        baseTimeline[2],
        {
          key: "canceled" as const,
          label: data!.status === "CANCELED" ? "Đã huỷ" : "Yêu cầu huỷ",
          at: canceledAt,
          icon: CircleX,
        },
      ] as TimelineStep[])
    : (baseTimeline as TimelineStep[]);

  const STEP_TO_MIN_STATUS: Record<Exclude<StepKey, "canceled">, OrderStatus> = {
    createdAt: "PENDING",
    confirmedAt: "CONFIRMED",
    shippedAt: "SHIPPED",
    completedAt: "COMPLETED",
  };
  function isStepDoneByStatus(stepKey: Exclude<StepKey, "canceled">, status: OrderStatus) {
    const cur = STATUS_ORDER.indexOf(status);
    const need = STATUS_ORDER.indexOf(STEP_TO_MIN_STATUS[stepKey]);
    return cur >= need;
  }
  const isDone = (stepKey: StepKey, dt?: string | null) => {
    if (stepKey === "canceled") return false;
    if (isCanceledLike) return !!dt;
    return (
      !!dt ||
      (data ? isStepDoneByStatus(stepKey as Exclude<StepKey, "canceled">, data.status) : false)
    );
  };

  const canCancel =
    !!data && CANCELABLE_STATUSES.includes(data.status) && data.paymentStatus !== "PAID";

  function toggleReason(r: string) {
    setReasonChecks((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }
  function closeCancelModal() {
    setShowCancel(false);
    setReasonChecks([]);
    setCancelReason("");
    setCancelErr(null);
  }

  async function performCancel() {
    if (!data) return;
    setCancelling(true);
    setCancelErr(null);
    try {
      const combinedReason = [...reasonChecks, cancelReason.trim()].filter(Boolean).join(" | ");
      const payload = combinedReason ? { reason: combinedReason } : undefined;

      let result: "canceled" | "requested" | null = null;

      try {
        const r1 = await api.post(`/api/v1/orders/${data.code}/cancel`, payload, {
          validateStatus: (s: number) => s < 500,
        });
        if (r1.status >= 200 && r1.status < 300) result = "canceled";
        else if (r1.status === 405 || r1.status === 404) result = null;
        else if (r1.status >= 400)
          throw new Error((r1.data?.message as string) || "Huỷ đơn thất bại");
      } catch {}

      if (!result) {
        const r2 = await api.post(`/api/v1/orders/${data.code}/request-cancel`, payload, {
          validateStatus: (s: number) => s < 500,
        });
        if (r2.status >= 200 && r2.status < 300) result = "requested";
        else throw new Error((r2.data?.message as string) || "Gửi yêu cầu huỷ thất bại");
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              status: result === "canceled" ? "CANCELED" : "CANCEL_REQUESTED",
              ...(result === "canceled" ? { canceledAt: new Date().toISOString() } : {}),
            }
          : prev,
      );

      closeCancelModal();
      refetch();
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ||
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Không thể huỷ đơn hàng";
      setCancelErr(msg);
    } finally {
      setCancelling(false);
    }
  }

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
  const cancelBtnLabel =
    data.status === "CANCEL_REQUESTED"
      ? "Đã yêu cầu hủy"
      : data.status === "CANCELED"
        ? "Đã huỷ"
        : "Hủy đơn hàng";

  return (
    <div className="container mx-auto px-4 py-8">
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
              className={`rounded-full px-3 py-1 text-sm ${badgeClassByPaymentStatus(data.paymentStatus)}`}
            >
              {PAYMENT_STATUS_VI[data.paymentStatus]}
            </span>

            <button
              disabled={!canCancel}
              onClick={() => canCancel && setShowCancel(true)}
              className={`ml-2 rounded-xl px-4 py-2 text-sm font-semibold shadow ${
                canCancel
                  ? "cursor-pointer bg-rose-600 text-white hover:bg-rose-500"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
              title={
                canCancel
                  ? "Hủy đơn hàng"
                  : "Không thể hủy: chỉ hỗ trợ khi đơn đang chờ xử lý/đang xử lý và chưa thanh toán."
              }
            >
              {cancelBtnLabel}
            </button>
          </div>
        </div>

        <div className="bg-white/70 px-5 py-4">
          <ol className="relative ml-1 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map(({ key, label, at, icon: Icon }, idx) => {
              const done = isDone(key, at);
              if (key === "canceled") {
                return (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
                      <X className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{fmtDate(at ?? undefined)}</div>
                    </div>
                  </li>
                );
              }
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
                    <div className="text-xs text-gray-500">{fmtDate(at ?? undefined)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
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

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Hủy đơn hàng</h4>
              <button
                className="rounded-lg p-1 hover:bg-gray-100"
                onClick={closeCancelModal}
                aria-label="Đóng"
              >
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Bạn chắc chắn muốn hủy đơn <b>{data.code}</b>?{" "}
              <span className="text-gray-500">
                (Tùy trạng thái hệ thống, thao tác có thể ghi nhận là <i>yêu cầu huỷ</i>.)
              </span>
            </p>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-gray-700">Chọn lý do</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CANCEL_REASONS.map((r) => {
                  const id = `cancel-reason-${r}`;
                  const checked = reasonChecks.includes(r);
                  return (
                    <label
                      key={r}
                      htmlFor={id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        checked ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        id={id}
                        type="checkbox"
                        className="h-4 w-4 accent-rose-600"
                        checked={checked}
                        onChange={() => toggleReason(r)}
                      />
                      <span>{r}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              Ghi chú thêm (tuỳ chọn)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700 focus:border-rose-500 focus:ring focus:ring-rose-100"
              placeholder="Ví dụ: đổi ý, đặt nhầm…"
            />

            {cancelErr && <div className="mt-2 text-sm text-rose-600">{cancelErr}</div>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Thoát
              </button>
              <button
                onClick={performCancel}
                disabled={cancelling}
                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500 disabled:opacity-60"
              >
                {cancelling ? "Đang xử lý..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
