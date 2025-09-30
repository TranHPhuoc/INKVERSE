import React from "react";
import { motion, type Variants, type Transition } from "framer-motion";
import zaloIcon from "../assets/iconsZalo.svg";
import messengerIcon from "../assets/iconsMessenger.svg";
import arrowup from "../assets/arrow-up.svg";

type SocialFloatProps = {
  zaloLink?: string;
  phoneNumber?: string;
  messengerLink?: string;
  className?: string;
};

const containerVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const springItem: Transition = { type: "spring", stiffness: 300, damping: 24 };

export default function SocialFloat({
  zaloLink = "https://zalo.me/0335863953",
  phoneNumber = "0335863953",
  messengerLink = "https://www.facebook.com/phuoc.tranhuu.14418101",
  className = "",
}: SocialFloatProps) {
  const handleScrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const buttonBase =
    "w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-sm font-medium ring-1 ring-white/20";

  return (
    <motion.div
      className={`fixed right-4 bottom-6 z-50 flex flex-col items-center gap-3 md:right-6 ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
    >
      {/* Zalo */}
      <motion.a
        variants={itemVariants}
        transition={springItem}
        href={zaloLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on Zalo"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className={`${buttonBase} bg-transparent shadow-none ring-0`}
      >
        <img src={zaloIcon} alt="Zalo" className="h-15 w-15" />
      </motion.a>

      {/* Phone */}
      <motion.a
        variants={itemVariants}
        transition={springItem}
        href={`tel:${phoneNumber}`}
        aria-label="Call phone"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className={`${buttonBase} bg-gradient-to-br from-rose-500 to-red-500 text-white`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 3.5A1 1 0 013 2.5H6.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z"
            fill="white"
          />
        </svg>
      </motion.a>

      {/* Messenger */}
      <motion.a
        variants={itemVariants}
        transition={springItem}
        href={messengerLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Messenger"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className={`${buttonBase} bg-transparent shadow-none ring-0`}
      >
        <img src={messengerIcon} alt="Messenger" className="h-15 w-15" />
      </motion.a>

      {/* Scroll to top */}
      <motion.button
        variants={itemVariants}
        transition={springItem}
        onClick={handleScrollTop}
        aria-label="Scroll to top"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className={`${buttonBase} cursor-pointer bg-white text-red-600`}
      >
        <img src={arrowup} alt="Lên đầu trang" className="h-8 w-8" />
      </motion.button>
    </motion.div>
  );
}
