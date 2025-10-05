/* ====== Status & Enums ====== */
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "CANCEL_REQUESTED";

export type PaymentMethod = "COD" | "VNPAY";

export type PaymentStatus =
  | "PENDING"
  | "UNPAID"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
  | "REFUND_PENDING";

/* ====== Pagination ====== */
export type Page<T> = {
  content: T[];
  number: number; // zero-based
  size: number;
  totalElements: number;
  totalPages: number;
};
export type SpringPage<T> = Page<T>;

/* ====== Shared DTOs ====== */
export type ResOrderItem = {
  bookId: number;
  title: string;
  imageUrl: string | null;
  sku: string | null;
  price: number | string;
  discount: number | string;
  qty: number;
  lineTotal: number | string;
};

export type ShippingAddress = {
  receiverName: string | null;
  receiverPhone: string | null;
  receiverEmail: string | null;
  line1?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  addressLine?: string | null;
};

/** ====== SALE/ADMIN Order DTO  ====== */
export type ResOrderAdmin = {
  id: number;
  code: string;

  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;

  subtotal: number | string;
  shippingFee: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;

  createdAt: string;
  updatedAt?: string | null;

  assigneeId?: number | null;
  assigneeName?: string | null;

  shippingAddress?: ShippingAddress | null;

  receiverName?: string | null;
  receiverPhone?: string | null;
  addressLine?: string | null;

  items: ResOrderItem[];
};

/* ====== Request DTOs ====== */
export type ReqUpdateOrderStatus = { status: OrderStatus };

export type ReqUpdatePayment = {
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string | null;
  paidAt?: string | null; // ISO
  note?: string | null;
};

export type ReqUpdateShipping = {
  shippingCarrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null; // ISO
  deliveredAt?: string | null;
  fee?: string | number | null;
  note?: string | null;
};

export type ReqAssignOrder = { assigneeId: number | null };
export type ReqCreateNote = { note: string };

export type RefundMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "OTHER";
export type ReqCancelOrder = {
  reason: string;
};
export type ReqRefundManual = {
  amount: number;
  method: RefundMethod;
  currency?: string;
  note?: string | null;
};
