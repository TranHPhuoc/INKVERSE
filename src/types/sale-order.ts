// src/types/sale-order.ts

/* =================== Enums =================== */
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "CANCEL_REQUESTED";

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  UNPAID: "UNPAID",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
  REFUNDED: "REFUNDED",
  REFUND_PENDING: "REFUND_PENDING",
} as const;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;

export type PaymentMethod = "COD" | "VNPAY";

/* =================== Pagination =================== */
export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

/* =================== Order DTOs =================== */
export type ResOrderAdmin = {
  id: number;
  code: string;
  status: OrderStatus;

  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  payment?: { paymentMethod?: PaymentMethod | null } | null;

  subtotal?: string | number | null;
  shippingFee?: string | number | null;
  discount?: string | number | null;
  total: string | number;

  createdAt: string;
  paidAt?: string | null;

  assigneeId?: number | null;
  assigneeName?: string | null;

  items?: Array<{
    id: number;
    bookId: number;
    title: string;
    imageUrl?: string | null;
    price: string | number;
    qty: number;
  }>;

  shippingAddress?: {
    receiverName?: string | null;
    receiverPhone?: string | null;
    receiverEmail?: string | null;
    line1?: string | null;
    line2?: string | null;
    ward?: string | null;
    district?: string | null;
    province?: string | null;
  } | null;
};

/* =================== Request DTOs =================== */
export type ReqUpdateOrderStatus = { status: OrderStatus };
export type ReqUpdatePayment = { paymentStatus: PaymentStatus; paidAt?: string };

/** strict mode: exactOptionalPropertyTypes=true → dùng `string | undefined` */
export type ReqUpdateShipping = {
  fee?: string | undefined;
  shippingCarrier?: string | undefined;
  trackingCode?: string | undefined;
  shippedAt?: string | undefined;
};

/* ===== Refund types (export để import ở page) ===== */
export type RefundMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "OTHER";
export const REFUND_METHODS: ReadonlyArray<RefundMethod> = [
  "CASH",
  "BANK_TRANSFER",
  "MOMO",
  "OTHER",
];

export type ReqAssignOrder = { assigneeId: number };
export type ReqCreateNote = { note: string };
export type ReqCancelOrder = { reason: string };
export type ReqRefundManual = { amount: string; method: RefundMethod };
