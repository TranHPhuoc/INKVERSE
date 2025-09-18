import type { OrderStatus, PaymentStatus } from "../../types/sale-order";

export function OrderStatusBadge({ value }: { value: OrderStatus }) {
    const map: Record<OrderStatus, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        CONFIRMED: "bg-blue-100 text-blue-800",
        PROCESSING: "bg-indigo-100 text-indigo-800",
        SHIPPED: "bg-cyan-100 text-cyan-800",
        DELIVERED: "bg-green-100 text-green-800",
        CANCELED: "bg-red-100 text-red-800",
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[value]}`}>
      {value}
    </span>
    );
}

export function PaymentStatusBadge({ value }: { value: PaymentStatus }) {
    const map: Record<PaymentStatus, string> = {
        UNPAID: "bg-gray-100 text-gray-800",
        PAID: "bg-emerald-100 text-emerald-800",
        REFUND_PENDING: "bg-orange-100 text-orange-800",
        REFUNDED: "bg-lime-100 text-lime-800",
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[value]}`}>
      {value}
    </span>
    );
}
