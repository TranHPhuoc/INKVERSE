// src/components/top/TopSellingByCategory.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getTopSelling,
  getBookDetailById,
  type ResBookDetailDTO,
  type ResBookTopWithTrendDTO,
  type TopSellingMap,
} from "../services/bookTop";

/* =============== helpers =============== */
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

/* =============== small UI parts =============== */
function StockArrow({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "flat") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 12 L10 12 L16 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
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
    <div className="flex w-10 flex-col items-center justify-center">
      <div className={cls("text-sm font-semibold", rankColor)}>{String(rank).padStart(2, "0")}</div>
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

function TrendBadge({ growth, big = false }: { growth: number; big?: boolean }) {
  const up = growth > 0;
  const flat = growth === 0 || !isFinite(growth);
  return (
    <span
      className={cls(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1",
        big ? "px-2.5 py-1 text-sm" : "",
        flat
          ? "bg-slate-50 text-slate-600 ring-slate-200"
          : up
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-rose-200",
      )}
      title={`Tăng trưởng tuần: ${growth.toFixed(2)}%`}
    >
      {!flat && (up ? "▲" : "▼")} {flat ? "0.00%" : `${growth.toFixed(2)}%`}
    </span>
  );
}

/* =============== component =============== */
export default function TopSellingByCategory({ limit = 5 }: { limit?: number }) {
  const qc = useQueryClient();

  /* -------- fetch data -------- */
  const { data, isLoading, isError } = useQuery<TopSellingMap>({
    queryKey: ["top-selling", limit],
    queryFn: () => getTopSelling(limit),
    staleTime: 60_000,
  });

  /* -------- categories -------- */
  const categories = useMemo<string[]>(
    () => (data && typeof data === "object" ? Object.keys(data) : []),
    [data],
  );

  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCat && categories.length > 0) {
      const first = categories[0] ?? null;
      setActiveCat(first);
    }
  }, [categories, activeCat]);

  /* -------- list theo category -------- */
  const list = useMemo<ResBookTopWithTrendDTO[]>(() => {
    if (!activeCat) return [];
    const arr = (data?.[activeCat] as ResBookTopWithTrendDTO[]) ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [activeCat, data]);

  /* -------- hover id -------- */
  const [hoverId, setHoverId] = useState<number | null>(null);

  // auto chọn rank #1 khi đổi tab
  useEffect(() => {
    if (list.length > 0 && hoverId == null) {
      const first = list[0];
      if (first) setHoverId(first.bookId);
    }
  }, [list, hoverId]);

  // prefetch detail
  useEffect(() => {
    if (hoverId != null) {
      void qc.prefetchQuery({
        queryKey: ["book-detail", hoverId],
        queryFn: () => getBookDetailById(hoverId),
        staleTime: 120_000,
      });
    }
  }, [hoverId, qc]);

  // fetch detail
  const { data: detail } = useQuery<ResBookDetailDTO | null>({
    queryKey: ["book-detail", hoverId],
    queryFn: () => (hoverId ? getBookDetailById(hoverId) : Promise.resolve(null)),
    enabled: hoverId != null,
    staleTime: 120_000,
  });

  /* -------- loading / error -------- */
  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-white/50 p-6 shadow-sm ring-1 ring-black/5">
        Đang tải bảng xếp hạng…
      </div>
    );
  }

  if (isError || !data || categories.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-white/50 p-6 shadow-sm ring-1 ring-rose-200">
        Không có dữ liệu bảng xếp hạng.
      </div>
    );
  }

  /* -------- render -------- */
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCat(cat);
              setHoverId(null);
            }}
            className={cls(
              "rounded-full px-3 py-1.5 text-sm transition-all md:text-base",
              activeCat === cat
                ? "bg-slate-900 text-white shadow"
                : "bg-white ring-1 ring-slate-200 hover:bg-slate-100",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
        {/* Left: rank list */}
        <div className="md:col-span-5 lg:col-span-4">
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {list.map((b) => {
              const active = hoverId === b.bookId;
              return (
                <li
                  key={b.bookId}
                  onMouseEnter={() => setHoverId(b.bookId)}
                  onFocus={() => setHoverId(b.bookId)}
                  onClick={() => setHoverId(b.bookId)}
                  className={cls(
                    "flex cursor-pointer items-center gap-3 p-3 transition-colors",
                    active ? "bg-slate-50" : "hover:bg-slate-50",
                  )}
                >
                  {/* Rank + arrow + pct */}
                  <RankCell rank={b.rank} growth={b.growthPercent} />

                  {/* thumb */}
                  <div className="h-14 min-h-14 w-10 min-w-10 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-slate-100" />
                    )}
                  </div>

                  {/* text */}
                  <div className="flex-1">
                    <div className="line-clamp-1 font-medium text-slate-900">{b.title}</div>
                    <div className="line-clamp-1 text-sm text-slate-600">{b.authorNames}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>Tuần này: {nf.format(b.sold)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: preview */}
        <div className="md:col-span-7 lg:col-span-8">
          <AnimatePresence mode="wait">
            {detail && (
              <motion.div
                key={detail.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-12 md:p-6"
              >
                {/* image */}
                <div className="sm:col-span-4 md:col-span-4 lg:col-span-3">
                  <div className="aspect-[3/4] overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <img
                      src={
                        detail.images?.find((i) => i.sortOrder === 0)?.url ??
                        detail.cover ??
                        detail.thumbnail ??
                        detail.imageUrl ??
                        ""
                      }
                      alt={detail.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                {/* text */}
                <div className="flex flex-col sm:col-span-8 md:col-span-8 lg:col-span-9">
                  <h3 className="text-lg font-semibold text-slate-900 md:text-xl">
                    {detail.title}
                  </h3>
                  <div className="text-slate-600">
                    {detail.authors?.length
                      ? detail.authors.map((a) => a.name).join(", ")
                      : list.find((x) => x.bookId === detail.id)?.authorNames}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {priceOf(detail) != null && (
                      <div className="text-xl font-bold">{nfVnd.format(priceOf(detail)!)}</div>
                    )}
                    <TrendBadge
                      growth={list.find((x) => x.bookId === detail.id)?.growthPercent ?? 0}
                      big
                    />
                    <div className="text-sm text-slate-500">
                      Tuần trước:{" "}
                      {nf.format(list.find((x) => x.bookId === detail.id)?.lastWeekSold ?? 0)}
                    </div>
                  </div>

                  <div
                    className="prose prose-sm prose-p:my-1 prose-p:text-slate-700 mt-3 line-clamp-6 max-w-none text-sm text-slate-700 md:text-base"
                    dangerouslySetInnerHTML={{
                      __html:
                        detail.description && detail.description.trim().startsWith("<")
                          ? detail.description
                          : `<p>${detail.description || "Chưa có mô tả."}</p>`,
                    }}
                  />

                  <div className="mt-4">
                    <Link
                      to={detail.slug ? `/books/${detail.slug}` : `/books/id/${detail.id}`}
                      className="rounded-xl bg-rose-500/90 px-5 py-2.5 font-semibold text-white shadow hover:brightness-110 cursor-pointer"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
