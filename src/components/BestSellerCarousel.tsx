import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { BookListItem } from "../types/books";

/* =================== constants =================== */
const PAD_X = 12;
const COL_GAP = 20;
const ROW_GAP = 20;
const COLS = 6;
const ROWS = 2;

/* =================== helpers =================== */
const vnd = (n?: number | null): string =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("vi-VN") : "";
  type PriceInfo = { origin?: number; current?: number; pct?: number };


const num = (x: unknown): number | undefined =>
  typeof x === "number" && Number.isFinite(x) ? x : undefined;
const str = (x: unknown): string | undefined =>
  typeof x === "string" && x.trim().length ? x : undefined;

function toPath(b: BookListItem): string {
  const r = b as Record<string, unknown>;
  const slug = str(r.slug);
  const id = num(r.id);
  return slug ? `/books/${slug}` : `/books/id/${id ?? ""}`;
}

function pickImage(b: BookListItem): string {
  const r = b as Record<string, unknown>;
  const t1 = str(r.thumbnail);
  if (t1) return t1;
  const t2 = str(r.imageUrl);
  if (t2) return t2;

  const images = r.images as unknown;
  if (Array.isArray(images)) {
    const sorted = [...images].sort((a, z) => {
      const sa = num((a as Record<string, unknown>).sortOrder) ?? 0;
      const sz = num((z as Record<string, unknown>).sortOrder) ?? 0;
      return sa - sz;
    });
    for (const it of sorted) {
      const u = str((it as Record<string, unknown>).url);
      if (u) return u;
    }
  }
  return "";
}
function pickPrice(b: BookListItem): PriceInfo {
  const r = b as Record<string, unknown>;
  const origin = typeof r.price === "number" && isFinite(r.price as number) ? (r.price as number) : undefined;

  const sale = typeof r.salePrice === "number" && isFinite(r.salePrice as number) ? (r.salePrice as number) : undefined;
  const final = typeof r.finalPrice === "number" && isFinite(r.finalPrice as number) ? (r.finalPrice as number) : undefined;
  const current = final ?? sale ?? origin;

  const out: PriceInfo = {};
  if (typeof origin === "number") out.origin = origin;
  if (typeof current === "number") out.current = current;

  let pct =
    typeof r.discountPercent === "number" && isFinite(r.discountPercent as number)
      ? (r.discountPercent as number)
      : undefined;

  if (pct == null && typeof origin === "number" && typeof current === "number" && origin > current) {
    pct = Math.round(((origin - current) / origin) * 100);
  }
  if (typeof pct === "number") out.pct = pct;

  return out;
}

function pickSold(b: BookListItem): number | undefined {
  const r = b as Record<string, unknown>;
  return (
    num(r.sold) ??
    num(r.soldCount) ??
    num(r.totalSold) ??
    num(r.orderCount) ??
    num(r.sales)
  );
}

function toColumns<T>(arr: readonly T[], rows: number): T[][] {
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

/* =================== main component =================== */
export default function BestSellerCarousel({ items }: { items: BookListItem[] }) {
  // đo viewport
  const vpRef = useRef<HTMLDivElement>(null);
  const [vpW, setVpW] = useState(0);
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVpW(el.clientWidth));
    ro.observe(el);
    setVpW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const colW = useMemo(() => {
    const usable = Math.max(0, vpW - PAD_X * 2 - COL_GAP * (COLS - 1));
    return Math.max(200, Math.floor(usable / COLS));
  }, [vpW]);

  const frameW = useMemo(
    () => COLS * colW + COL_GAP * (COLS - 1) + PAD_X * 2,
    [colW]
  );
  const stepPx = useMemo(() => colW + COL_GAP, [colW]);

  const columns = useMemo(() => toColumns(items ?? [], ROWS), [items]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const maxStart = Math.max(0, columns.length - COLS);
    setIdx((i) => Math.min(i, maxStart));
  }, [columns.length]);

  const atStart = idx <= 0;
  const atEnd = idx + COLS >= columns.length;

  const next = useCallback(() => {
    if (columns.length === 0) return;
    if (!atEnd) setIdx((i) => i + 1);
    else setIdx(0); // loop về đầu
  }, [atEnd, columns.length]);

  const prev = useCallback(() => {
    if (!atStart) setIdx((i) => Math.max(0, i - 1));
  }, [atStart]);

  const trackTranslate = useMemo(
    () => `translate3d(${-idx * stepPx}px,0,0)`,
    [idx, stepPx]
  );

  return (
    <section className="relative">
      {!atStart && (
        <button
          type="button"
          onClick={prev}
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
          aria-label="Prev"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={next}
        className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5 cursor-pointer" />
      </button>

      <div
        ref={vpRef}
        className="relative mx-auto overflow-hidden"
        style={{ width: frameW, paddingLeft: PAD_X, paddingRight: PAD_X }}
      >
        <div
          className="flex flex-nowrap will-change-transform"
          style={{
            gap: COL_GAP,
            transform: trackTranslate,
            transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
            minWidth: "100%",
          }}
        >
          {columns.map((col, ci) => (
            <div key={`col-${ci}`} className="flex-none" style={{ width: colW }}>
              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {col.map((book, ri) => (
                  <BestCard key={`b-${ci}-${ri}`} book={book} width={colW} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== Card: giữ nguyên UI + 'Đã bán' =================== */
function BestCard({ book, width }: { book: BookListItem; width: number }) {
  const img = pickImage(book);
  const { origin, current, pct } = pickPrice(book);
  const sold = pickSold(book);

  return (
    <div
      className="rounded-2xl bg-white shadow transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_26px_rgba(0,0,0,0.15)]"
      style={{ width }}
    >
      <Link to={toPath(book)} className="block h-full">
        {/* Ảnh + badge giảm giá */}
        <div className="relative w-full overflow-hidden rounded-t-2xl">
          <div className="aspect-[3/4] w-full">
            <img src={img} alt={book.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
          {typeof pct === "number" && pct > 0 && (
            <div className="absolute right-2 top-2 rounded-md bg-rose-600 px-2 py-[2px] text-xs font-bold text-white shadow">
              -{pct}%
            </div>
          )}
        </div>

        <div
          className="grid gap-1 px-3 py-3"
          style={{ gridTemplateRows: "minmax(40px,auto) 24px 18px" }}
        >
          <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-800">{book.title}</p>

          <div className="flex h-[24px] items-end gap-2">
            <span className="text-[15px] font-semibold leading-none text-rose-600">
              {vnd(current)} {current ? "đ" : ""}
            </span>
            {origin != null && current != null && origin > current && (
              <span className="text-xs leading-none text-gray-400 line-through">{vnd(origin)} đ</span>
            )}
          </div>

          <div className="h-[18px] text-xs leading-[18px] text-slate-500">
            {typeof sold === "number" ? `Đã bán ${sold}` : "\u00A0"}
          </div>
        </div>
      </Link>
    </div>
  );
}
