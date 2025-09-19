import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const loc = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className="min-h-[60vh]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
