// src/components/ProductDescription.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = { description?: string | null };

function extractText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

export default function ProductDescription({ description }: Props) {
  const html = useMemo(() => (description ?? "").trim(), [description]);
  const plain = useMemo(() => extractText(html), [html]);

  const ref = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [contentHeight, setContentHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setContentHeight(el.scrollHeight || 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("load", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", update);
    };
  }, [html]);

  const TOO_SHORT_CHAR = 100;
  const LONG_HEIGHT_PX = 220;
  const LONG_CHAR_FALLBACK = 400;

  const canCollapse =
    plain.length >= TOO_SHORT_CHAR &&
    (contentHeight > LONG_HEIGHT_PX || plain.length > LONG_CHAR_FALLBACK);

  const collapsedH = Math.max(200, Math.floor(contentHeight / 2));
  const showGradient = canCollapse && !expanded;

  function toggleExpand() {
    setExpanded((prev) => {
      const next = !prev;

      const rect = wrapRef.current?.getBoundingClientRect();
      const targetY = rect ? rect.top + window.scrollY - 120 : window.scrollY - 120;

      window.scrollTo({
        top: next ? targetY - 100 : targetY,
        behavior: "smooth",
      });
      return next;
    });
  }

  return (
    <motion.div
      ref={wrapRef}
      layout
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 rounded-2xl border border-gray-100 bg-white/70 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur"
    >
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Mô tả sản phẩm</h2>

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={expanded || !canCollapse ? "full" : "half"}
            layout
            animate={{
              height: expanded || !canCollapse ? contentHeight || "auto" : collapsedH,
            }}
            initial={false}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-none"
            style={{ willChange: "height" }}
          >
            <div
              ref={ref}
              className="prose prose-rose prose-p:leading-relaxed max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </motion.div>
        </AnimatePresence>

        {showGradient && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-white/0" />
        )}
      </div>

      {canCollapse && (
        <div className="mt-3 text-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={toggleExpand}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
          >
            {expanded ? (
              <>
                Rút gọn
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                </svg>
              </>
            ) : (
              <>
                Xem thêm
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
