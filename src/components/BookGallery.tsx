import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PLACEHOLDER, resolveThumb } from "../types/img";

export type GalleryImage = {
  id?: number;
  url: string;
  sortOrder?: number;
  variants?: {
    thumb?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  };
};

type Props = {
  images: GalleryImage[] | null | undefined;
  initialIndex?: number;
  className?: string;
  onIndexChange?: (index: number) => void;
};

/* ===== Helpers ===== */
function pickBest(img?: GalleryImage) {
  const src = img?.variants?.xlarge || img?.variants?.large || img?.url || PLACEHOLDER;
  return resolveThumb(src);
}
function pickThumb(img?: GalleryImage) {
  const t = img?.variants?.thumb || img?.variants?.medium || img?.url || PLACEHOLDER;
  return resolveThumb(t);
}

export default function BookGallery({ images, initialIndex = 0, className, onIndexChange }: Props) {
  const sorted = useMemo<GalleryImage[]>(
    () =>
      (images ?? [])
        .filter((img): img is GalleryImage => Boolean(img))
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [images],
  );

  const clampIndex = (i: number) => (sorted.length ? Math.max(0, Math.min(i, sorted.length - 1)) : 0);
  const [active, setActive] = useState(() => clampIndex(initialIndex));

  useEffect(() => {
    setActive(clampIndex(initialIndex));
  }, [sorted.length, initialIndex]);

  const current: GalleryImage | undefined = sorted[active];

  useEffect(() => {
    onIndexChange?.(active);
  }, [active, onIndexChange]);

  useEffect(() => {
    if (sorted[0]?.url) {
      const pre = new Image();
      pre.src = pickBest(sorted[0]);
    }
  }, [sorted]);

  /* ===== Zoom config/state ===== */
  const PANE = 420;
  const LENS = 160;
  const HALF = LENS / 2;

  const [hovering, setHovering] = useState(false);
  const [overControls, setOverControls] = useState(false);

  const [posImgPx, setPosImgPx] = useState({ x: HALF, y: HALF });

  const [lensLT, setLensLT] = useState({ l: 0, t: 0 });

  const [imgBox, setImgBox] = useState({ w: 0, h: 0 });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapperRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return;

    const wrapRect = wrap.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const cx = Math.max(imgRect.left + HALF, Math.min(imgRect.right - HALF, e.clientX));
    const cy = Math.max(imgRect.top + HALF, Math.min(imgRect.bottom - HALF, e.clientY));

    const relX = cx - imgRect.left;
    const relY = cy - imgRect.top;

    setPosImgPx({ x: relX, y: relY });
    if (imgBox.w !== imgRect.width || imgBox.h !== imgRect.height) {
      setImgBox({ w: imgRect.width, h: imgRect.height });
    }

    setLensLT({
      l: (imgRect.left - wrapRect.left) + relX - HALF,
      t: (imgRect.top - wrapRect.top) + relY - HALF,
    });
  }

  function go(delta: number) {
    if (!sorted.length) return;
    setActive((i) => (i + delta + sorted.length) % sorted.length);
  }

  useEffect(() => {
    const wrap = thumbsRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLButtonElement>(`[data-idx="${active}"]`);
    if (!btn) return;
    const { offsetLeft, offsetWidth } = btn;
    const { scrollLeft, clientWidth } = wrap;
    const visibleStart = scrollLeft;
    const visibleEnd = scrollLeft + clientWidth;
    const btnStart = offsetLeft;
    const btnEnd = offsetLeft + offsetWidth;
    if (btnStart < visibleStart) {
      wrap.scrollTo({ left: btnStart - 8, behavior: "smooth" });
    } else if (btnEnd > visibleEnd) {
      wrap.scrollTo({ left: btnEnd - clientWidth + 8, behavior: "smooth" });
    }
  }, [active]);

  if (!sorted.length) {
    return (
      <div className={className}>
        <div className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      <div
        ref={wrapperRef}
        className="group relative cursor-default overflow-visible rounded-xl border border-gray-100 bg-gray-50"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
            ref={imgRef}
            key={(current?.id ?? current?.url) + "-main"}
            src={pickBest(current)}
            alt="book image"
            className="main-image block aspect-[3/4] h-auto w-full rounded-xl object-cover"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER;
            }}
          />
        </AnimatePresence>

        {/* Lens */}
        {hovering && !overControls && (
          <div
            className="pointer-events-none absolute rounded-md border border-white/70 bg-white/30 shadow-inner backdrop-blur-sm"
            style={{
              width: LENS,
              height: LENS,
              left: lensLT.l,
              top: lensLT.t,
            }}
          />
        )}

        {/* arrows */}
        {sorted.length > 1 && (
          <>
            <button
              aria-label="Ảnh trước"
              onClick={() => go(-1)}
              onMouseEnter={() => setOverControls(true)}
              onMouseLeave={() => setOverControls(false)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Ảnh sau"
              onClick={() => go(1)}
              onMouseEnter={() => setOverControls(true)}
              onMouseLeave={() => setOverControls(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Zoom pane */}
      <AnimatePresence>
        {hovering && !overControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute top-0 left-full z-[300] ml-5 hidden md:block"
          >
            {(() => {
              const scale = PANE / LENS || 1;
              const bgW = imgBox.w * scale;
              const bgH = imgBox.h * scale;

              const lensLeftInImg = posImgPx.x - LENS / 2;
              const lensTopInImg  = posImgPx.y - LENS / 2;

              const bgPosX = -(lensLeftInImg * scale);
              const bgPosY = -(lensTopInImg  * scale);

              return (
                <div
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                  style={{
                    width: PANE,
                    height: PANE,
                    backgroundImage: `url("${pickBest(current)}")`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${bgW}px ${bgH}px`,
                    backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                  }}
                />
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <div
            ref={thumbsRef}
            className="no-scrollbar flex gap-2 overflow-x-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            {sorted.map((img, i) => {
              const activeCls = i === active ? "ring-2 ring-rose-500" : "hover:shadow";
              return (
                <button
                  key={(img.id ?? img.url) + "-thumb"}
                  data-idx={i}
                  onClick={() => setActive(i)}
                  aria-label={`Ảnh ${i + 1}`}
                  className={`relative h-24 w-20 flex-shrink-0 overflow-hidden rounded border ${activeCls}`}
                >
                  <img
                    src={pickThumb(img)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
