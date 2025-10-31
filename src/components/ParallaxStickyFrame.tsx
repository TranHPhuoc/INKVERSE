// src/components/ParallaxStickyFrame.tsx
import React, { useRef, useLayoutEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import inkverseBanner from "../assets/INKVERSEbanner.png";

const ParallaxStickyFrame: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // đo chiều cao khung để tính overscan px
  const [frameH, setFrameH] = useState(300);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameH(el.clientHeight || 300));
    ro.observe(el);
    setFrameH(el.clientHeight || 300);
    return () => ro.disconnect();
  }, []);

  // overscan ~60% chiều cao khung (an toàn, không lộ mép)
  const overscan = Math.round(frameH * 0.6); // ví dụ: khung 300px → overscan 180px
  // y trượt theo PX, không dùng %
  const y = useTransform(scrollYProgress, [0, 1], [-overscan, overscan]);

  // khung 1860x300, tự co đúng tỉ lệ khi màn nhỏ
  const W = 1860, H = 300;
  const frameStyle: React.CSSProperties = {
    width: `min(${W}px, 100vw)`,
    height: `min(${H}px, calc(100vw * ${H / W}))`,
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[120vh] md:h-[130vh] lg:h-[140vh] flex items-center justify-center"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center">
        <div ref={frameRef} className="relative overflow-hidden" style={frameStyle}>
          {/* Ảnh: cao hơn khung 2*overscan, đặt top = -overscan, trượt trong [-overscan, +overscan] */}
          <motion.img
            src={inkverseBanner}
            alt="INKVERSE banner"
            style={{
              y,
              top: -overscan,
              height: `calc(100% + ${overscan * 2}px)`,
            }}
            className="absolute left-0 right-0 w-full object-cover will-change-transform"
            draggable={false}
          />

          {/* Vignette rất nhẹ; không thích thì xóa dòng dưới */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 mix-blend-multiply" />
        </div>
      </div>
    </section>
  );
};

export default ParallaxStickyFrame;
