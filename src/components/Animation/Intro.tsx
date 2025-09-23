import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SplitText from "./SplitText";

const INTRO_KEY = "inkverse_intro_seen_v2";

export default function Intro({
  title = "Chào mừng bạn đến với INKVERSE",
  ctaLabel = "Khám phá ngay",
  to = "/",
  onlyOnce = false,
}: {
  title?: string;
  ctaLabel?: string;
  to?: string;
  onlyOnce?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!onlyOnce) return;
    if (localStorage.getItem(INTRO_KEY) === "1") setOpen(false);
  }, [onlyOnce]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    if (onlyOnce) localStorage.setItem(INTRO_KEY, "1");
    setOpen(false);
    if (loc.pathname !== to) nav(to);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" aria-hidden />

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center px-6 text-center"
          >
            <SplitText
              text={title}
              tag="h2"
              className="text-3xl font-extrabold text-white drop-shadow-xl sm:text-5xl md:text-6xl"
              splitType="chars"
              delay={40}
              duration={0.6}
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
            />

            <motion.button
              onClick={close}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 cursor-pointer rounded-full bg-emerald-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:bg-emerald-700 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] focus:ring-4 focus:ring-emerald-300/40 focus:outline-none"
            >
              {ctaLabel}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
