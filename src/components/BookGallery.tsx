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

export default function BookGallery({ images, className, onIndexChange }: Props) {
  const sorted = useMemo(
    () =>
      (images ?? [])
        .filter(Boolean)
        .sort((a: any, b: any) => (a?.sortOrder ?? 999) - (b?.sortOrder ?? 999)),
    [images],
  );

  const [active, setActive] = useState(0);
  const mainRef = useRef<HTMLImageElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const current = sorted[active];

  useEffect(() => {
    onIndexChange?.(active);
  }, [active, onIndexChange]);

  useEffect(() => {
    // preload ảnh đầu tiên cho mượt
    if (sorted[0]?.url) {
      const pre = new Image();
      pre.src = pickBest(sorted[0]);
    }
  }, [sorted]);

  function pickBest(img?: GalleryImage) {
    const src = img?.variants?.xlarge || img?.variants?.large || img?.url || PLACEHOLDER;
    return resolveThumb(src);
  }

  function pickThumb(img?: GalleryImage) {
    const t = img?.variants?.thumb || img?.variants?.medium || img?.url || PLACEHOLDER;
    return resolveThumb(t);
  }

  function go(delta: number) {
    if (!sorted.length) return;
    setActive((i) => (i + delta + sorted.length) % sorted.length);
  }

  function focusThumbIntoView(i: number) {
    const wrap = scrollRef.current;
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

  if (!sorted.length) {
    return (
      <div className={className}>
        <div className="aspect-[3/4] w-full rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main image */}
      <div
        className="relative overflow-hidden rounded-xl border bg-gray-50"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={(current?.id ?? current?.url) + "-main"}
            ref={mainRef}
            src={pickBest(current)}
            alt="book image"
            className="main-image block aspect-[3/4] h-auto w-full rounded-xl object-cover"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
        </AnimatePresence>

        {/* arrows */}
        {sorted.length > 1 && (
          <>
            <button
              aria-label="Ảnh trước"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              aria-label="Ảnh sau"
              onClick={() => go(1)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/70 px-2 py-2 shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row */}
      {sorted.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <div
            ref={scrollRef}
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
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
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
