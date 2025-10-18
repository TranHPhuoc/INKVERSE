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

  const clamp = (i: number) => (sorted.length ? Math.max(0, Math.min(i, sorted.length - 1)) : 0);
  const [active, setActive] = useState(() => clamp(initialIndex));
  useEffect(() => {
    setActive(clamp(initialIndex));
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

  const mainWrapRef = useRef<HTMLDivElement | null>(null);

  /** ===== Zoom state ===== */
  const [hovering, setHovering] = useState(false);
  const [posPct, setPosPct] = useState({ x: 50, y: 50 }); 
  const ZOOM = 200;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    setPosPct({
      x: Math.max(0, Math.min(100, relX)),
      y: Math.max(0, Math.min(100, relY)),
    });
  }

  function go(delta: number) {
    if (!sorted.length) return;
    setActive((i) => (i + delta + sorted.length) % sorted.length);
  }

  function focusThumbIntoView(i: number) {
    const wrap = thumbScrollRef.current;
    if (!wrap) return;
    const btn = wrap.querySelector<HTMLButtonElement>(`[data-idx="${i}"]`);
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
  }
  useEffect(() => {
    focusThumbIntoView(active);
  }, [active]);

  const thumbScrollRef = useRef<HTMLDivElement | null>(null);

  if (!sorted.length) {
    return (
      <div className={className}>
        <div className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      {/* ===== Main image + zoom trigger ===== */}
      <div
        ref={mainWrapRef}
        className="group relative overflow-hidden rounded-xl border bg-gray-50"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
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

        {/* arrows */}
        {sorted.length > 1 && (
          <>
            <button
              aria-label="Ảnh trước"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Ảnh sau"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* ===== Zoom pane ===== */}
      <AnimatePresence>
        {hovering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute top-0 left-full ml-5 md:block z-[200]"
          >
            <div
              className="h-[400px] w-[400px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
              style={{
                backgroundImage: `url("${pickBest(current)}")`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${ZOOM}%`,
                backgroundPosition: `${posPct.x}% ${posPct.y}%`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Thumbnails row ===== */}
      {sorted.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <div
            ref={thumbScrollRef}
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
                  className={`relative h-28 w-20 flex-shrink-0 overflow-hidden rounded border ${activeCls}`}
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
