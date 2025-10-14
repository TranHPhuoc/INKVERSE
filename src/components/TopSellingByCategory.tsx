// src/pages/TopSellingByCategory.tsx
import { useEffect, useMemo, useState } from "react";
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
        <path d="M4 12 L20 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
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
        <path
          d="M20 6 L20 11 M20 6 L15 6"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7 L9 14 L14 10 L20 18"
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 18 L20 13 M20 18 L15 18"
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RankCell({ rank, growth }: { rank: number; growth: number }) {
  const up = growth > 0;
  const flat = growth === 0 || !isFinite(growth);
  const dir: "up" | "down" | "flat" = flat ? "flat" : up ? "up" : "down";
  const rankColor =
    rank === 1
      ? "text-emerald-600"
      : rank === 2
        ? "text-sky-600"
        : rank === 3
          ? "text-indigo-600"
          : "text-slate-500";

  return (
    <div className="flex w-11 flex-col items-center justify-center">
      <div className={cls("text-sm font-semibold", rankColor)}>{String(rank)}</div>
      <div className="mt-1">
        <StockArrow dir={dir} />
      </div>
      <div
        className={cls(
          "mt-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none ring-1",
          flat
            ? "bg-slate-50 text-slate-600 ring-slate-200"
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

  // Prefetch detail khi hover
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

  // Click mở chi tiết
  const openBook = (bookId: number) => {
    const cached = qc.getQueryData<ResBookDetailDTO>(["book-detail", bookId]);
    const slug = cached?.slug;
    nav(slug ? `/books/${slug}` : `/books/id/${bookId}`);
  };

  if (isLoading) {
    return <div className="rounded-2xl bg-neutral-900 p-6 text-gray-300">Đang tải bảng xếp hạng…</div>;
  }
  if (isError || !data || categories.length === 0) {
    return <div className="rounded-2xl bg-neutral-900 p-6 text-gray-300">Không có dữ liệu bảng xếp hạng.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-neutral-900 p-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
    >
      {/* HEADER */}
      <h2 className="mb-6 text-center text-2xl font-semibold tracking-wide text-white">
        BẢNG XẾP HẠNG BÁN CHẠY THEO TUẦN
      </h2>

      {/* Tabs */}
      <div className="relative mb-6">
        {/* thanh trắng mờ phía dưới */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const active = activeCat === cat;
            return (
              <motion.button
                key={cat}
                onClick={() => {
                  setActiveCat(cat);
                  setHoverId(null);
                }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cls(
                  "relative pb-2 text-sm md:text-base font-medium transition-colors duration-200 cursor-pointer",
                  active
                    ? "text-red-500"
                    : "text-gray-400 hover:text-white",
                )}
              >
                {cat}

                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-gradient-to-r from-red-500 to-red-300 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
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
                whileHover={{ scale: 1.02, x: 6 }}
                transition={{ type: "spring", stiffness: 250, damping: 18 }}
                onMouseEnter={() => setHoverId(b.bookId)}
                onClick={() => openBook(b.bookId)}
                className={cls(
                  "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 backdrop-blur-sm transition-all",
                  active
                    ? "border-red-500/40 bg-neutral-800/90 shadow-[0_0_12px_rgba(255,0,0,0.2)]"
                    : "bg-neutral-900/70 hover:border-red-500/20 hover:bg-neutral-800",
                )}
                title="Xem chi tiết"
              >
                {/* Ô xếp hạng: số → mũi tên xanh/đỏ/xám → % (giữ NGUYÊN như cũ) */}
                <RankCell rank={b.rank} growth={b.growthPercent} />

                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-neutral-700">
                  {b.imageUrl ? (
                    <img src={b.imageUrl ?? ""} alt={b.title ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-neutral-800" />
                  )}
                </div>

                <div className="flex-1 text-gray-300">
                  <div className="line-clamp-1 font-medium text-white">{b.title}</div>
                  <div className="line-clamp-1 text-sm text-gray-400">{b.authorNames}</div>
                  <div className="mt-1 text-xs text-gray-500">Tuần này: {nf.format(b.sold)}</div>
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
                transition={{ duration: 0.4 }}
                onClick={() => nav(detail.slug ? `/books/${detail.slug}` : `/books/id/${detail.id}`)}
                className="cursor-pointer rounded-2xl border border-neutral-700 bg-neutral-800/60 p-5 shadow-[0_0_12px_rgba(255,255,255,0.05)] transition-all hover:shadow-[0_0_16px_rgba(255,255,255,0.1)]"
                title="Xem chi tiết"
              >
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="aspect-[3/4] w-full overflow-hidden rounded-xl ring-1 ring-neutral-700 sm:w-1/3">
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
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-center text-gray-300">
                    <h3 className="mb-1 text-xl font-semibold text-white">{detail.title}</h3>
                    <p className="mb-3 text-sm text-gray-400">
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
                                <div className="text-sm text-gray-500 line-through">{nfVnd.format(Number(p))}</div>
                                <div className="text-xl font-bold text-red-500">{nfVnd.format(Number(f))}</div>
                              </>
                            ) : (
                              <div className="text-xl font-bold text-white">{nfVnd.format(Number(f ?? p))}</div>
                            )}
                          </>
                        );
                      })()}
                      <div className="text-sm text-gray-400">
                        Tuần trước: {nf.format(list.find((x) => x.bookId === detail.id)?.lastWeekSold ?? 0)}
                      </div>
                    </div>

                    <div
                      className="prose prose-sm prose-invert max-w-none text-gray-400 line-clamp-5"
                      dangerouslySetInnerHTML={{
                        __html:
                          detail.description && detail.description.trim().startsWith("<")
                            ? sanitizeBasic(detail.description)
                            : `<p>${detail.description || "Chưa có mô tả."}</p>`,
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => nav("/top-selling")}
          className="rounded-lg border border-red-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-red-600 hover:text-white cursor-pointer"
        >
          Xem thêm
        </motion.button>
      </div>
    </motion.div>
  );
}
