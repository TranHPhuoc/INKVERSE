import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, User, Phone } from "lucide-react";

type Props = {
    open: boolean;
    onProceed: () => void;   // Đi tới trang thêm địa chỉ
    onClose: () => void;     // Đóng modal
};

export default function AddressPromptModal({ open, onProceed, onClose }: Props) {
    // Khoá scroll khi mở modal
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Đóng bằng phím Esc
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
                            className="w-full max-w-lg rounded-2xl bg-white shadow-xl border overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="relative px-5 py-4 border-b bg-gradient-to-r from-rose-50 to-white">
                                <h3 id={titleId} className="text-lg font-semibold text-gray-900">
                                    Thêm địa chỉ nhận hàng
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none cursor-pointer"
                                    aria-label="Đóng"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-4 space-y-3">
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

                                <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-800">
                                    Bạn chỉ cần nhập <b>một lần</b>. Lần sau hệ thống sẽ tự động ghi nhớ cho tài khoản này.
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 flex items-center justify-end gap-2 border-t bg-white">
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="h-10 px-4 rounded-xl border hover:bg-gray-50 cursor-pointer"
                                >
                                    Để sau
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onProceed}
                                    className="h-10 px-4 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-sm cursor-pointer"
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
