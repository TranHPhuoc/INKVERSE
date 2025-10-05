// src/pages/sale/SaleOrderDetailPage.tsx
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CornerUpLeft,
  MapPin,
  Package,
  CreditCard,
  Truck,
  UserCheck,
  StickyNote,
  Ban,
  RotateCcw,
} from "lucide-react";

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
  RefundMethod,
} from "../../types/sale-order";

import { OrderStatusBadge, PaymentStatusBadge } from "../../components/sale/StatusBadge";
import OrderItemsTable from "../../components/sale/OrderItemsTable";

/* ================= helpers ================= */
const nf = new Intl.NumberFormat("vi-VN");

const PAY_LABEL: Record<PaymentMethod, string> = {
  COD: "Tiền mặt (COD)",
  VNPAY: "VNPay",
};
const PAY_COLOR: Record<PaymentMethod, string> = {
  COD: "bg-gray-100 text-gray-800 border-gray-300",
  VNPAY: "bg-teal-100 text-teal-800 border-teal-300",
};

const PAYMENT_STATUS_OPTIONS: readonly PaymentStatus[] = [
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELED",
  "REFUND_PENDING",
  "REFUNDED",
];

function extractErr(e: unknown, fallback = "Có lỗi xảy ra"): string {
  const maybe = e as { response?: { data?: { message?: string } } };
  if (maybe?.response?.data?.message) return maybe.response.data.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
function fdStr(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s || undefined;
}
function toNum(n: number | string | null | undefined): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}
function joinParts(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(", ");
}

