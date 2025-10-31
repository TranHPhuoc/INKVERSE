import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import inkverseBanner from "../assets/INKVERSEbanner.png";

const ParallaxStickyFrame: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Biên độ trượt
  const y = useTransform(scrollYProgress, [0, 1], ["-60%", "60%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1.12]);

  const W = 1860;
  const H = 300;
  const frameStyle: React.CSSProperties = {
    width: `min(${W}px, 100vw)`,
    height: `min(${H}px, calc(100vw * ${H / W}))`,
  };

  return (
    <section ref={ref} className="relative flex h-[240vh] items-center justify-center">
      <div className="sticky top-0 flex h-screen items-center justify-center">
        <div className="relative overflow-hidden" style={frameStyle}>
          <motion.img
            src={inkverseBanner}
            alt="INKVERSE banner"
            style={{ y, scale }}
            className="absolute inset-0 top-[-25%] h-[150%] w-full object-cover will-change-transform"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/15 mix-blend-multiply" />

          <img
            src={inkverseBanner}
            alt=""
            className="h-full w-full object-cover opacity-0"
            draggable={false}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
};

export default ParallaxStickyFrame;
