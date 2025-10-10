// src/pages/admin/DashboardPage.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeaderKpis from "../../components/dashboard/HeaderKpi";
import RevenueArea from "../../components/dashboard/RevenueArea";
import TopProducts from "../../components/dashboard/TopProducts";
import CategoryBar from "../../components/dashboard/CategoryBar";
import { getRevenueDaily, getTopBooks, getCategorySales } from "../../services/admin/metrics";

import {
  fmtMonthLocal,
  parseMonthStr,
  monthRangeVNInclusive,
  prevMonthRangeVNInclusive,
} from "../../utils/date-helpers";

/* ================= Page ================= */
export default function Dashboard() {
  const [month, setMonth] = useState<string>(() => fmtMonthLocal());

  // khoảng tháng hiện tại (đầu tháng -> cuối tháng 23:59:59, offset +07:00)
  const r = useMemo(() => {
    const { y, m } = parseMonthStr(month);
    return monthRangeVNInclusive(y, m);
  }, [month]);

  // khoảng tháng trước (đầu → cuối tháng)
  const prev = useMemo(() => {
    const { y, m } = parseMonthStr(month);
    return prevMonthRangeVNInclusive(y, m);
  }, [month]);

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

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm text-gray-500">Chọn tháng</label>
          <input
            type="month"
            lang="vi"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* KPI header */}
      <HeaderKpis from={r.from} to={r.to} prevFrom={prev.from} prevTo={prev.to} />

      {/* Charts + Top10 */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-6 2xl:grid-cols-3">
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
