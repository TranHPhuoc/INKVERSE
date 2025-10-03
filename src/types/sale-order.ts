

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "CANCEL_REQUESTED";

export type PaymentStatus =
  | "PENDING"
  | "UNPAID"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
  | "REFUND_PENDING";

/** Delivery & Payment methods */
export type DeliveryMethod = "STANDARD" | "EXPRESS" | "PICKUP";
export type PaymentMethod = "COD" | "VNPAY" | "MOMO" | "BANK_TRANSFER";

/* =================== Pagination helpers =================== */
export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

/* =================== Response DTOs =================== */
export type ResOrderItem = {
  bookId: number;
  title: string;
  imageUrl: string | null;
  sku: string | null;
  price: string | number;
  discount: string | number;
  qty: number;
  lineTotal: string | number;
};

export type ResOrderDetail = {
  code: string;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  subtotal: string | number;
  discountTotal: string | number;
  shippingFee: string | number;
  taxTotal: string | number;
  grandTotal: string | number;

  receiverName: string | null;
  receiverPhone: string | null;
  receiverEmail: string | null;
  addressLine: string | null;
  wardCode: string | null;
  districtCode: string | null;
  provinceCode: string | null;
  postalCode: string | null;

  createdAt: string; // ISO
  confirmedAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;

  items: ResOrderItem[];
};

export type ResOrderCreated = {
  code: string;
  grandTotal: string | number;
  currency: string; // "VND"
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
};

/* =================== Admin/Listing DTOs =================== */
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
export type ReqCreateOrder = {
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  note?: string | null;
  addressId?: number | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  line1?: string | null;
  line2?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
};

export type ReqUpdateOrderStatus = { status: OrderStatus };
export type ReqUpdatePayment = { paymentStatus: PaymentStatus; paidAt?: string };
export type ReqAssignOrder = { assigneeId: number };
export type ReqCreateNote = { note: string };
export type ReqCancelOrder = { reason: string };

/** strict mode: exactOptionalPropertyTypes=true → dùng `string | undefined` */
export type ReqUpdateShipping = {
  fee?: string | undefined;
  shippingCarrier?: string | undefined;
  trackingCode?: string | undefined;
  shippedAt?: string | undefined;
};

/* ===== Refund (manual) ===== */
export type RefundMethod = "CASH" | "BANK_TRANSFER" | "MOMO" | "OTHER";
export const REFUND_METHODS: ReadonlyArray<RefundMethod> = [
  "CASH",
  "BANK_TRANSFER",
  "MOMO",
  "OTHER",
];
export type ReqRefundManual = { amount: string; method: RefundMethod };
