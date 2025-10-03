import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";

import {
  saleAddNote,
  saleAssignOrder,
  saleCancelOrder,
  saleGetOrder,
  saleRefundManual,
  saleUpdatePayment,
  saleUpdateShipping,
} from "../../services/sale/sale-order";

import type {
  ResOrderAdmin,
  PaymentMethod,
  PaymentStatus,
  ReqUpdatePayment,
  ReqUpdateShipping,
} from "../../types/sale-order";

import { OrderStatusBadge, PaymentStatusBadge } from "../../components/sale/StatusBadge";
import OrderItemsTable from "../../components/sale/OrderItemsTable";
import {
  Ban,
  CreditCard,
  MapPin,
  Package,
  RotateCcw,
  StickyNote,
  Truck,
  UserCheck,
} from "lucide-react";

/* ---------- helpers ---------- */
const nf = new Intl.NumberFormat("vi-VN");

const payMethodLabel: Record<PaymentMethod, string> = {
  COD: "Tiền mặt (COD)",
  VNPAY: "VNPay",
};
const payMethodColor: Record<PaymentMethod, string> = {
  COD: "bg-gray-100 text-gray-800 border-gray-300",
  VNPAY: "bg-teal-100 text-teal-800 border-teal-300",
};

/** Chuẩn hoá string → COD/VNPAY */
function normalizeMethod(v: unknown): PaymentMethod | null {
  if (v == null) return null;
  const s = String(v).toUpperCase().replace(/[^A-Z_]/g, "");
  if (s === "COD" || s === "CASH" || s === "CASHONDELIVERY") return "COD";
  if (s === "VNPAY" || s === "VN_PAY" || s === "VNPAYQR" || s === "VNPAY_QR") return "VNPAY";
  return null;
}

/** Lấy paymentMethod từ nhiều key có thể có */
function getPaymentMethod(o: ResOrderAdmin): PaymentMethod | null {
  const obj = o as unknown as Record<string, unknown>;
  return (
    normalizeMethod(obj.paymentMethod) ??
    normalizeMethod(obj.paymentType) ??
    normalizeMethod(obj.payment_method) ??
    normalizeMethod(obj.method) ??
    null
  );
}

/** đọc shippingAddress an toàn không dùng any */
type ShippingAddressLocal = {
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverEmail?: string | null;
  line1?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  addressLine?: string | null;
};
function getShippingAddress(o: ResOrderAdmin): ShippingAddressLocal | null {
  const obj = o as unknown as Record<string, unknown>;
  const sa = obj.shippingAddress;
  return sa && typeof sa === "object" ? (sa as ShippingAddressLocal) : null;
}

