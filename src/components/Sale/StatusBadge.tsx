import { motion } from "framer-motion";
import type { OrderStatus, PaymentStatus } from "../../types/sale-order";
import { ORDER_COLOR, PAYMENT_COLOR, TAB_DEF, type TabId } from "./Status";

/* ===== Badges ===== */
export function OrderStatusBadge({ value }: { value: OrderStatus }) {
  const label =
    value === "PENDING"
      ? "Chờ xử lý"
      : value === "CONFIRMED"
        ? "Đã xác nhận"
        : value === "PROCESSING"
          ? "Đang xử lý"
          : value === "SHIPPED"
            ? "Đang giao"
            : value === "DELIVERED"
              ? "Đã giao"
              : value === "COMPLETED"
                ? "Hoàn tất"
                : value === "CANCELED"
                  ? "Đã huỷ"
                  : value === "CANCEL_REQUESTED"
                    ? "Yêu cầu huỷ"
                    : value;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_COLOR[value]}`}
    >
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ value }: { value: PaymentStatus }) {
  const text =
    value === "PAID"
      ? "Đã thanh toán"
      : value === "UNPAID" || value === "PENDING"
        ? "Chưa thanh toán"
        : value === "REFUNDED"
          ? "Đã hoàn tiền"
          : "Lỗi / Huỷ";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLOR[value]}`}
    >
      {text}
    </span>
  );
}

/* ===== Tabs ===== */
export function SaleStatusTabs({
  activeId,
  onSwitch,
}: {
  activeId: TabId;
  onSwitch: (id: TabId) => void;
}) {
  return (
    <div className="rounded-2xl bg-white/70 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {TAB_DEF.map((t) => {
          const active = t.id === activeId;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSwitch(t.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 transition ${
                active
                  ? `${t.color} font-semibold ring-2 ring-black/5`
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
