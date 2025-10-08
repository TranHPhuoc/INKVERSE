// src/components/ProductCarousel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { BookListItem } from "../types/books";

/* ───────── constants & helpers ───────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT_PAD = 8;   // px
const COL_GAP = 16;       // px
const ROW_GAP = 16;       // px

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

function useResizeWidth(ref: React.RefObject<HTMLElement | null>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** Biến items -> CỘT theo ROW-MAJOR (trái→phải, hàng 1 trước rồi hàng 2).
 * Bật noUncheckedIndexedAccess nên cần check chỉ số và dùng non-null assertion.
 */
function toRowMajorColumns<T>(arr: T[], rows: number): T[][] {
  const r = Math.max(1, rows);
  const totalCols = Math.ceil(arr.length / r);
  const cols: T[][] = Array.from({ length: totalCols }, () => []);
  for (let c = 0; c < totalCols; c++) {
    for (let row = 0; row < r; row++) {
      const idx = c + row * totalCols;
      if (idx < arr.length) {
        const v = arr[idx]!;       // safe vì đã check idx
        cols[c]!.push(v);          // c luôn < totalCols
      }
    }
  }
  return cols;
}

/* ───────── props ───────── */
type Props = {
  items: BookListItem[];
  /** số hàng/column: 2 cho "Bán chạy", 1 cho Flash sale */
  rows?: number;
  /** số cột hiển thị trong khung */
  cols?: number;
  loading?: boolean;
  className?: string;
  /** lăn chuột để next/prev (desktop) */
  wheelNav?: boolean;
};

/* ───────── component ───────── */
export default function ProductCarousel({
                                          items,
                                          rows = 1,
                                          cols = 6,
                                          loading = false,
                                          className,
                                          wheelNav = true,
                                        }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportW = useResizeWidth(viewportRef);

  // Chiều rộng 1 cột: trừ padding + gap rồi chia đều
  const colW = useMemo(() => {
    if (viewportW <= 0 || cols <= 0) return 0;
    const usable = viewportW - VIEWPORT_PAD * 2 - COL_GAP * (cols - 1);
    return Math.max(0, usable / cols);
  }, [viewportW, cols]);

  // ROW-MAJOR columns
  const columns = useMemo(() => toRowMajorColumns(items ?? [], rows), [items, rows]);

  const totalColumns = columns.length;
  const maxIndex = Math.max(0, totalColumns - cols);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [rows, cols, items?.length]);

  const next = () => setIndex((i) => clamp(i + 1, 0, maxIndex));
  const prev = () => setIndex((i) => clamp(i - 1, 0, maxIndex));

  // Skeleton khi loading
  const renderColumns: (BookListItem | { __sk: true; id: string })[][] =
    loading && items.length === 0
      ? toRowMajorColumns(
        Array.from({ length: rows * cols }).map((_, i) => ({ __sk: true, id: `sk-${i}` })),
        rows
      )
      : (columns as unknown as (BookListItem | { __sk: true; id: string })[][]);

  // Wheel nav: dùng if/else để tránh no-unused-expressions; không phụ thuộc next/prev
  useEffect(() => {
    if (!wheelNav || !viewportRef.current) return;
    const el = viewportRef.current;
    const onWheel = (e: WheelEvent) => {
      if (maxIndex <= 0) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 4) return;
      e.preventDefault();
      setIndex((prev) => clamp(prev + (delta > 0 ? 1 : -1), 0, maxIndex));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel as unknown as EventListener);
    };
  }, [wheelNav, maxIndex]);

  return (
    <div
      className={`relative ${className ?? ""}`}
      aria-roledescription="carousel"
      aria-label="Product carousel (row-major)"
    >
      {/* Viewport */}
      <div ref={viewportRef} className="overflow-hidden">
        <motion.div
          className="flex flex-nowrap"
          animate={{ x: -(index * (colW + COL_GAP)) }}
          transition={{ duration: 0.48, ease: EASE }}
          style={{ paddingLeft: VIEWPORT_PAD, paddingRight: VIEWPORT_PAD, gap: COL_GAP }}
          role="list"
        >
          {renderColumns.map((col, ci) => (
            <div
              key={`col-${ci}`}
              className="flex-none"
              style={{ width: colW }}
              role="listitem"
              aria-roledescription="column"
            >
              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {col.map((it, ri) =>
                  "__sk" in it ? (
                    <div key={it.id} className="h-64 w-full rounded-xl bg-gray-100" />
                  ) : (
                    <ProductCard
                      key={(it as BookListItem).id ?? `i-${ci}-${ri}`}
                      item={it as BookListItem}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={prev}
        disabled={index <= 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        disabled={index >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem tiếp"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
