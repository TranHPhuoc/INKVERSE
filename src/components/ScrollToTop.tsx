// src/components/ScrollToTop.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  // 1) Auto scroll lên đầu khi đổi route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  // 2) Hiện nút khi đã cuộn xuống 200px
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Giữ transition khi đổi route (nếu bạn cần) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Nút Scroll-to-top */}
      <AnimatePresence>
        {show && (
          <motion.button
            key="scroll-top"
            onClick={goTop}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            aria-label="Lên đầu trang"
            title="Lên đầu trang"
            className={[
              "fixed left-2 bottom-2 z-40 grid place-items-center",
              "h-8 w-8 md:h-10 md:w-10",
              "rounded-full bg-white/90 text-neutral-700 shadow-lg ring-1 ring-black/5",
              "backdrop-blur hover:bg-white transition",
              "[html[data-chat-open=true]_&]:hidden"
            ].join(" ")}
          >
            <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
