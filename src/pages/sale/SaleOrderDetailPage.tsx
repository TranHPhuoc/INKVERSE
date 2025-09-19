import { useEffect, useState } from "react";
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
import type { ResOrderAdmin } from "../../types/sale-order";
import {
  PAYMENT_STATUS,
  type PaymentStatus,
  REFUND_METHOD,
  type RefundMethod,
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

const nf = new Intl.NumberFormat("vi-VN");

export default function SaleOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const [o, setO] = useState<ResOrderAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await saleGetOrder(orderId);
      setO(data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e.message || "Load lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [orderId]);

  async function onUpdatePayment(paymentStatus: PaymentStatus, paidAt?: string | null) {
    await saleUpdatePayment(orderId, { paymentStatus, paidAt: paidAt || undefined });
    await refresh();
  }

  async function onUpdateShipping(payload: {
    fee?: string;
    carrier?: string;
    track?: string;
    shippedAt?: string;
  }) {
    await saleUpdateShipping(orderId, {
      fee: payload.fee,
      shippingCarrier: payload.carrier,
      trackingCode: payload.track,
      shippedAt: payload.shippedAt,
    });
    await refresh();
  }

  async function onAssign(assigneeId: number) {
    await saleAssignOrder(orderId, { assigneeId });
    await refresh();
  }

  async function onAddNote(note: string) {
    await saleAddNote(orderId, { note });
  }

  async function onCancel(reason: string) {
    await saleCancelOrder(orderId, { reason });
    await refresh();
  }

  async function onRefundManual(amount: string, method: RefundMethod) {
    await saleRefundManual(orderId, { amount, method });
    await refresh();
  }

  if (loading) return <div>Đang tải...</div>;
  if (err) return <div className="text-red-600">{err}</div>;
  if (!o) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Đơn hàng #{o.code}</h1>
        <div className="flex items-center gap-2">
          <OrderStatusBadge value={o.status} />
          <PaymentStatusBadge value={o.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* LEFT */}
        <div className="space-y-4 md:col-span-2">
          <Card
            title="Thông tin giao hàng"
            icon={<MapPin className="h-4 w-4" />}
            color="from-pink-50 to-rose-100"
          >
            <div className="text-sm">
              <div>
                {o.shippingAddress?.receiverName} — {o.shippingAddress?.receiverPhone}
              </div>
              <div>{o.shippingAddress?.receiverEmail}</div>
              <div>
                {[
                  o.shippingAddress?.line1,
                  o.shippingAddress?.line2,
                  o.shippingAddress?.ward,
                  o.shippingAddress?.district,
                  o.shippingAddress?.province,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          </Card>

          <Card title="Sản phẩm" icon={<Package className="h-4 w-4" />}>
            <OrderItemsTable items={o.items} />
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Payment */}
          <Card
            title="Cập nhật thanh toán"
            icon={<CreditCard className="h-4 w-4" />}
            color="from-indigo-50 to-blue-100"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const status = fd.get("paymentStatus") as PaymentStatus;
                const paidAt = (fd.get("paidAt") as string) || undefined;
                await onUpdatePayment(status, paidAt);
              }}
              className="space-y-2"
            >
              <select
                name="paymentStatus"
                className="w-full rounded-xl border px-3 py-2"
                defaultValue={o.paymentStatus}
              >
                {Object.values(PAYMENT_STATUS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                name="paidAt"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="ISO paidAt"
              />
              <StyledButton type="submit">Cập nhật</StyledButton>
            </form>
          </Card>

          {/* Shipping */}
          <Card
            title="Thông tin vận chuyển"
            icon={<Truck className="h-4 w-4" />}
            color="from-sky-50 to-cyan-100"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                await onUpdateShipping({
                  fee: fd.get("fee") as string,
                  carrier: fd.get("carrier") as string,
                  track: fd.get("tracking") as string,
                  shippedAt: fd.get("shippedAt") as string,
                });
              }}
              className="space-y-2"
            >
              <input
                name="fee"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Phí ship"
              />
              <input
                name="carrier"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Hãng vận chuyển"
              />
              <input
                name="tracking"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Mã vận đơn"
              />
              <input
                name="shippedAt"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="ISO shippedAt"
              />
              <StyledButton type="submit">Lưu</StyledButton>
            </form>
          </Card>

          {/* Assign */}
          <Card
            title="Giao nhân viên phụ trách"
            icon={<UserCheck className="h-4 w-4" />}
            color="from-amber-50 to-yellow-100"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const id = Number((e.currentTarget as HTMLFormElement).assigneeId.value);
                if (id > 0) await onAssign(id);
              }}
              className="flex gap-2"
            >
              <input
                name="assigneeId"
                className="flex-1 rounded-xl border px-3 py-2"
                placeholder="UserId nhân viên"
              />
              <StyledButton type="submit" className="w-auto">
                Giao
              </StyledButton>
            </form>
            <div className="mt-1 text-sm text-gray-600">
              Hiện tại: {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "Chưa có")}
            </div>
          </Card>

          {/* Note */}
          <Card
            title="Thêm ghi chú"
            icon={<StickyNote className="h-4 w-4" />}
            color="from-purple-50 to-fuchsia-100"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const note = String((e.currentTarget as HTMLFormElement).note.value || "");
                if (note.trim()) await onAddNote(note);
              }}
              className="space-y-2"
            >
              <textarea
                name="note"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Nội dung ghi chú..."
              />
              <StyledButton type="submit">Thêm</StyledButton>
            </form>
          </Card>

          {/* Cancel */}
          <Card title="Huỷ đơn" icon={<Ban className="h-4 w-4" />} color="from-rose-50 to-red-100">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const reason = String((e.currentTarget as HTMLFormElement).reason.value || "");
                if (reason.trim()) await onCancel(reason);
              }}
              className="space-y-2"
            >
              <input
                name="reason"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Lý do huỷ"
              />
              <StyledButton type="submit" className="text-rose-600 hover:bg-rose-50">
                Huỷ đơn
              </StyledButton>
            </form>
          </Card>

          {/* Refund */}
          <Card
            title="Hoàn tiền thủ công"
            icon={<RotateCcw className="h-4 w-4" />}
            color="from-lime-50 to-green-100"
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const amount = String((e.currentTarget as HTMLFormElement).amount.value || "");
                const method = (
                  e.currentTarget as HTMLFormElement
                ).method.valueOf() as RefundMethod;
                if (amount && method) await onRefundManual(amount, method);
              }}
              className="space-y-2"
            >
              <input
                name="amount"
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Số tiền"
              />
              <select name="method" className="w-full rounded-xl border px-3 py-2">
                {Object.values(REFUND_METHOD).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <StyledButton type="submit">Hoàn tiền</StyledButton>
            </form>
          </Card>
        </div>
      </div>

      {/* Totals */}
      <div className="grid gap-3 rounded-2xl border bg-white/60 p-4 sm:grid-cols-2 md:grid-cols-4">
        <Money label="Tạm tính" value={nf.format(Number(o.subtotal))} />
        <Money label="Phí ship" value={nf.format(Number(o.shippingFee ?? 0))} />
        <Money label="Giảm" value={nf.format(Number(o.discount ?? 0))} />
        <Money label="Tổng" value={nf.format(Number(o.total))} strong />
      </div>
    </div>
  );
}

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
