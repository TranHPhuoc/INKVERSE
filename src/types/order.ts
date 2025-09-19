// ================= Enums (match BE) =================
export type DeliveryMethod = "STANDARD" | "EXPRESS" | "PICKUP";
export type PaymentMethod = "COD" | "VNPAY" | "MOMO" | "BANK";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "REFUNDED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELED"
  | "CANCEL_REQUESTED";

// ================= Request DTOs =================
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

// ================= Response DTOs =================
export type ResOrderCreated = {
  code: string;
  grandTotal: string | number;
  currency: string; // "VND"
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
};

export type ResOrderItem = {
  bookId: number;
  title: string;
  imageUrl: string | null;
  sku: string | null;
  price: string | number; // priceSnapshot
  discount: string | number; // discountSnapshot
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

// ================= Pagination =================
export type SpringPage<T> = {
  content: T[];
  number: number; // current page idx
  size: number; // page size
  totalElements: number;
  totalPages: number;
};
