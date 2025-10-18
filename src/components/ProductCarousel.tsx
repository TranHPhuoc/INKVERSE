// src/components/ProductCarousel.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { BookListItem, SpringPage, ListParams } from "../types/books";
import api from "../services/api";

/* ===== Constants & helpers ===== */
const VIEWPORT_PAD = 8;
const COL_GAP = 16;
const ROW_GAP = 16;


/** Đo chiều rộng viewport; luôn trả về số dương (fallback) để tránh width=0 lúc mount */
function useResizeWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setW(Math.round(el.getBoundingClientRect().width));
    update(); // đo ngay lần đầu

    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;
      const nw = Math.round(entry.contentRect.width);
      setW((prev) => (prev !== nw ? nw : prev));
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [ref]);

  return w || 1200; // fallback để không bao giờ render với 0
}

/** Chuyển list -> cột theo row-major (đổ xuống theo hàng) */
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

/* ===== Props ===== */
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
  endpoint?: string; // nếu truyền -> sẽ tự fetch, append trang khi cuộn tới cuối
  params?: QueryParams;
  emptyHint?: string;
};

/* ===== Component ===== */
export default function ProductCarousel({
                                          items = [],
                                          rows: rowsProp = 1,
                                          cols: colsProp = 6,
                                          loading = false,
                                          className,
                                          wheelNav = true,
                                          endpoint,
                                          params = {},
                                          emptyHint = "Chưa có sản phẩm.",
                                        }: Props) {
  // Chuẩn hoá rows/cols
  const rows = Math.max(1, Math.floor(rowsProp));
  const cols = Math.max(1, Math.floor(colsProp));

  // Viewport
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewportW = useResizeWidth(viewportRef); // luôn > 0

  // State dữ liệu
  const [list, setList] = useState<BookListItem[]>(items);
  const [page, setPage] = useState(0); // zero-based
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Điều khiển enable/disable của nút
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Đồng bộ items prop
  useEffect(() => {
    setList(items);
    setPage(0);
    setTotalPages(1);
  }, [items, endpoint]);

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);

  // Fetch server nếu có endpoint
  useEffect(() => {
    const ep = withApiPrefix(endpoint);

    // Nếu đã có items truyền vào (HomeFeed), KHÔNG fetch thêm để khỏi ghi đè
    if ((items?.length ?? 0) > 0 || !ep) return;

    let cancelled = false;
    const size = Math.max(1, rows * cols);

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
        setList((prev) => (page === 0 ? content : [...prev, ...content]));
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
  }, [endpoint, paramsKey, page, rows, cols, params, items?.length]);

  // Tính width mỗi cột (có min để không collapse)
  const colW = useMemo(() => {
    const usable = viewportW - VIEWPORT_PAD * 2 - COL_GAP * (cols - 1);
    return Math.max(150, usable / cols); // mỗi card tối thiểu 150px
  }, [viewportW, cols]);

  // Chuyển danh sách -> cột (row-major)
  const columns = useMemo(() => toRowMajorColumns(list ?? [], rows), [list, rows]);

  // Data để render (skeleton khi đang tải)
  const renderColumns: (BookListItem | { __sk: true; id: string })[][] =
    (loading && list.length === 0) || fetching
      ? toRowMajorColumns(
        Array.from({ length: rows * cols }).map((_, i) => ({ __sk: true, id: `sk-${i}` })),
        rows,
      )
      : (columns as unknown as (BookListItem | { __sk: true; id: string })[][]);

  // Wheel navigation (ngang)
  useEffect(() => {
    if (!wheelNav || !viewportRef.current) return;
    const el = viewportRef.current;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 4) return;
      e.preventDefault();
      el.scrollBy({ left: delta, behavior: "auto" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as unknown as EventListener);
  }, [wheelNav]);

  // Cập nhật canPrev/canNext theo vị trí cuộn
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanPrev(scrollLeft > 4);
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 4;
      setCanNext(!atEnd || page + 1 < totalPages || fetching);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [page, totalPages, fetching, renderColumns.length]);

  // Trượt 1 cột (tức 1 sản phẩm khi rows=1)
  const stepPx = colW + COL_GAP;

  const next = () => {
    const el = viewportRef.current;
    if (!el) return;

    el.scrollBy({ left: stepPx, behavior: "smooth" });

    // nếu gần cuối và còn trang -> load thêm
    const nearEnd =
      el.scrollLeft + el.clientWidth + stepPx * 1.5 >= el.scrollWidth - 2; // heuritics nhẹ
    if (endpoint && page + 1 < totalPages && !fetching && nearEnd) {
      const ep = withApiPrefix(endpoint);
      if (!ep) return;
      const size = Math.max(1, rows * cols);
      setFetching(true);
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
        })
        .catch(() => setError("Không tải được dữ liệu."))
        .finally(() => setFetching(false));
    }
  };

  const prev = () => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: -stepPx, behavior: "smooth" });
  };

  return (
    <div className={`relative ${className ?? ""}`} aria-roledescription="carousel">
      <div
        ref={viewportRef}
        // *** Quan trọng: phải là overflow-x-auto để scroll được ***
        className="no-scrollbar overflow-x-auto min-h-[260px]"
        style={{ paddingLeft: VIEWPORT_PAD, paddingRight: VIEWPORT_PAD }}
      >
        {/* RAIL: flex ngang, mỗi cột có width cố định = colW */}
        <div
          className="flex flex-nowrap"
          style={{
            gap: COL_GAP,
            minWidth: "100%",
          }}
          role="list"
        >
          {renderColumns.map((col, ci) => (
            <div key={`col-${ci}`} className="flex-none" style={{ width: colW }} role="listitem">
              <div className="flex flex-col" style={{ gap: ROW_GAP, minHeight: 1 }}>
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
        </div>
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={prev}
        disabled={!canPrev}
        className="absolute top-1/2 left-0 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={next}
        disabled={!canNext}
        className="absolute top-1/2 right-0 z-20 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Xem tiếp"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {!fetching && !loading && list.length === 0 && !!emptyHint && (
        <p className="mt-3 text-center text-sm text-gray-500">{emptyHint}</p>
      )}
      {error && <p className="mt-2 text-center text-sm text-rose-600">{error}</p>}
    </div>
  );
}
