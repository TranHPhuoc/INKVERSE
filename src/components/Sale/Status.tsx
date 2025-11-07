// src/components/Sale/status-tokens.tsx
import type { ReactNode } from "react";
import type { OrderStatus, PaymentStatus } from "../../types/sale-order";
import {
  Clock,
  ClipboardCheck,
  Box,
  Truck,
  CheckCircle2,
  BadgeCheck,
  XCircle,
} from "lucide-react";

/* ---------- Colors for badges ---------- */
export const ORDER_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-cyan-100 text-cyan-800",
  DELIVERED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELED: "bg-rose-100 text-rose-800",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800",
};

export const PAYMENT_COLOR: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  UNPAID: "bg-gray-100 text-gray-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-700",
  CANCELED: "bg-rose-100 text-rose-700",
  REFUND_PENDING: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-lime-100 text-lime-800",
};

/* ---------- Tabs (no count) ---------- */
export type TabId =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "delivered"
  | "completed"
  | "canceled";

export const TAB_DEF: {
  id: TabId;
  label: string;
  statuses: [OrderStatus, ...OrderStatus[]];
  icon: ReactNode;
  color: string; // active style
}[] = [
  { id: "pending",   label: "Chờ xử lý",  statuses: ["PENDING"],    icon: <Clock className="h-4 w-4" />,        color: "bg-yellow-50 text-yellow-700" },
  { id: "confirmed", label: "Đã xác nhận",statuses: ["CONFIRMED"],  icon: <ClipboardCheck className="h-4 w-4"/>,color: "bg-blue-50 text-blue-700" },
  { id: "processing",label: "Đang xử lý", statuses: ["PROCESSING"], icon: <Box className="h-4 w-4" />,          color: "bg-indigo-50 text-indigo-700" },
  { id: "shipping",  label: "Đang giao",  statuses: ["SHIPPED"],    icon: <Truck className="h-4 w-4" />,        color: "bg-cyan-50 text-cyan-700" },
  { id: "delivered", label: "Đã giao",    statuses: ["DELIVERED"],  icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-green-50 text-green-700" },
  { id: "completed", label: "Hoàn tất",   statuses: ["COMPLETED"],  icon: <BadgeCheck className="h-4 w-4" />,   color: "bg-emerald-50 text-emerald-700" },
  { id: "canceled",  label: "Đã huỷ",     statuses: ["CANCELED","CANCEL_REQUESTED"], icon: <XCircle className="h-4 w-4" />, color: "bg-rose-50 text-rose-700" },
];
