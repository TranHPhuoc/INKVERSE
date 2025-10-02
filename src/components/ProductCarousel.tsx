import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { BookListItem } from "../types/books";

/* ───────── helpers ───────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function useResizeWidth(ref: React.RefObject<HTMLElement | null>): number {
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

function chunkToColumns<T>(arr: T[], rows: number): T[][] {
  const out: T[][] = [];
  const r = Math.max(1, rows);
  for (let i = 0; i < arr.length; i += r) out.push(arr.slice(i, i + r));
  return out;
}

/* ───────── types ───────── */
type ProductCarouselProps = {
  items: BookListItem[];
  rows?: number;
  cols?: number;
  loading?: boolean;
  className?: string;
};

/* ───────── component ───────── */
export default function ProductCarousel({
  items,
  rows = 1,
  cols = 6,
  loading = false,
  className,
}: ProductCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportW = useResizeWidth(viewportRef);

  const colW = viewportW > 0 ? viewportW / cols : 0;

  // convert items -> columns (mỗi column chứa tối đa `rows` item)
  const columns = useMemo(() => chunkToColumns(items ?? [], rows), [items, rows]);

  const totalColumns = columns.length;
  const maxIndex = Math.max(0, totalColumns - cols);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [rows, cols, items?.length]);

  const next = () => setIndex((i) => clamp(i + 1, 0, maxIndex));
  const prev = () => setIndex((i) => clamp(i - 1, 0, maxIndex));

  // skeleton khi loading chưa có data
  const renderColumns: (BookListItem | { __sk: true; id: string })[][] =
    loading && items.length === 0
      ? chunkToColumns(
          Array.from({ length: rows * cols }).map((_, i) => ({ __sk: true, id: `sk-${i}` })),
          rows,
        )
      : (columns as unknown as (BookListItem | { __sk: true; id: string })[][]);

  return (
    <div className={`relative ${className ?? ""}`} aria-roledescription="carousel">
      <div ref={viewportRef} className="overflow-hidden">
        <motion.div
          className="flex flex-nowrap"
          animate={{ x: -index * colW }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{ padding: 8 }}
        >
          {renderColumns.map((col, ci) => (
            <div key={`col-${ci}`} className="flex-none" style={{ width: colW, padding: 8 }}>
              <div className="flex flex-col gap-4">
                {col.map((it, ri) =>
                  "__sk" in it ? (
                    <div key={it.id} className="h-64 w-full rounded-xl bg-gray-100" />
                  ) : (
                    <ProductCard
                      key={(it as BookListItem).id ?? `i-${ci}-${ri}`}
                      item={it as BookListItem}
                    />
                  ),
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
        className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition disabled:opacity-40"
        aria-label="Xem trước"
      >
        <ChevronLeft className="h-5 w-5 cursor-pointer" />
      </button>
      <button
        type="button"
        onClick={next}
        disabled={index >= maxIndex}
        className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition disabled:opacity-40"
        aria-label="Xem tiếp"
      >
        <ChevronRight className="h-5 w-5 cursor-pointer" />
      </button>
    </div>
  );
}
