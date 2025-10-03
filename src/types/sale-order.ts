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

/** ====== SALE/ADMIN Order DTO  ====== */
export type ResOrderAdmin = {
  id: number;
  code: string;

  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;

  createdAt: string;
  updatedAt?: string | null;

  // phụ trách (nếu có)
  assigneeId?: number | null;
  assigneeName?: string | null;
  shippingAddress?: ShippingAddress | null;

  // người nhận (optional)
  receiverName?: string | null;
  receiverPhone?: string | null;
  addressLine?: string | null;

  items: ResOrderItem[];
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
  carrier?: string | null;
  trackingCode?: string | null;
  shippedAt?: string | null; // ISO
  deliveredAt?: string | null; // ISO
  fee?: string | number | null;
  note?: string | null;
};

export type ReqAssignOrder = { assigneeId: number | null };
export type ReqCreateNote = {
  note: string;
};
export type ReqCancelOrder = { reason: string };
export type ReqRefundManual = { amount?: number; currency?: string; note?: string | null };
