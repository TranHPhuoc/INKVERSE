import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export default function LoginPromptModal({
  open,
  onClose,
  title = "Bạn cần đăng nhập",
  message = "Hãy đăng nhập để sử dụng tính năng yêu thích.",
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onClick, true);
    return () => document.removeEventListener("mousedown", onClick, true);
  }, [open, onClose]);

  const goLogin = () => {
    const from = location.pathname + location.search + location.hash;
    try {
      localStorage.setItem("postLoginRedirect", from);
    } catch {
      /**/
    }
    navigate("/dang-nhap", { state: { from } });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative mx-4 w-full max-w-lg rounded-3xl border border-white/60 bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5 backdrop-blur"
          >
            <div className="flex items-start gap-4">
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="currentColor"
                    d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"
                  />
                </svg>
              </motion.span>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-600">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <motion.button
                type="button"
                onClick={onClose}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="h-11 cursor-pointer rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition-all hover:shadow-md"
              >
                Để sau
              </motion.button>
              <motion.button
                type="button"
                onClick={goLogin}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="h-11 cursor-pointer rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-105"
              >
                Đăng nhập
              </motion.button>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-black/5" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
