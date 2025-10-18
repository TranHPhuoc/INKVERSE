// src/components/TopSellingByCategory.tsx
import { useEffect, useMemo, useState, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTopSelling,
  getBookDetailById,
  type ResBookDetailDTO,
  type ResBookTopWithTrendDTO,
  type TopSellingMap,
} from "../services/bookTop";

/* ===== helpers ===== */
const nf = new Intl.NumberFormat("vi-VN");
const nfVnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const cls = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

function priceOf(detail?: ResBookDetailDTO | null): number | undefined {
  if (!detail) return undefined;
  if (detail.finalPrice != null) return detail.finalPrice;
  if (detail.salePrice != null) return detail.salePrice;
  return detail.price ?? undefined;
}

/** Sanitize HTML mô tả (giữ p/br/b/i/strong/em/u/ul/ol/li/span) */
function sanitizeBasic(html?: string): string {
  if (!html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    const allowed = new Set(["P", "BR", "STRONG", "EM", "B", "I", "U", "UL", "OL", "LI", "SPAN"]);

    const walk = (root: ParentNode) => {
      Array.from(root.childNodes).forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          const el = n as HTMLElement;
          if (!allowed.has(el.tagName)) {
            el.replaceWith(...Array.from(el.childNodes));
          } else {
            for (const a of Array.from(el.attributes)) el.removeAttribute(a.name);
          }
          if (el.parentElement) walk(el);
        }
      });
    };
    walk(doc.body);

    const text = (doc.body.textContent ?? "").trim();
    if (text.length > 800) {
      const cut = text.slice(0, 800).replace(/\s+\S*$/, "");
      doc.body.innerHTML = `<p>${cut}…</p>`;
    }
    return doc.body.innerHTML;
  } catch {
    return String(html).replace(/<[^>]+>/g, "");
  }
}

