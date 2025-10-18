import type { OrderStatus, PaymentStatus } from "./sale-order";

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

export const viPaymentLabel: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  CANCELED: "Đã huỷ",
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
  ALL: "Mọi lứa tuổi",
  _6PLUS: "6 tuổi trở lên",
  _12PLUS: "12 tuổi trở lên",
  _16PLUS: "16 tuổi trở lên",
  _18PLUS: "18 tuổi trở lên",
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
