import type { OrderStatus, PaymentStatus } from "../../types/sale-order";
import { viStatusLabel, viPaymentLabel } from "../../types/labels";

/* ===== Order badge ===== */
const ORDER_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-rose-100 text-rose-800",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800",
};

export function OrderStatusBadge({ value }: { value: OrderStatus }) {
  const cls = ORDER_COLOR[value] ?? "bg-gray-100 text-gray-800";
  const label = viStatusLabel[value] ?? value;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-black/5 ${cls}`}
      title={value}
    >
      {label}
    </span>
  );
}

/* ===== Payment badge (đủ 7 trạng thái) ===== */
const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  UNPAID: "bg-gray-100 text-gray-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-700",
  CANCELED: "bg-rose-100 text-rose-700",
  REFUND_PENDING: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-lime-100 text-lime-800",
};

export function PaymentStatusBadge({ value }: { value: PaymentStatus }) {
  const cls = PAYMENT_COLOR[value] ?? "bg-gray-100 text-gray-800";
  const label = viPaymentLabel[value] ?? value;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-black/5 ${cls}`}
      title={value}
    >
      {label}
    </span>
  );
}
