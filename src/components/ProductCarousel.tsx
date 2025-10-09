import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { BookListItem, SpringPage, ListParams } from "../types/books";
import api from "../services/api";

/* ───────── constants & helpers ───────── */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT_PAD = 8;
const COL_GAP = 16;
const ROW_GAP = 16;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

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

function toRowMajorColumns<T>(arr: T[], rows: number): T[][] {
  const r = Math.max(1, rows);
  const totalCols = Math.ceil(arr.length / r);
  const cols: T[][] = Array.from({ length: totalCols }, () => []);
  for (let c = 0; c < totalCols; c++) {
    for (let row = 0; row < r; row++) {
      const idx = c + row * totalCols;
      if (idx < arr.length) cols[c]!.push(arr[idx]!);
    }
  }
  return cols;
}

function withApiPrefix(endpoint?: string): string | undefined {
  if (!endpoint) return undefined;
  return endpoint.startsWith("/api/") ? endpoint : `/api/v1${endpoint}`;
}

/* ───────── props ───────── */
type QueryParams = Partial<
  Pick<
    ListParams,
    "status" | "authorId" | "categoryId" | "publisherId" | "supplierId" | "sort" | "direction"
  >
> &
  Record<string, unknown>;

type Props = {
  items?: BookListItem[];
  rows?: number;
  cols?: number;
  loading?: boolean;
  className?: string;
  wheelNav?: boolean;
  endpoint?: string;
  params?: QueryParams;
};

/* ───────── component ───────── */
export default function ProductCarousel({
  items = [],
  rows = 1,
  cols = 6,
  loading = false,
  className,
  wheelNav = true,
  endpoint,
  params = {},
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportW = useResizeWidth(viewportRef);

  const [list, setList] = useState<BookListItem[]>(items);
  const [page, setPage] = useState(0); // zero-based
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setList(items);
    setPage(0);
    setTotalPages(1);
  }, [items, endpoint]);

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  useEffect(() => {
    const ep = withApiPrefix(endpoint);
    if (!ep) return; // chỉ dùng items tĩnh
    const size = Math.max(1, rows * cols);

    let cancelled = false;
    (async () => {
      try {
        setFetching(true);
        setError(null);

        const res = await api.get<SpringPage<BookListItem>>(ep, {
          params: { ...params, page, size },
          validateStatus: (s) => s < 500,
        });

        const pageData = res.data;
        const content = Array.isArray(pageData?.content) ? pageData.content : [];
        const tp = pageData?.totalPages ?? 1;

        if (cancelled) return;

        if (page === 0) setList(content);
        else setList((prev) => [...prev, ...content]);

        setTotalPages(tp);
      } catch {
        if (!cancelled) setError("Không tải được dữ liệu.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endpoint, paramsKey, page, rows, cols, params]);

  // width mỗi cột
  const colW = useMemo(() => {
    if (viewportW <= 0 || cols <= 0) return 0;
    const usable = viewportW - VIEWPORT_PAD * 2 - COL_GAP * (cols - 1);
    return Math.max(0, usable / cols);
  }, [viewportW, cols]);

  const columns = useMemo(() => toRowMajorColumns(list ?? [], rows), [list, rows]);
  const totalColumns = columns.length;
  const maxIndex = Math.max(0, totalColumns - cols);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [rows, cols, list?.length]);

  const next = () => {
    if (index < maxIndex) {
      setIndex((i) => i + 1);
      return;
    }

    if (endpoint && page + 1 < totalPages && !fetching) {
      const ep = withApiPrefix(endpoint);
      if (!ep) return;

      setFetching(true);
      const size = Math.max(1, rows * cols);

      api
        .get<SpringPage<BookListItem>>(ep, {
          params: { ...params, page: page + 1, size },
          validateStatus: (s) => s < 500,
        })
        .then((res) => {
          const content = Array.isArray(res.data?.content) ? res.data.content : [];
          setPage((p) => p + 1);
          setList((prev) => [...prev, ...content]);
          if (typeof res.data?.totalPages === "number") setTotalPages(res.data.totalPages);
          setIndex((i) => i + 1);
        })
        .catch(() => {
          setError("Không tải được dữ liệu.");
        })
        .finally(() => setFetching(false));
    }
  };

  const prev = () => setIndex((i) => clamp(i - 1, 0, maxIndex));

  // render skeleton khi loading/fetching
  const renderColumns: (BookListItem | { __sk: true; id: string })[][] =
    (loading && list.length === 0) || fetching
      ? toRowMajorColumns(
          Array.from({ length: rows * cols }).map((_, i) => ({ __sk: true, id: `sk-${i}` })),
          rows,
        )
      : (columns as unknown as (BookListItem | { __sk: true; id: string })[][]);

  // Wheel navigation
  useEffect(() => {
    if (!wheelNav || !viewportRef.current) return;
    const el = viewportRef.current;
    const onWheel = (e: WheelEvent) => {
      if (maxIndex <= 0) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 4) return;
      e.preventDefault();
      setIndex((prevIdx) => clamp(prevIdx + (delta > 0 ? 1 : -1), 0, maxIndex));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as unknown as EventListener);
  }, [wheelNav, maxIndex]);

  return (
    <div className={`relative ${className ?? ""}`} aria-roledescription="carousel">
      <div ref={viewportRef} className="overflow-hidden">
        <motion.div
          className="flex flex-nowrap"
          animate={{ x: -(index * (colW + COL_GAP)) }}
          transition={{ duration: 0.48, ease: EASE }}
          style={{ paddingLeft: VIEWPORT_PAD, paddingRight: VIEWPORT_PAD, gap: COL_GAP }}
          role="list"
        >
          {renderColumns.map((col, ci) => (
            <div key={`col-${ci}`} className="flex-none" style={{ width: colW }} role="listitem">
              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {col.map((it, ri) =>
                  "__sk" in it ? (
                    <div key={it.id} className="h-64 w-full animate-pulse rounded-xl bg-gray-100" />
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
        className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        disabled={index >= maxIndex && page + 1 >= totalPages && !fetching}
        className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem tiếp"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
    </div>
  );
}
