// src/components/SocialFloat.tsx
import React, { useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import zaloIcon from "../assets/iconsZalo.svg";
import messengerIcon from "../assets/iconsMessenger.svg";
import arrowUp from "../assets/arrow-up.svg";
import shareWhite from "../assets/iconparentsocial.png";

/* ====== Types ====== */
type SocialItem = {
  id: "zalo" | "messenger" | "phone";
  label: string;
  href: string;
  icon?: string;
};

type Props = {
  zaloLink?: string;
  messengerLink?: string;
  phoneNumber?: string;
  right?: number;
  bottom?: number;
};

/* ====== Animation variants ====== */
const listVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04, duration: 0.18 },
  },
  exit: { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.92 },
};

/* ====== Component ====== */
export default function SocialFloat({
  zaloLink = "https://zalo.me/0335863953",
  messengerLink = "https://m.me/phuoc.tranhuu.14418101",
  phoneNumber = "0335863953",
  right = 24,
  bottom = 24,
}: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const socials: SocialItem[] = [
    { id: "zalo", label: "Zalo", href: zaloLink, icon: zaloIcon },
    { id: "messenger", label: "Messenger", href: messengerLink, icon: messengerIcon },
    { id: "phone", label: "Gọi điện", href: `tel:${phoneNumber}` },
  ];

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpen(true);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Scroll-to-top */}
      <motion.button
        onClick={scrollTop}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg ring-1 ring-black/5 hover:bg-white"
        aria-label="Lên đầu trang"
      >
        <img src={arrowUp} alt="Lên đầu trang" className="h-6 w-6" />
      </motion.button>

      {/* Social */}
      <div
        className="fixed z-50 flex flex-col items-center"
        style={{ right, bottom }}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {/* Icon  */}
        <AnimatePresence>
          {open && (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-2 flex flex-col items-center gap-4"
            >
              {socials.map((s) => (
                <motion.a
                  key={s.id}
                  variants={itemVariants}
                  href={s.href}
                  target={s.id !== "phone" ? "_blank" : undefined}
                  rel={s.id !== "phone" ? "noopener noreferrer" : undefined}
                  whileHover={{ scale: 1.08 }}
                  className="group relative flex h-12 w-12 cursor-pointer items-center justify-center"
                  aria-label={s.label}
                >
                  {s.id === "phone" ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-10 w-10 text-rose-600"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 3.5A1 1 0 013 2.5H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
                    </svg>
                  ) : (
                    <img
                      src={s.icon}
                      alt={s.label}
                      className="h-10 w-10 select-none"
                      draggable={false}
                    />
                  )}
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-neutral-900 ring-1 ring-white/10 transition-colors hover:bg-neutral-800"
          aria-label="Mở mạng xã hội"
          title="Mở mạng xã hội"
        >
          <img
            src={shareWhite}
            alt="Share"
            className="h-7 w-7 object-contain select-none"
            draggable={false}
          />
        </button>
      </div>
    </>
  );
}