/* ===== small UI parts ===== */
function StockArrow({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "flat") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 12 L20 12" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (dir === "up") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 17 L9 10 L14 14 L20 6"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 6 L20 11 M20 6 L15 6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7 L9 14 L14 10 L20 18" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 18 L20 13 M20 18 L15 18" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RankCell({ rank, growth }: { rank: number; growth: number }) {
  const up = growth > 0;
  const flat = growth === 0 || !isFinite(growth);
  const dir: "up" | "down" | "flat" = flat ? "flat" : up ? "up" : "down";
  const rankColor =
    rank === 1 ? "text-emerald-600" : rank === 2 ? "text-sky-600" : rank === 3 ? "text-indigo-600" : "text-slate-600";

  return (
    <div className="flex w-11 flex-col items-center justify-center">
      <div className={cls("text-sm font-bold", rankColor)}>{String(rank)}</div>
      <div className="mt-1">
        <StockArrow dir={dir} />
      </div>
      <div
        className={cls(
          "mt-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none ring-1",
          flat
            ? "bg-slate-50 text-slate-700 ring-slate-200"
            : up
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-rose-200",
        )}
        title={`Tăng trưởng tuần: ${growth.toFixed(2)}%`}
      >
        {growth.toFixed(2)}%
      </div>
    </div>
  );
}

/* ===== component ===== */
export default function TopSellingByCategory({ limit = 5 }: { limit?: number }) {
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data, isLoading, isError } = useQuery<TopSellingMap>({
    queryKey: ["top-selling", limit],
    queryFn: () => getTopSelling(limit),
    staleTime: 60_000,
  });

  const categories = useMemo<string[]>(() => {
    if (!data || typeof data !== "object") return [];
    const entries = Object.entries(data) as [string, ResBookTopWithTrendDTO[]][];
    const sorted = entries
      .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
      .sort((a, b) => {
        const sumA = a[1].reduce((s, it) => s + (it.sold ?? 0), 0);
        const sumB = b[1].reduce((s, it) => s + (it.sold ?? 0), 0);
        if (sumB !== sumA) return sumB - sumA;
        return a[0].localeCompare(b[0]);
      });
    return sorted.map(([k]) => k);
  }, [data]);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  useEffect(() => {
    if (!activeCat && categories.length > 0) setActiveCat(categories[0] ?? null);
  }, [categories, activeCat]);

  const list = useMemo<ResBookTopWithTrendDTO[]>(() => {
    if (!activeCat) return [];
    const arr = (data?.[activeCat] as ResBookTopWithTrendDTO[]) ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [activeCat, data]);

  const [hoverId, setHoverId] = useState<number | null>(null);
  useEffect(() => {
    if (hoverId != null) return;
    const first = list[0];
    if (first) setHoverId(first.bookId);
  }, [list, hoverId]);

  useEffect(() => {
    if (hoverId != null) {
      void qc.prefetchQuery({
        queryKey: ["book-detail", hoverId],
        queryFn: () => getBookDetailById(hoverId),
        staleTime: 120_000,
      });
    }
  }, [hoverId, qc]);

  const { data: detail } = useQuery<ResBookDetailDTO | null>({
    queryKey: ["book-detail", hoverId],
    queryFn: () => (hoverId ? getBookDetailById(hoverId) : Promise.resolve(null)),
    enabled: hoverId != null,
    staleTime: 120_000,
  });

  const openBook = (bookId: number) => {
    const cached = qc.getQueryData<ResBookDetailDTO>(["book-detail", bookId]);
    const slug = cached?.slug;
    nav(slug ? `/books/${slug}` : `/books/id/${bookId}`);
  };

  /* ---------- Tabs underline (smooth x + width) ---------- */
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [bar, setBar] = useState({ x: 0, w: 0 });

  const updateBar = useCallback(() => {
    const wrap = tabsWrapRef.current;
    const btn = activeCat ? tabRefs.current[activeCat] : null;
    if (!wrap || !btn) return;
    const wb = wrap.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    setBar({ x: bb.left - wb.left + wrap.scrollLeft, w: bb.width });
  }, [activeCat]);

  useLayoutEffect(() => {
    updateBar();
  }, [updateBar, categories.length]);

  useEffect(() => {
    const onResize = () => updateBar();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateBar]);

  useEffect(() => {
    const wrap = tabsWrapRef.current;
    const btn = activeCat ? tabRefs.current[activeCat] : null;
    if (wrap && btn) {
      const off = btn.offsetLeft - wrap.clientWidth / 2 + btn.clientWidth / 2;
      wrap.scrollTo({ left: off, behavior: "smooth" });
    }
  }, [activeCat]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-b from-sky-50 to-indigo-50 p-6 text-slate-800">
        Đang tải bảng xếp hạng…
      </div>
    );
  }
  if (isError || !data || categories.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-b from-sky-50 to-indigo-50 p-6 text-slate-800">
        Không có dữ liệu bảng xếp hạng.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/70 p-6 shadow-[0_12px_40px_rgba(2,6,23,0.14)]"
    >
      {/* BRIGHTER BG */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(160% 100% at 50% -20%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 25%, rgba(255,255,255,0.15) 55%, transparent 70%),
            linear-gradient(180deg, #EAF3FF 0%, #DCEBFF 28%, #CFE5FF 55%, #BEDBFF 78%, #B4D6FF 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 mix-blend-soft-light"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(30,64,175,0.06) 0, rgba(30,64,175,0.06) 1px, transparent 1px, transparent 18px),
            radial-gradient(60% 30% at 85% 10%, rgba(59,130,246,0.25), transparent 60%)
          `,
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">
        <h2 className="mb-6 text-center text-2xl font-extrabold tracking-wide text-slate-800">
          BẢNG XẾP HẠNG BÁN CHẠY THEO TUẦN
        </h2>

        {/* Tabs */}
        <div className="relative mb-6">
          <div className="rounded-xl bg-white/60 p-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md ring-1 ring-white/70 shadow-sm">
            <div
              ref={tabsWrapRef}
              className="relative flex items-center gap-8 overflow-x-auto no-scrollbar pb-1"
              role="tablist"
              aria-label="Top categories"
            >
              {categories.map((cat, idx) => {
                const isActive = activeCat === cat;
                return (
                  <button
                    key={cat}
                    ref={(el) => {
                      tabRefs.current[cat] = el;
                    }}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => {
                      setActiveCat(cat);
                      setHoverId(null);
                    }}
                    onKeyDown={(e) => {
                      if (!categories.length) return;
                      if (e.key === "ArrowRight") {
                        e.preventDefault();
                        const next = categories[(idx + 1) % categories.length];
                        setActiveCat(next ?? null);
                        setHoverId(null);
                      } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        const prev = categories[(idx - 1 + categories.length) % categories.length];
                        setActiveCat(prev ?? null);
                        setHoverId(null);
                      }
                    }}
                    className={cls(
                      "relative whitespace-nowrap font-semibold transition-colors",
                      isActive ? "text-rose-700" : "text-slate-600 hover:text-slate-800 cursor-pointer"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}

              {/* underline */}
              <motion.div
                className="absolute bottom-0 h-[2px] rounded-full bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,.25)]"
                animate={{ x: bar.x, width: bar.w }}
                transition={{ type: "spring", stiffness: 520, damping: 36 }}
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* LEFT LIST */}
          <div className="space-y-3 md:col-span-5">
            {list.map((b) => {
              const active = hoverId === b.bookId;
              return (
                <motion.div
                  key={b.bookId}
                  whileHover={{ scale: 1.015, x: 6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  onMouseEnter={() => setHoverId(b.bookId)}
                  onClick={() => openBook(b.bookId)}
                  className={cls(
                    "flex cursor-pointer items-center gap-3 rounded-xl p-3 ring-1 transition-all backdrop-blur-sm",
                    active
                      ? "bg-white/85 ring-rose-400 shadow-[0_10px_24px_rgba(2,6,23,.12)]"
                      : "bg-white/70 hover:bg-white/90 ring-slate-200 hover:shadow-sm"
                  )}
                  title="Xem chi tiết"
                >
                  <RankCell rank={b.rank} growth={b.growthPercent} />

                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                    {b.imageUrl ? (
                      <img src={b.imageUrl ?? ""} alt={b.title ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="line-clamp-1 font-semibold text-slate-900">{b.title}</div>
                    <div className="line-clamp-1 text-sm text-slate-700">{b.authorNames}</div>
                    <div className="mt-1 text-xs text-slate-600">Tuần này: {nf.format(b.sold)}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* RIGHT DETAIL */}
          <div className="md:col-span-7">
            <AnimatePresence mode="wait">
              {detail && (
                <motion.div
                  key={detail.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  onClick={() => nav(detail.slug ? `/books/${detail.slug}` : `/books/id/${detail.id}`)}
                  className="cursor-pointer rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200 shadow-[0_12px_28px_rgba(2,6,23,.10)] hover:shadow-[0_16px_34px_rgba(2,6,23,.14)] transition-shadow"
                  title="Xem chi tiết"
                >
                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-slate-200 sm:w-1/3 bg-white">
                      <motion.img
                        key={detail.id}
                        src={
                          detail.images?.find((i) => i.sortOrder === 0)?.url ??
                          detail.cover ??
                          detail.thumbnail ??
                          detail.imageUrl ??
                          ""
                        }
                        alt={detail.title}
                        className="h-full w-full object-cover"
                        whileHover={{ scale: 1.04 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                      <h3 className="mb-1 text-xl font-extrabold text-slate-900">
                        {detail.title}
                      </h3>
                      <p className="mb-3 text-sm text-slate-700">
                        {detail.authors?.length
                          ? detail.authors.map((a) => a.name).join(", ")
                          : list.find((x) => x.bookId === detail.id)?.authorNames}
                      </p>

                      {/* GIÁ */}
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        {(() => {
                          const p = detail.price ?? undefined;
                          const f = priceOf(detail);
                          const hasSale = p != null && f != null && f < p;
                          if (p == null && f == null) return null;
                          return (
                            <>
                              {hasSale ? (
                                <>
                                  <div className="text-sm text-slate-500 line-through">{nfVnd.format(Number(p))}</div>
                                  <div className="text-xl font-extrabold text-rose-700">{nfVnd.format(Number(f))}</div>
                                </>
                              ) : (
                                <div className="text-xl font-extrabold text-slate-900">{nfVnd.format(Number(f ?? p))}</div>
                              )}
                            </>
                          );
                        })()}
                        <div className="text-sm text-slate-600">
                          Tuần trước: {nf.format(list.find((x) => x.bookId === detail.id)?.lastWeekSold ?? 0)}
                        </div>
                      </div>

                      <div
                        className="prose prose-sm max-w-none text-slate-800 line-clamp-6"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeBasic(detail.description || "Chưa có mô tả."),
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BUTTON */}
        <div className="mt-8 flex justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => nav("/top-selling")}
            className="cursor-pointer rounded-lg bg-rose-700 px-6 py-2.5 font-semibold text-white shadow-[0_8px_20px_rgba(185,28,28,.28)] hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/70"
          >
            Xem thêm
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
