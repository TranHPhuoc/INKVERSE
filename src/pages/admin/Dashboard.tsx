// src/pages/admin/DashboardPage.tsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import HeaderKpis from "../../components/dashboard/HeaderKpi";
import RevenueArea from "../../components/dashboard/RevenueArea";
import TopProducts from "../../components/dashboard/TopProducts";
import CategoryBar from "../../components/dashboard/CategoryBar";
import { getRevenueDaily, getTopBooks, getCategorySales } from "../../services/admin/metrics";

/* ===== Date helpers ===== */
function toIsoNoMs(d: Date) {
  return d.toISOString().split(".")[0] + "Z";
}
function rangeNDays(n: number) {
  const to = new Date();
  const from = new Date(to); from.setDate(to.getDate() - (n - 1));
  const prevTo = new Date(from.getTime() - 1_000);
  const prevFrom = new Date(prevTo); prevFrom.setDate(prevTo.getDate() - (n - 1));
  return {
    from: toIsoNoMs(from),
    to: toIsoNoMs(to),
    prevFrom: toIsoNoMs(prevFrom),
    prevTo: toIsoNoMs(prevTo),
  };
}

export default function DashboardPage() {
  const r = useMemo(() => rangeNDays(7), []);

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["sales", r.from, r.to],
    queryFn: () => getRevenueDaily({ from: r.from, to: r.to }),
  });

  const { data: top, isLoading: loadingTop } = useQuery({
    queryKey: ["top", r.from, r.to],
    queryFn: () => getTopBooks({ from: r.from, to: r.to, metric: "sold", limit: 10 }),
  });

  const { data: cats, isLoading: loadingCats } = useQuery({
    queryKey: ["cats", r.from, r.to],
    queryFn: () => getCategorySales({ from: r.from, to: r.to, limit: 10 }),
  });

  return (
    <div className="mx-auto w-full max-w-[1550px] p-4">
      <HeaderKpis from={r.from} to={r.to} prevFrom={r.prevFrom} prevTo={r.prevTo} />

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueArea data={sales} loading={loadingSales} />
        </div>
        <TopProducts items={top} loading={loadingTop} />
      </div>

      <div className="mt-6">
        <CategoryBar data={cats} loading={loadingCats} />
      </div>
    </div>
  );
}
