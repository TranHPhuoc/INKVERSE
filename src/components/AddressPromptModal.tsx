import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, User, Phone } from "lucide-react";

type Props = {
  open: boolean;
  onProceed: () => void;
  onClose: () => void;
};

export default function AddressPromptModal({ open, onProceed, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const titleId = "address-prompt-title";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed inset-0 z-[9999] grid place-items-center px-4"
            onClick={onClose}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative border-b bg-gradient-to-r from-rose-50 to-white px-5 py-4">
                <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                  Thêm địa chỉ nhận hàng
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-3 right-3 cursor-pointer rounded-lg p-2 hover:bg-gray-100 focus:outline-none"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-3 px-5 py-4">
                <p className="text-sm text-gray-600">
                  Để tiếp tục thanh toán, vui lòng bổ sung thông tin nhận hàng của bạn.
                </p>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 rounded-xl border p-3">
                    <User className="h-4 w-4 text-rose-600" />
                    <span>Họ tên</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border p-3">
                    <Phone className="h-4 w-4 text-rose-600" />
                    <span>Số điện thoại</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border p-3">
                    <MapPin className="h-4 w-4 text-rose-600" />
                    <span>Địa chỉ</span>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Bạn chỉ cần nhập <b>một lần</b>. Lần sau hệ thống sẽ tự động ghi nhớ cho tài khoản
                  này.
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t bg-white px-5 py-4">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="h-10 cursor-pointer rounded-xl border px-4 hover:bg-gray-50"
                >
                  Để sau
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={onProceed}
                  className="h-10 cursor-pointer rounded-xl bg-rose-600 px-4 text-white shadow-sm hover:bg-rose-500"
                >
                  Điền địa chỉ ngay
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
