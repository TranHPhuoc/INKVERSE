// ===== Constants & Types =====

// Order status
export const ORDER_STATUS = {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    PROCESSING: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELED: "CANCELED",
} as const;
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Payment status
export const PAYMENT_STATUS = {
    UNPAID: "UNPAID",
    PAID: "PAID",
    REFUND_PENDING: "REFUND_PENDING",
    REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Refund method
export const REFUND_METHOD = {
    CASH: "CASH",
    BANK_TRANSFER: "BANK_TRANSFER",
    GATEWAY: "GATEWAY",
} as const;
export type RefundMethod = typeof REFUND_METHOD[keyof typeof REFUND_METHOD];

// ===== Models =====

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
    bookTitle: string;
    price: string;     // BigDecimal -> string
    qty: number;
    subtotal: string;  // BigDecimal -> string
};

export type ResOrderAdmin = {
    id: number;
    code: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: AddressSnapshot;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    subtotal: string;
    shippingFee?: string | null;
    discount?: string | null;
    tax?: string | null;
    total: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
    assigneeName?: string | null;
    assigneeId?: number | null;
    items: ResOrderItem[];
};

// ===== Request DTOs =====

export type ReqUpdateOrderStatus = {
    status: OrderStatus | string;
};

export type ReqUpdatePayment = {
    paymentStatus: PaymentStatus | string;
    paidAt?: string | null;        // ISO Instant
    transactionId?: string | null;
    note?: string | null;
};

export type ReqUpdateShipping = {
    fee?: string | null;           // BigDecimal string
    shippingCarrier?: string | null;
    trackingCode?: string | null;
    shippedAt?: string | null;     // ISO Instant
};

export type ReqAssignOrder = { assigneeId: number };
export type ReqCreateNote = { note: string };
export type ReqCancelOrder = { reason: string };
export type ReqRefundManual = { amount: string; method: RefundMethod };
