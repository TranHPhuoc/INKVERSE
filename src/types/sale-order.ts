// ================= Enums (match BE) =================

export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  CANCEL_REQUESTED: "CANCEL_REQUESTED",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const REFUND_METHOD = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  GATEWAY: "GATEWAY",
} as const;
export type RefundMethod = (typeof REFUND_METHOD)[keyof typeof REFUND_METHOD];

// ================= Models =================

export type AddressSnapshot = {
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  line1?: string;
  line2?: string;
  ward?: string;
  district?: string;
  province?: string;
};

export type ResOrderItem = {
  bookId: number;
  title: string;
  imageUrl?: string | null;
  sku?: string | null;
  price: number | string;
  discount?: number | string | null;
  qty: number;
  lineTotal: number | string;
};

export type ResOrderAdmin = {
  id: number;
  code: string;

  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: AddressSnapshot;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  subtotal: number | string;
  shippingFee?: number | string | null;
  discount?: number | string | null;
  tax?: number | string | null;
  total: number | string;

  createdAt: string; // ISO Instant
  updatedAt: string; // ISO Instant

  assigneeName?: string | null;
  assigneeId?: number | null;

  items: ResOrderItem[];
};

// ================= Request DTOs =================

export type ReqUpdateOrderStatus = { status: OrderStatus | string };

export type ReqUpdatePayment = {
  paymentStatus: PaymentStatus | string;
  paidAt?: string | null; // ISO Instant
  transactionId?: string | null;
  note?: string | null;
};

export type ReqUpdateShipping = {
  fee?: string | null; // BigDecimal string
  shippingCarrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null; // ISO Instant
};

export type ReqAssignOrder = { assigneeId: number };
export type ReqCreateNote = { note: string };
export type ReqCancelOrder = { reason: string };
export type ReqRefundManual = { amount: string; method: RefundMethod };

// ================= Page type =================

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-based
  sort?: unknown;
  numberOfElements: number;
  first: boolean;
  last: boolean;
};
