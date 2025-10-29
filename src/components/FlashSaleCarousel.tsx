// src/components/FlashSaleCarousel.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { BookListItem } from "../types/books";
import api from "../services/api";
import { resolveThumb, PLACEHOLDER } from "../types/img";

/* ================= helpers ================= */
const GAP = 20;
const PAD_X = 12;

const vnd = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("vi-VN") : "";

const num = (x: unknown): number | undefined =>
  typeof x === "number" && Number.isFinite(x) ? x : undefined;

const str = (x: unknown): string | undefined =>
  typeof x === "string" && x.trim().length ? x : undefined;

function uniqBy<T, K>(arr: T[], keyFn: (t: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const it of arr) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function keyOf(b: BookListItem): string | number {
  const r = b as Record<string, unknown>;
  return (r.id as number | string) ?? (r.slug as string) ?? (b.title as string);
}
function toPath(b: BookListItem): string {
  const r = b as Record<string, unknown>;
  const slug = str(r.slug);
  const id = num(r.id);
  return slug ? `/books/${slug}` : `/books/id/${id ?? ""}`;
}
function pickImage(b: BookListItem): string {
  const r = b as Record<string, unknown>;
  const thumb = str(r.thumbnail);
  if (thumb) return resolveThumb(thumb);
  const imageUrl = str(r.imageUrl);
  if (imageUrl) return resolveThumb(imageUrl);
  const images = r.images;
  if (Array.isArray(images)) {
    for (const it of images) {
      const url = str((it as Record<string, unknown>).url);
      if (url) return resolveThumb(url);
    }
  }
  return PLACEHOLDER;
}
function pickPrice(b: BookListItem) {
  const r = b as Record<string, unknown>;
  const origin = num(r.price);
  const current = num(r.finalPrice) ?? num(r.salePrice) ?? num(r.price);
  let pct = num(r.discountPercent);
  if (pct == null && origin != null && current != null && origin > current) {
    pct = Math.round(((origin - current) / origin) * 100);
  }
  return { origin, current, pct };
}
function pickSold(b: BookListItem) {
  const r = b as Record<string, unknown>;
  return num(r.sold) ?? num(r.soldCount) ?? num(r.totalSold) ?? num(r.orderCount) ?? num(r.sales);
}
function withApiPrefix(endpoint?: string): string | undefined {
  if (!endpoint) return undefined;
  return endpoint.startsWith("/api/") ? endpoint : `/api/v1${endpoint}`;
}
function unwrapPage<T>(res: unknown): T {
  const payload: unknown = (res as { data?: unknown })?.data ?? res;
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/* ===== flash-sale normalize (lọc ≥20% + sort theo % giảm) ===== */
function discountPctOf(b: BookListItem): number {
  const { origin, current, pct } = pickPrice(b);
  if (pct != null) return pct;
  if (origin == null || current == null || origin <= 0 || current >= origin) return -1;
  return Math.round(((origin - current) / origin) * 100);
}
function normalizeFlashSale(arr: BookListItem[]): BookListItem[] {
  const unique = uniqBy(arr, keyOf);
  return unique
    .filter((it) => discountPctOf(it) >= 20)
    .sort((a, b) => discountPctOf(b) - discountPctOf(a));
}

/* ================= types ================= */
type ApiPage<T> = { content?: T[]; totalPages?: number };
type QueryParams = Record<string, unknown>;
type Props = {
  pageSize?: number;
  items?: BookListItem[];
  endpoint?: string;
  params?: QueryParams;
  title?: string;
};
type RenderItem = { kind: "sk"; id: string } | { kind: "book"; item: BookListItem };

/* ================= component ================= */
const FlashSaleCarousel: React.FC<Props> = ({
  pageSize = 6,
  items = [],
  endpoint = "/books",
  params = { status: "ACTIVE", sort: "createdAt", direction: "DESC" },
  title = "FLASH SALE",
}) => {
  const ep = withApiPrefix(endpoint);

  /* ===== layout ===== */
  const viewportRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const ro = new ResizeObserver(() => setWrapW(vp.clientWidth));
    ro.observe(vp);
    setWrapW(vp.clientWidth);
    return () => ro.disconnect();
  }, []);

  const cardW = useMemo(() => {
    const usable = Math.max(0, wrapW - PAD_X * 2 - GAP * (pageSize - 1));
    return Math.max(210, Math.floor(usable / pageSize));
  }, [wrapW, pageSize]);

  const frameW = useMemo(
    () => pageSize * cardW + GAP * (pageSize - 1) + PAD_X * 2,
    [pageSize, cardW],
  );

  /* ===== data ===== */
  const [list, setList] = useState<BookListItem[]>(normalizeFlashSale(items ?? []));
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const itemsKey = useMemo(() => JSON.stringify(items ?? []), [items]);

  useEffect(() => {
    const maxStart = Math.max(0, (list?.length ?? 0) - pageSize);
    setIdx((i) => Math.min(i, maxStart));
  }, [list.length, pageSize]);

  useEffect(() => {
    setList(normalizeFlashSale(items ?? []));
    setPage(0);
    setTotalPages(ep ? Number.MAX_SAFE_INTEGER : 1);
    setIdx(0);
  }, [itemsKey, ep]);

  // tải trang đầu
  useEffect(() => {
    if ((items?.length ?? 0) > 0 || !ep) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api.get(ep, { params: { ...params, page: 0, size: pageSize } });
        const pg = unwrapPage<ApiPage<BookListItem>>(res);
        const content = Array.isArray(pg?.content) ? pg.content : [];
        if (!cancelled) {
          setList(normalizeFlashSale(content));
          setTotalPages(Math.max(1, pg?.totalPages ?? 1));
          setPage(0);
        }
      } catch {
        if (!cancelled) setErr("Không tải được dữ liệu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ep, paramsKey, pageSize, items?.length]);

  /* ===== fetch  ===== */
  const fetchMore = useCallback(async (): Promise<number> => {
    if (!ep) return 0;
    if (page + 1 >= totalPages || fetching) return 0;

    try {
      setFetching(true);
      const res = await api.get(ep, { params: { ...params, page: page + 1, size: pageSize } });
      const pg = unwrapPage<ApiPage<BookListItem>>(res);
      const content = Array.isArray(pg?.content) ? pg.content : [];
      const tp = pg?.totalPages;

      let added = 0;
      setList((prev) => {
        const before = prev.length;
        const after = normalizeFlashSale([...prev, ...content]);
        added = after.length - before;
        return after;
      });
      if (typeof tp === "number") setTotalPages(tp);
      setPage((p) => p + 1);
      return added;
    } catch {
      setErr("Không tải được dữ liệu.");
      return 0;
    } finally {
      setFetching(false);
    }
  }, [ep, page, totalPages, fetching, params, pageSize]);

  /* ===== controls ===== */
  const atStart = idx <= 0;
  const maxStart = Math.max(0, list.length - pageSize);

  const next = useCallback(async () => {
    if (idx < maxStart) {
      setIdx((i) => Math.min(i + 1, maxStart));
      if (ep && maxStart - idx <= 2) void fetchMore();
      return;
    }
    if (page + 1 < totalPages && !fetching) {
      const added = await fetchMore();
      if (added > 0) {
        const newMaxStart = Math.max(0, list.length + added - pageSize);
        setIdx((i) => Math.min(i + 1, newMaxStart));
        return;
      }
    }
    if (list.length > 0) setIdx(0);
  }, [idx, maxStart, ep, fetchMore, page, totalPages, fetching, list.length, pageSize]);

  const prev = useCallback(() => {
    if (!atStart) setIdx((i) => Math.max(0, i - 1));
  }, [atStart]);

  const trackTranslate = useMemo(() => `translate3d(${-idx * (cardW + GAP)}px,0,0)`, [idx, cardW]);

  /* ===== render ===== */
  const renderItems: RenderItem[] =
    list.length === 0 && (loading || fetching)
      ? Array.from({ length: pageSize }).map((_, i) => ({ kind: "sk", id: `sk-${i}` }))
      : list.map((it) => ({ kind: "book", item: it }));

  const disableNext = list.length === 0 && (loading || fetching);
  const showPrev = !atStart;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-[#b91c1c] via-[#dc2626] to-[#f97316] py-12 sm:mx-[calc(50%-50vw)] sm:w-screen">
      {/* glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-white/40" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-center md:mb-8">
          <h2
            className="text-center text-2xl font-extrabold tracking-[0.12em] uppercase md:text-[36px] md:tracking-[0.2em]"
            style={{
              background: "linear-gradient(90deg, #fde68a, #ffffff 45%, #ffedd5 90%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow:
                "0 0 2px rgba(255,255,255,.6), 0 0 10px rgba(255,255,255,.35), 0 2px 8px rgba(0,0,0,.35)",
              WebkitTextStroke: "0.5px rgba(255,255,255,0.6)",
            }}
          >
            {title}
          </h2>
        </div>

        {/* ===== MOBILE: scroll-snap swipe ===== */}
        <div className="md:hidden">
          <div className="rounded-2xl bg-white/10 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)] ring-1 ring-white/20 backdrop-blur-[2px]">
            <div className="no-scrollbar snap-x snap-mandatory overflow-x-auto px-4">
              <div className="flex gap-3">
                {(list.length ? list : []).map((it) => (
                  <div
                    key={String(keyOf(it))}
                    className="xs:w-[58%] w-[66%] shrink-0 snap-start sm:w-[50%]"
                  >
                    <Card book={it} />
                  </div>
                ))}
                {list.length === 0 && (loading || fetching)
                  ? Array.from({ length: Math.max(4, pageSize) }).map((_, i) => (
                      <div
                        key={`sk-m-${i}`}
                        className="xs:w-[58%] w-[66%] shrink-0 snap-start sm:w-[50%]"
                      >
                        <div className="rounded-2xl bg-white shadow">
                          <div className="aspect-[3/4] w-full animate-pulse rounded-t-2xl bg-gray-100" />
                          <div className="p-3">
                            <div className="mb-2 h-10 w-full animate-pulse rounded bg-gray-100" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
            {err && <p className="mt-3 text-center text-sm text-rose-100">{err}</p>}
          </div>
        </div>

        {/* ===== DESKTOP ===== */}
        <div className="hidden md:block">
          <div className="relative rounded-2xl bg-white/10 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/20 backdrop-blur-[2px]">
            {/* Prev */}
            {showPrev && (
              <button
                type="button"
                onClick={prev}
                className="absolute top-1/2 left-2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white"
                aria-label="Prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Next */}
            <button
              type="button"
              onClick={next}
              disabled={disableNext}
              className="absolute top-1/2 right-2 z-30 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Viewport */}
            <div
              ref={viewportRef}
              className="relative mx-auto overflow-hidden"
              style={{ width: frameW, paddingLeft: PAD_X, paddingRight: PAD_X }}
            >
              <div
                className="flex will-change-transform"
                style={{
                  gap: GAP,
                  transform: trackTranslate,
                  transition: "transform 420ms cubic-bezier(.22,.61,.36,1)",
                }}
              >
                {renderItems.map((ri) =>
                  ri.kind === "sk" ? (
                    <div
                      key={ri.id}
                      className="flex-none rounded-2xl bg-white shadow"
                      style={{ width: cardW }}
                    >
                      <div className="aspect-[3/4] w-full animate-pulse rounded-t-2xl bg-gray-100" />
                      <div className="p-3">
                        <div className="mb-2 h-10 w-full animate-pulse rounded bg-gray-100" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                      </div>
                    </div>
                  ) : (
                    <div
                      key={String(keyOf(ri.item))}
                      className="flex-none"
                      style={{ width: cardW }}
                    >
                      <Card book={ri.item} width={cardW} />
                    </div>
                  ),
                )}
              </div>
            </div>

            {err && <p className="mt-3 text-center text-sm text-rose-100">{err}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashSaleCarousel;

/* ================= Card ================= */
const Card: React.FC<{ book: BookListItem; width?: number }> = ({ book, width }) => {
  const img = pickImage(book);
  const { origin, current, pct } = pickPrice(book);
  const sold = pickSold(book);

  return (
    <div
      className="rounded-2xl bg-white shadow transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_26px_rgba(0,0,0,0.15)]"
      style={typeof width === "number" && width > 0 ? { width } : undefined}
    >
      <Link to={toPath(book)} className="block h-full">
        <div className="relative w-full overflow-hidden rounded-t-2xl">
          <div className="aspect-[3/4] w-full">
            <img
              src={img}
              alt={book.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
              }}
            />
          </div>
          {typeof pct === "number" && pct > 0 && (
            <div className="absolute top-2 right-2 rounded-md bg-rose-600 px-2 py-[2px] text-xs font-bold text-white shadow">
              -{pct}%
            </div>
          )}
        </div>

        <div
          className="grid gap-1 px-3 py-3"
          style={{ gridTemplateRows: "minmax(40px,auto) 24px 18px" }}
        >
          <p className="line-clamp-2 text-sm leading-5 font-medium text-slate-800">{book.title}</p>

          <div className="flex h-[24px] items-end gap-2">
            <span className="text-[15px] leading-none font-semibold text-rose-600">
              {vnd(current)} {current ? "đ" : ""}
            </span>
            {origin != null && current != null && origin > current && (
              <span className="text-xs leading-none text-gray-400 line-through">
                {vnd(origin)} đ
              </span>
            )}
          </div>

          <div className="h-[18px] text-xs leading-[18px] text-slate-500">
            {typeof sold === "number" ? `Đã bán ${sold}` : "\u00A0"}
          </div>
        </div>
      </Link>
    </div>
  );
};
