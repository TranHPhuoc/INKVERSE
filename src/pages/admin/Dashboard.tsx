// src/pages/admin/DashboardPage.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeaderKpis from "../../components/dashboard/HeaderKpi";
import RevenueArea from "../../components/dashboard/RevenueArea";
import TopProducts from "../../components/dashboard/TopProducts";
import CategoryBar from "../../components/dashboard/CategoryBar";
import {
  getRevenueDaily,
  getTopBooks,
  getCategorySales,
} from "../../services/admin/metrics";

function fmtMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseMonthStr(mm: string): { y: number; m: number } {
  const [ys, ms] = (mm ?? "").split("-") as [string, string];
  const y = Number(ys), m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    const now = new Date(); return { y: now.getFullYear(), m: now.getMonth() + 1 };
  }
  return { y, m };
}
function isCurrentMonth(mm: string) { return mm === fmtMonth(); }

function toOffsetString(
  y: number, m: number, d: number,
  hh = 0, mi = 0, ss = 0,
  offsetMinutes = 7 * 60 // VN = +07:00
) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mi)}:${pad(ss)}${sign}${oh}:${om}`;
}

function nextMonth(y: number, m: number) {
  return m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
}

function rangeForMonth(mm: string) {
  const { y, m } = parseMonthStr(mm);
  const from = toOffsetString(y, m, 1, 0, 0, 0, 7 * 60);
  const { y: ny, m: nm } = nextMonth(y, m);
  const to = isCurrentMonth(mm)
    ? new Date().toISOString()
    : toOffsetString(ny, nm, 1, 0, 0, 0, 7 * 60);
  return { from, to };
}

function prevMonth(mm: string) {
  const { y, m } = parseMonthStr(mm);
  const d = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  return `${d.y}-${String(d.m).padStart(2, "0")}`;
}


/* ================= Page ================= */
export default function DashboardPage() {
  const defaultMonth = fmtMonth();
  const [month, setMonth] = useState(defaultMonth);

  const r = useMemo(() => rangeForMonth(month), [month]);
  const prev = useMemo(() => rangeForMonth(prevMonth(month)), [month]);

  /* ----- Queries for charts/tables ----- */
  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["admin:sales-by-day", r.from, r.to],
    queryFn: () => getRevenueDaily({ from: r.from, to: r.to }),
  });

  const { data: top, isLoading: loadingTop } = useQuery({
    queryKey: ["admin:top-books", r.from, r.to],
    queryFn: () => getTopBooks({ from: r.from, to: r.to, metric: "sold", limit: 10 }),
  });

  const { data: cats, isLoading: loadingCats } = useQuery({
    queryKey: ["admin:category-sales", r.from, r.to],
    queryFn: () => getCategorySales({ from: r.from, to: r.to, limit: 10 }),
  });

  return (
    <div className="mx-auto w-full max-w-none px-6 py-4">
      {/* Title + Month Picker */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm text-gray-500">Chọn tháng</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* KPI header — nhận from/to của tháng hiện tại + tháng trước để so sánh */}
      <HeaderKpis from={r.from} to={r.to} prevFrom={prev.from} prevTo={prev.to} />

      {/* Charts + Top10 */}
      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-3 items-stretch">
        <div className="2xl:col-span-2 h-full">
          <RevenueArea data={sales} loading={loadingSales} />
        </div>
        <div className="h-full">
          <TopProducts items={top} loading={loadingTop} />
        </div>
      </div>

      <div className="mt-6">
        <CategoryBar data={cats} loading={loadingCats} />
      </div>
    </div>
  );
}
