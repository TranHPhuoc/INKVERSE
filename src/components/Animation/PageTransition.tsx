import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ease: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.div>
  );
}
