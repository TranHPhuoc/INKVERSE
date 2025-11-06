import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import zaloIcon from "../assets/iconsZalo.svg";
import messengerIcon from "../assets/iconsMessenger.svg";
import shareWhite from "../assets/iconparentsocial.png";
import aiAvatar from "../assets/aiagentchat.png";

/* ===== Animations ===== */
const listVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.16, ease: "easeOut", staggerChildren: 0.05, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: 10, scale: 0.96, transition: { duration: 0.12 } },
};
const itemVariants: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };

/* ===== Hook: breakpoint md ===== */
function useIsMdUp(): boolean {
  const [md, setMd] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : true,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const h = (e: MediaQueryListEvent) => setMd(e.matches);
    mq.addEventListener?.("change", h);
    setMd(mq.matches);
    return () => mq.removeEventListener?.("change", h);
  }, []);
  return md;
}

type SocialItem = { id: "zalo" | "messenger" | "phone"; label: string; href: string; icon?: string };
type Props = {
  zaloLink?: string;
  messengerLink?: string;
  phoneNumber?: string;
  right?: number;
  bottom?: number;
};

export default function SocialFloat({
                                      zaloLink = "https://zalo.me/0335863953",
                                      messengerLink = "https://m.me/phuoc.tranhuu.14418101",
                                      phoneNumber = "0335863953",
                                      right = 18,
                                      bottom = 18,
                                    }: Props) {
  const isMd = useIsMdUp();
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

  const openMenu = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    setMenuOpen(true);
  };
  const closeMenuDelay = () => {
    if (closeT.current) window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setMenuOpen(false), 120);
  };

  return (
    <>
      <div
        id="dock-wrapper"
        className={[
          "fixed z-40 flex items-end gap-2 md:gap-3",
          '[html[data-chat-open=true]_&]:hidden',
        ].join(" ")}
        style={{ right, bottom }}
      >
        {/* Cột Share: mobile click, desktop hover */}
        <div
          className="relative flex flex-col items-center cursor-pointer"
          onMouseEnter={isMd ? openMenu : undefined}
          onMouseLeave={isMd ? closeMenuDelay : undefined}
        >
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="social-menu"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="pointer-events-auto absolute left-1/2 mb-1 -translate-x-1/2 bottom-[50px] md:bottom-[56px] flex flex-col items-center gap-2 md:gap-2.5"
              >
                {socials.map((s) => (
                  <motion.a
                    key={s.id}
                    variants={itemVariants}
                    href={s.href}
                    target={s.id !== "phone" ? "_blank" : undefined}
                    rel={s.id !== "phone" ? "noopener noreferrer" : undefined}
                    className="grid h-9 w-9 md:h-11 md:w-11 place-items-center rounded-full bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg"
                    aria-label={s.label}
                  >
                    {s.id === "phone" ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6 text-rose-600" fill="currentColor" aria-hidden>
                        <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 3.5A1 1 0 013 2.5H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z"/>
                      </svg>
                    ) : (
                      <img src={s.icon} alt={s.label} className="h-5 w-5 md:h-6 md:w-6 select-none" draggable={false} />
                    )}
                  </motion.a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nút Share mobile */}
          <button
            id="dock-share-btn"
            onClick={() => (isMd ? setMenuOpen(true) : setMenuOpen((v) => !v))}
            className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-neutral-900 ring-1 ring-white/10 transition-colors hover:bg-neutral-800"
            aria-label="Mạng xã hội"
            title="Mạng xã hội"
          >
            <img
              src={shareWhite}
              alt="share"
              className="h-5 w-5 md:h-6 md:w-6 object-contain select-none"
              draggable={false}
            />
          </button>
        </div>

        {/* Sophia mobile */}
        <button
          id="dock-chat-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
          className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition hover:scale-105"
          aria-label="Mở chat Sophia"
          title="Mở chat Sophia"
        >
          <img
            src={aiAvatar}
            alt="Sophia"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
            draggable={false}
          />
        </button>
      </div>
    </>
  );
}
