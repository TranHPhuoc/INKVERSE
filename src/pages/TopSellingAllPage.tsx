import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  getTopSelling,
  getBookDetailById,
  type ResBookDetailDTO,
  type ResBookTopWithTrendDTO,
  type TopSellingMap,
} from "../services/bookTop";

/* ===== helpers ===== */
const nf = new Intl.NumberFormat("vi-VN");
const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

/* small parts */
function Arrow({ dir }: { dir: "up" | "down" | "flat" }) {
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
        <path d="M3 17 L9 10 L14 14 L20 6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

function Rank({ rank, growth }: { rank: number; growth: number }) {
  const up = growth > 0;
  const flat = growth === 0 || !isFinite(growth);
  const dir: "up" | "down" | "flat" = flat ? "flat" : up ? "up" : "down";
  const color =
    rank === 1 ? "text-emerald-600" : rank === 2 ? "text-sky-600" : rank === 3 ? "text-indigo-600" : "text-slate-500";
  return (
    <div className="flex w-11 flex-col items-center justify-center">
      {/* KHÔNG padStart -> hiển thị 1,2,3… */}
      <div className={cx("text-sm font-semibold", color)}>{String(rank)}</div>
      <div className="mt-1"><Arrow dir={dir} /></div>
      <div
        className={cx(
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

/* ===== page (LEFT LIST ONLY) ===== */
export default function TopSellingAllPage() {
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery<TopSellingMap>({
    queryKey: ["top-selling", 50],
    queryFn: () => getTopSelling(50),
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


  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!active && categories.length) setActive(categories[0] ?? null);
  }, [categories, active]);

  const list = useMemo<ResBookTopWithTrendDTO[]>(() => {
    if (!active) return [];
    const arr = (data?.[active] as ResBookTopWithTrendDTO[]) ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [active, data]);

  // Prefetch nhẹ khi hover item (để có slug), không render gì bên phải cả
  const prefetchDetail = (id: number) =>
    qc.prefetchQuery({ queryKey: ["book-detail", id], queryFn: () => getBookDetailById(id), staleTime: 120_000 });

  // Điều hướng: ưu tiên slug nếu đã có cache
  const goDetail = (id: number) => {
    const cached = qc.getQueryData<ResBookDetailDTO>(["book-detail", id]);
    const slug = cached?.slug;
    nav(slug ? `/books/${slug}` : `/books/id/${id}`);
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-slate-600">
        <div className="animate-pulse rounded-2xl bg-white/70 px-4 py-2 shadow">Đang tải…</div>
      </div>
    );
  }
  if (isError || !data || !categories.length) {
    return <div className="mx-auto max-w-6xl p-6 text-rose-600">Không có dữ liệu bảng xếp hạng.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50/40 to-white">
      {/* HEADER nền đen */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 py-6 shadow-sm">
        <h1 className="text-center text-2xl font-bold tracking-wide text-white md:text-3xl">
          BẢNG XẾP HẠNG BÁN CHẠY THEO TUẦN
        </h1>
      </div>

      <div className="mx-auto max-w-[1550px] px-4 py-8 md:px-6">
        {/* Tabs */}
        <div className="relative mb-4">
          <div className="flex flex-wrap gap-5">
            {categories.map((cat) => {
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={cx(
                    "relative cursor-pointer select-none px-1.5 pb-2 text-sm font-medium transition-colors md:text-base",
                    isActive ? "text-rose-600" : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {cat}
                  {isActive && (
                    <motion.span
                      layoutId="tsa-underline"
                      className="absolute left-0 right-0 -bottom-[2px] h-[3px] rounded-full bg-rose-500"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent" />
        </div>

        {/* LEFT LIST */}
        <div className="md:max-w-[950px]">
          <ul className="space-y-3">
            {list.map((b) => (
              <li
                key={b.bookId}
                onMouseEnter={() => prefetchDetail(b.bookId)}
                onClick={() => goDetail(b.bookId)}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white/90 p-4 backdrop-blur transition hover:bg-white hover:shadow-md"
                title="Xem chi tiết"
              >
                <Rank rank={b.rank} growth={b.growthPercent} />
                <div className="h-24 w-18 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200/60">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-slate-100" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="text-lg font-semibold text-slate-900 line-clamp-1">{b.title}</div>
                  <div className="text-base text-slate-600 line-clamp-1">{b.authorNames}</div>
                  <div className="mt-1 text-sm text-slate-500">Tuần này: {nf.format(b.sold)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
