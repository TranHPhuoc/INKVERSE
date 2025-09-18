import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
    open: boolean;
    text?: string;
    onClose?: () => void;
    duration?: number; // ms
};

export default function CartToast({ open, text = "Đã thêm vào giỏ hàng!", onClose, duration = 1400 }: Props) {
    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => onClose?.(), duration);
        return () => clearTimeout(t);
    }, [open, duration, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[1000] grid place-items-center pointer-events-none">
                    {/* backdrop nhẹ */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/10"
                    />
                    {/* card */}
                    <motion.div
                        initial={{ y: 10, opacity: 0, scale: .98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: .98 }}
                        transition={{ type: "spring", stiffness: 420, damping: 30, mass: .6 }}
                        className="pointer-events-auto mx-4 rounded-2xl bg-neutral-800 text-white px-6 py-5 shadow-2xl ring-1 ring-white/10 flex items-center gap-3"
                    >
                        {/* icon tick */}
                        <div className="grid place-items-center w-10 h-10 rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400">
                                <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
                            </svg>
                        </div>
                        <div className="text-base font-medium">{text}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
