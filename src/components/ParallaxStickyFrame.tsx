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

  const [frameH, setFrameH] = useState(300);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameH(el.clientHeight || 300));
    ro.observe(el);
    setFrameH(el.clientHeight || 300);
    return () => ro.disconnect();
  }, []);

  const overscan = Math.round(frameH * 0.8);
  const y = useTransform(scrollYProgress, [0, 1], [-overscan, overscan]);

  // KHUNG 1860×300
  const W = 1860, H = 300;
  const frameStyle: React.CSSProperties = {
    width: `min(${W}px, 100vw)`,
    height: `min(${H}px, calc(100vw * ${H / W}))`,
  };

  const scrollWindow = Math.max(160, Math.min(240, Math.round(frameH * 0.7)));
  const sectionStyle: React.CSSProperties = { height: frameH + scrollWindow };

  return (
    <section ref={sectionRef} style={sectionStyle} className="relative flex items-center justify-center">
      <div className="sticky top-0 flex h-screen items-center justify-center">
        <div ref={frameRef} className="relative overflow-hidden" style={frameStyle}>
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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 mix-blend-multiply" />
        </div>
      </div>
    </section>
  );
};

export default ParallaxStickyFrame;