/* ================= Page ================= */
export default function SaleOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const navigate = useNavigate();

  const [o, setO] = useState<ResOrderAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await saleGetOrder(orderId);
      setO(data);
    } catch (e) {
      setErr(extractErr(e, "Tải đơn hàng thất bại"));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const method = o?.paymentMethod ?? null;
  const sa = o?.shippingAddress ?? null;

  const addressJoined = useMemo(() => {
    const line = sa?.addressLine?.trim() || "";
    if (line) return line;
    const alt = joinParts([
      sa?.line1 ?? "",
      sa?.ward ?? "",
      sa?.district ?? "",
      sa?.province ?? "",
    ]);
    return alt || "—";
  }, [sa?.addressLine, sa?.line1, sa?.ward, sa?.district, sa?.province]);

  async function onUpdatePayment(paymentStatus: PaymentStatus, paidAt?: string) {
    if (!o) return;
    setBusy(true);
    try {
      const body: ReqUpdatePayment = paidAt ? { paymentStatus, paidAt } : { paymentStatus };
      await saleUpdatePayment(o.id, body);
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateShipping(fd: FormData) {
    if (!o) return;
    setBusy(true);
    try {
      const payload: ReqUpdateShipping = {
        ...(fdStr(fd, "fee") ? { fee: fdStr(fd, "fee")! } : {}),
        ...(fdStr(fd, "shippingCarrier") ? { shippingCarrier: fdStr(fd, "shippingCarrier")! } : {}),
        ...(fdStr(fd, "trackingCode") ? { trackingCode: fdStr(fd, "trackingCode")! } : {}),
        ...(fdStr(fd, "shippedAt") ? { shippedAt: fdStr(fd, "shippedAt")! } : {}),
      };
      await saleUpdateShipping(o.id, payload);
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(assigneeId: number) {
    if (!o) return;
    setBusy(true);
    try {
      await saleAssignOrder(o.id, { assigneeId });
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function onAddNote(note: string) {
    if (!o || !note.trim()) return;
    setBusy(true);
    try {
      await saleAddNote(o.id, { note });
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(reason: string) {
    if (!o || !reason.trim()) return;
    if (!window.confirm("Xác nhận huỷ đơn này?")) return;
    setBusy(true);
    try {
      await saleCancelOrder(o.id, { reason });
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  async function onRefundManual(amount: string, method: RefundMethod) {
    if (!o) return;
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) return;
    setBusy(true);
    try {
      await saleRefundManual(o.id, { amount: val, method });
      await refresh();
    } catch (e) {
      alert(extractErr(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!o) return null;

  return (
    <div className="mx-auto max-w-[1550px] space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 shadow-sm hover:bg-gray-100 active:scale-95"
          >
            <CornerUpLeft className="h-4 w-4" />
            Quay lại
          </button>

          <h1 className="text-xl font-semibold">Đơn hàng #{o.code}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {method ? (
            <span
              className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs ${PAY_COLOR[method]}`}
              title={method}
            >
              {PAY_LABEL[method]}
            </span>
          ) : null}
          <PaymentStatusBadge value={o.paymentStatus} />
          <OrderStatusBadge value={o.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4 md:col-span-2">
          <Card
            title="Thông tin giao hàng"
            icon={<MapPin className="h-4 w-4" />}
            accent="from-rose-50 to-pink-50"
          >
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
              <Row label="Khách hàng" value={o.customerName ?? "—"} />
              <Row label="Số điện thoại" value={o.customerPhone ?? "—"} />
              <Row label="Email" value={o.customerEmail ?? sa?.receiverEmail ?? "—"} />
              <Row label="Địa chỉ" value={addressJoined} />
            </div>

            <div className="mt-4 grid grid-cols-2 text-xs text-gray-500">
              <div>Ngày tạo: {new Date(o.createdAt).toLocaleString()}</div>
              <div className="text-right">
                Cập nhật: {o.updatedAt ? new Date(o.updatedAt).toLocaleString() : "—"}
              </div>
            </div>
          </Card>

          <Card
            title="Sản phẩm"
            icon={<Package className="h-4 w-4" />}
            accent="from-slate-50 to-slate-100"
          >
            <OrderItemsTable items={o.items ?? []} />
          </Card>

          <div className="grid gap-3 rounded-2xl bg-white/80 p-4 shadow-sm">
            <Totals label="Tạm tính" value={nf.format(toNum(o.subtotal))} />
            <Totals label="Phí ship" value={nf.format(toNum(o.shippingFee))} />
            <Totals label="Giảm" value={nf.format(toNum(o.discount))} />
            <Totals label="Tổng" strong value={nf.format(toNum(o.total))} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Thanh toán */}
          <Card
            title="Cập nhật thanh toán"
            icon={<CreditCard className="h-4 w-4" />}
            accent="from-indigo-50 to-blue-50"
          >
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
              <Select name="paymentStatus" defaultValue={o.paymentStatus}>
                {PAYMENT_STATUS_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Input name="paidAt" placeholder="ISO paidAt (tuỳ chọn)" />
              <Btn variant="primary" type="submit" disabled={busy}>
                Cập nhật
              </Btn>
            </form>
          </Card>

          {/* Vận chuyển */}
          <Card
            title="Thông tin vận chuyển"
            icon={<Truck className="h-4 w-4" />}
            accent="from-cyan-50 to-sky-50"
          >
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                await onUpdateShipping(new FormData(e.currentTarget));
              }}
              className="space-y-2"
            >
              <Input name="fee" placeholder="Phí ship" />
              <Input name="shippingCarrier" placeholder="Hãng vận chuyển" />
              <Input name="trackingCode" placeholder="Mã vận đơn" />
              <Input name="shippedAt" placeholder="ISO shippedAt" />
              <Btn variant="primary" type="submit" disabled={busy}>
                Lưu
              </Btn>
            </form>
          </Card>

          {/* Giao phụ trách */}
          <Card
            title="Giao nhân viên phụ trách"
            icon={<UserCheck className="h-4 w-4" />}
            accent="from-amber-50 to-yellow-50"
          >
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const idVal = new FormData(e.currentTarget).get("assigneeId");
                const idNum = typeof idVal === "string" ? Number(idVal) : NaN;
                if (Number.isFinite(idNum) && idNum > 0) await onAssign(idNum);
              }}
              className="flex gap-2"
            >
              <Input name="assigneeId" placeholder="UserId nhân viên" className="flex-1" />
              <Btn variant="outline" type="submit" disabled={busy} className="w-auto">
                Giao
              </Btn>
            </form>
            <div className="mt-2 text-sm text-gray-600">
              Hiện tại: {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "Chưa có")}
            </div>
          </Card>

          {/* Ghi chú */}
          <Card
            title="Thêm ghi chú"
            icon={<StickyNote className="h-4 w-4" />}
            accent="from-fuchsia-50 to-purple-50"
          >
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const note = fdStr(new FormData(e.currentTarget), "note") ?? "";
                await onAddNote(note);
                e.currentTarget.reset();
              }}
              className="space-y-2"
            >
              <Textarea name="note" placeholder="Nội dung ghi chú…" />
              <Btn variant="outline" type="submit" disabled={busy}>
                Thêm
              </Btn>
            </form>
          </Card>

          {/* Huỷ */}
          <Card title="Huỷ đơn" icon={<Ban className="h-4 w-4" />} accent="from-rose-50 to-red-50">
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const reason = fdStr(new FormData(e.currentTarget), "reason") ?? "";
                await onCancel(reason);
              }}
              className="space-y-2"
            >
              <Input name="reason" placeholder="Lý do huỷ" />
              <Btn variant="danger" type="submit" disabled={busy} title="Huỷ đơn">
                Huỷ đơn
              </Btn>
            </form>
          </Card>

          {/* Hoàn tiền thủ công */}
          <Card
            title="Hoàn tiền thủ công"
            icon={<RotateCcw className="h-4 w-4" />}
            accent="from-emerald-50 to-green-50"
          >
            <form
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const amount = fdStr(fd, "amount") ?? "";
                const method = fd.get("method") as RefundMethod | null;
                if (method) await onRefundManual(amount, method);
              }}
              className="space-y-2"
            >
              <Input name="amount" placeholder="Số tiền" />
              <Select name="method" defaultValue="">
                <option value="" disabled>
                  Phương thức
                </option>
                {(["CASH", "BANK_TRANSFER", "MOMO", "OTHER"] as const).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Btn variant="primary" type="submit" disabled={busy}>
                Hoàn tiền
              </Btn>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= small UI ================= */
function Card({
  title,
  icon,
  children,
  accent = "from-white to-gray-50",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-gradient-to-br ${accent} p-4 shadow-sm`}>
      <div className="mb-3 flex items-center gap-2">
        {icon ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border bg-white/70">
            {icon}
          </span>
        ) : null}
        <div className="font-medium">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <div className="text-gray-600">{label}</div>
      <div className="font-medium">{value}</div>
    </>
  );
}

function Totals({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
      <span className="text-gray-600">{label}</span>
      <span className={strong ? "text-lg font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}

/* Inputs */
function baseInput(className = "") {
  return `w-full rounded-xl border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 hover:border-indigo-400 transition ${className}`;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={baseInput(className)} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={baseInput(className)} rows={3} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={baseInput(`appearance-none ${className}`)}>
      {children}
    </select>
  );
}

/* Buttons */
function Btn({
  variant = "outline",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" }) {
  const base =
    "cursor-pointer rounded-xl px-3 py-2 shadow-sm active:scale-95 disabled:opacity-60 transition border";
  const map: Record<string, string> = {
    primary: "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
    outline: "bg-white hover:bg-gray-100 border-gray-300 text-gray-800",
    danger: "bg-rose-50 text-rose-600 border-rose-300 hover:bg-rose-100",
  };
  return <button {...props} className={`${base} ${map[variant]} ${className}`} />;
}