function extractErr(e: unknown, fallback = "Load lỗi"): string {
  const maybeResp = e as { response?: { data?: { message?: string } } };
  if (maybeResp?.response?.data?.message) return maybeResp.response.data.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

function fdStr(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

/** local options cho PaymentStatus */
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
  "REFUND_PENDING",
  "REFUNDED",
];

/** local RefundMethod (khỏi lệ thuộc types nếu chưa export) */
type RefundMethodLocal = "CASH" | "BANK_TRANSFER" | "MOMO" | "OTHER";
const REFUND_METHODS: ReadonlyArray<RefundMethodLocal> = [
  "CASH",
  "BANK_TRANSFER",
  "MOMO",
  "OTHER",
];
function parseRefundMethod(v: unknown): RefundMethodLocal | undefined {
  if (typeof v !== "string") return undefined;
  return REFUND_METHODS.includes(v as RefundMethodLocal) ? (v as RefundMethodLocal) : undefined;
}

/* ---------- Page ---------- */
export default function SaleOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);

  const [o, setO] = useState<ResOrderAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await saleGetOrder(orderId);
      setO(data);
    } catch (e: unknown) {
      setErr(extractErr(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onUpdatePayment(paymentStatus: PaymentStatus, paidAt?: string) {
    const body: ReqUpdatePayment = paidAt && paidAt.trim() ? { paymentStatus, paidAt } : { paymentStatus };
    await saleUpdatePayment(orderId, body);
    await refresh();
  }

  async function onUpdateShipping(fd: FormData) {
    const payload: ReqUpdateShipping = {
      ...(fdStr(fd, "fee") ? { fee: fdStr(fd, "fee")! } : {}),
      ...(fdStr(fd, "carrier") ? { carrier: fdStr(fd, "carrier")! } : {}),
      ...(fdStr(fd, "tracking") ? { trackingCode: fdStr(fd, "tracking")! } : {}),
      ...(fdStr(fd, "shippedAt") ? { shippedAt: fdStr(fd, "shippedAt")! } : {}),
    };
    await saleUpdateShipping(orderId, payload);
    await refresh();
  }

  async function onAssign(assigneeId: number) {
    await saleAssignOrder(orderId, { assigneeId });
    await refresh();
  }

  async function onAddNote(note: string) {
    if (!note.trim()) return;
    // nếu FE types của mày đang là {content:string} thì giữ nguyên cast này
    await saleAddNote(orderId, ({ note } as unknown) as { content: string });
  }

  async function onCancel(reason: string) {
    if (!reason.trim()) return;
    await saleCancelOrder(orderId, { reason });
    await refresh();
  }

  async function onRefundManual(amount: string, method: RefundMethodLocal) {
    if (!amount.trim()) return;
    await saleRefundManual(orderId, ({ amount: Number(amount), method } as unknown) as Record<string, never>);
    await refresh();
  }

  if (loading) return <div>Đang tải...</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!o) return null;

  const method = getPaymentMethod(o);
  const sa = getShippingAddress(o);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Đơn hàng #{o.code}</h1>
        <div className="flex items-center gap-2">
          {method ? (
            <span
              className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs ${payMethodColor[method]}`}
              title={method}
            >
              {payMethodLabel[method]}
            </span>
          ) : null}
          <PaymentStatusBadge value={o.paymentStatus} />
          <OrderStatusBadge value={o.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4 md:col-span-2">
          <Card title="Thông tin giao hàng" icon={<MapPin className="h-4 w-4" />} color="from-pink-50 to-rose-100">
            <div className="text-sm">
              <div>{sa?.receiverName ?? "—"} — {sa?.receiverPhone ?? "—"}</div>
              <div>{sa?.receiverEmail ?? "—"}</div>
              <div>{sa?.addressLine ?? sa?.line1 ?? "—"}</div>
              <div>Phụ trách: {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "—")}</div>
            </div>
          </Card>

          <Card title="Sản phẩm" icon={<Package className="h-4 w-4" />}>
            <OrderItemsTable items={o.items ?? []} />
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Payment */}
          <Card title="Cập nhật thanh toán" icon={<CreditCard className="h-4 w-4" />} color="from-indigo-50 to-blue-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const status = (fd.get("paymentStatus") as PaymentStatus) ?? o.paymentStatus;
                const paidAt = fdStr(fd, "paidAt");
                await onUpdatePayment(status, paidAt);
              }}
              className="space-y-2"
            >
              <select name="paymentStatus" className="w-full rounded-xl border px-3 py-2" defaultValue={o.paymentStatus}>
                {PAYMENT_STATUS_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input name="paidAt" className="w-full rounded-xl border px-3 py-2" placeholder="ISO paidAt (tuỳ chọn)" />
              <StyledButton type="submit">Cập nhật</StyledButton>
            </form>
          </Card>

          {/* Shipping */}
          <Card title="Thông tin vận chuyển" icon={<Truck className="h-4 w-4" />} color="from-sky-50 to-cyan-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await onUpdateShipping(fd);
              }}
              className="space-y-2"
            >
              <input name="fee" className="w-full rounded-xl border px-3 py-2" placeholder="Phí ship" />
              <input name="carrier" className="w-full rounded-xl border px-3 py-2" placeholder="Hãng vận chuyển" />
              <input name="tracking" className="w-full rounded-xl border px-3 py-2" placeholder="Mã vận đơn" />
              <input name="shippedAt" className="w-full rounded-xl border px-3 py-2" placeholder="ISO shippedAt" />
              <StyledButton type="submit">Lưu</StyledButton>
            </form>
          </Card>

          {/* Assign */}
          <Card title="Giao nhân viên phụ trách" icon={<UserCheck className="h-4 w-4" />} color="from-amber-50 to-yellow-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const idVal = new FormData(e.currentTarget).get("assigneeId");
                const idNum = typeof idVal === "string" ? Number(idVal) : NaN;
                if (Number.isFinite(idNum) && idNum > 0) await onAssign(idNum);
              }}
              className="flex gap-2"
            >
              <input name="assigneeId" className="flex-1 rounded-xl border px-3 py-2" placeholder="UserId nhân viên" />
              <StyledButton type="submit" className="w-auto">Giao</StyledButton>
            </form>
            <div className="mt-1 text-sm text-gray-600">
              Hiện tại: {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "Chưa có")}
            </div>
          </Card>

          {/* Note */}
          <Card title="Thêm ghi chú" icon={<StickyNote className="h-4 w-4" />} color="from-purple-50 to-fuchsia-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const note = fdStr(new FormData(e.currentTarget), "note") ?? "";
                await onAddNote(note);
              }}
              className="space-y-2"
            >
              <textarea name="note" className="w-full rounded-xl border px-3 py-2" placeholder="Nội dung ghi chú..." />
              <StyledButton type="submit">Thêm</StyledButton>
            </form>
          </Card>

          {/* Cancel */}
          <Card title="Huỷ đơn" icon={<Ban className="h-4 w-4" />} color="from-rose-50 to-red-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const reason = fdStr(new FormData(e.currentTarget), "reason") ?? "";
                await onCancel(reason);
              }}
              className="space-y-2"
            >
              <input name="reason" className="w-full rounded-xl border px-3 py-2" placeholder="Lý do huỷ" />
              <StyledButton type="submit" className="text-rose-600 hover:bg-rose-50">Huỷ đơn</StyledButton>
            </form>
          </Card>

          {/* Refund manual */}
          <Card title="Hoàn tiền thủ công" icon={<RotateCcw className="h-4 w-4" />} color="from-lime-50 to-green-100">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const amount = fdStr(fd, "amount") ?? "";
                const method = parseRefundMethod(fd.get("method"));
                if (amount && method) await onRefundManual(amount, method);
              }}
              className="space-y-2"
            >
              <input name="amount" className="w-full rounded-xl border px-3 py-2" placeholder="Số tiền" />
              <select name="method" className="w-full rounded-xl border px-3 py-2">
                {REFUND_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <StyledButton type="submit">Hoàn tiền</StyledButton>
            </form>
          </Card>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-3 rounded-2xl border bg-white/60 p-4 sm:grid-cols-2 md:grid-cols-4">
        <Money label="Tạm tính" value={nf.format(Number(((o as unknown as Record<string, unknown>).subtotal) ?? 0))} />
        <Money label="Phí ship" value={nf.format(Number(((o as unknown as Record<string, unknown>).shippingFee) ?? 0))} />
        <Money label="Giảm" value={nf.format(Number(((o as unknown as Record<string, unknown>).discount) ?? 0))} />
        <Money label="Tổng" value={nf.format(Number(o.total ?? ((o as unknown as Record<string, unknown>).grandTotal ?? 0)))} strong />
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function Card({
                title,
                icon,
                children,
                color = "from-white to-gray-50",
              }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${color}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-white/60">
            {icon}
          </span>
        )}
        <div className="font-medium">{title}</div>
      </div>
      {children}
    </div>
  );
}

function StyledButton({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`cursor-pointer rounded-xl border px-3 py-2 shadow-sm hover:bg-gray-100 active:scale-95 ${className}`}
      type={props.type ?? "button"}
    />
  );
}

function Money({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
      <span className="text-gray-600">{label}</span>
      <span className={strong ? "text-lg font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
