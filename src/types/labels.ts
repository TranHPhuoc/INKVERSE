// src/components/sale/statusLabels.ts
import type { OrderStatus, PaymentStatus } from "../types/sale-order";

/** Nhãn tiếng Việt cho OrderStatus */
export const viStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn tất",
  CANCELED: "Đã huỷ",
  CANCEL_REQUESTED: "Yêu cầu huỷ",
};

/** Nhãn tiếng Việt cho PaymentStatus */
export const viPaymentLabel: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

export const LANGUAGE_VI: Record<string, string> = {
  VI: "Tiếng Việt",
  EN: "Tiếng Anh",
  JA: "Tiếng Nhật",
  KO: "Tiếng Hàn",
  ZH: "Tiếng Trung",
  FR: "Tiếng Pháp",
  DE: "Tiếng Đức",
  RU: "Tiếng Nga",
  ES: "Tiếng Tây Ban Nha",
};

export const AGE_VI: Record<string, string> = {
  ALL: "Tất Cả",
  KID: "Thiếu Nhi",
  TEEN: "Thiếu Niên",
  ADULT: "Người Lớn",
};

export const COVER_VI: Record<string, string> = {
  PAPERBACK: "Bìa Mềm",
  HARDCOVER: "Bìa Cứng",
};

export function langVi(code?: string | null) {
  if (!code) return "không rõ";
  return LANGUAGE_VI[code.toUpperCase()] ?? code.toLowerCase();
}
export function ageVi(code?: string | null) {
  if (!code) return "không rõ";
  return AGE_VI[code.toUpperCase()] ?? code.toLowerCase();
}
export function coverVi(code?: string | null) {
  if (!code) return "không rõ";
  return COVER_VI[code.toUpperCase()] ?? code.toLowerCase();
}
