import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import zaloIcon from "../assets/iconsZalo.svg";
import messengerIcon from "../assets/iconsMessenger.svg";
import arrowUp from "../assets/arrow-up.svg";
import shareWhite from "../assets/iconparentsocial.png";
import aiAvatar from "../assets/aiagentchat.png";

type SocialItem = { id: "zalo" | "messenger" | "phone"; label: string; href: string; icon?: string };
type Props = {
  zaloLink?: string;
  messengerLink?: string;
  phoneNumber?: string;
  right?: number;
  bottom?: number;
};

const listVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: 14, scale: 0.96, transition: { duration: 0.12 } },
};
const itemVariants: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

export default function SocialFloat({
                                      zaloLink = "https://zalo.me/0335863953",
                                      messengerLink = "https://m.me/phuoc.tranhuu.14418101",
                                      phoneNumber = "0335863953",
                                      right = 24,
                                      bottom = 24,
                                    }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeT = useRef<number | null>(null);

  const socials: SocialItem[] = useMemo(
    () => [
      { id: "zalo", label: "Zalo", href: zaloLink, icon: zaloIcon },
      { id: "messenger", label: "Messenger", href: messengerLink, icon: messengerIcon },
      { id: "phone", label: "Gọi điện", href: `tel:${phoneNumber}` },
    ],
    [zaloLink, messengerLink, phoneNumber],
  );

  // chỉ nút Share mới điều khiển menu (KHÔNG đặt hover trên cả dock)
  const openMenu = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    setMenuOpen(true);
  };
  const closeMenuDelay = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setMenuOpen(false), 120);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Scroll-to-top (trái) */}
      <motion.button
        id="sf-top-btn"
        onClick={scrollTop}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg ring-1 ring-black/5 hover:bg-white"
        aria-label="Lên đầu trang"
      >
        <img src={arrowUp} alt="top" className="h-6 w-6" />
      </motion.button>

      {/* DOCK: Share + Sophia (đặt sát góc phải) */}
      <div id="dock-wrapper" className="fixed z-40 flex items-end gap-3" style={{ right, bottom }}>
        {/* Cột Share: hover ở ĐÂY mới bung menu */}
        <div
          className="relative flex flex-col items-center"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenuDelay}
        >
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="social-menu"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute bottom-[64px] left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-3 pointer-events-auto"
              >
                {socials.map((s) => (
                  <motion.a
                    key={s.id}
                    variants={itemVariants}
                    href={s.href}
                    target={s.id !== "phone" ? "_blank" : undefined}
                    rel={s.id !== "phone" ? "noopener noreferrer" : undefined}
                    className="group flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg"
                    aria-label={s.label}
                  >
                    {s.id === "phone" ? (
                      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-600" fill="currentColor" aria-hidden>
                        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 3.5A1 1 0 013 2.5H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z"/>
                      </svg>
                    ) : (
                      <img src={s.icon} alt={s.label} className="h-9 w-9 select-none" draggable={false} />
                    )}
                  </motion.a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            id="dock-share-btn"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 ring-1 ring-white/10 transition-colors hover:bg-neutral-800"
            aria-label="Mạng xã hội"
            title="Mạng xã hội"
          >
            <img src={shareWhite} alt="share" className="h-7 w-7 object-contain select-none" draggable={false} />
          </button>
        </div>

        {/* Nút Sophia – KHÔNG ảnh hưởng menu, chỉ mở chat */}
        <button
          id="dock-chat-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 hover:scale-105 transition"
          aria-label="Mở chat Sophia"
          title="Mở chat Sophia"
        >
          <img src={aiAvatar} alt="Sophia" className="h-14 w-14 rounded-full object-cover" draggable={false} />
        </button>
      </div>
    </>
  );
}
