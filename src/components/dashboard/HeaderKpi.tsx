// src/components/dashboard/HeaderKpis.tsx
import { useQuery } from "@tanstack/react-query";
import { getKpi, getRevenueDaily, type ResAdminRevenuePointDTO } from "../../services/admin/metrics";
import KpiCard from "./KpiCard";
import { DollarSign, CheckCircle2, Percent, ShoppingBag, Receipt } from "lucide-react";

/* ===== helpers ===== */
function pctDelta(oldV?: number, newV?: number) {
  if (oldV == null || !isFinite(oldV) || oldV === 0 || newV == null) return null;
  return ((newV - oldV) / Math.abs(oldV)) * 100;
}
function labelFrom(from?: string): string {
  if (!from) return "";
  const d = new Date(from);
  const month = d.toLocaleString("vi-VN", { month: "long" });
  return `So với ${month} ${d.getFullYear()}`;
}
function calcTrendPct(data: Array<{ y: number }>, k = 2): number | undefined {
  if (!Array.isArray(data) || data.length < 2) return undefined;
  const n = data.length;
  const take = Math.min(k, Math.floor(n / 2));
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / (arr.length || 1);
  const head = avg(data.slice(0, take).map((d) => Number(d.y || 0)));
  const tail = avg(data.slice(n - take).map((d) => Number(d.y || 0)));
  if (!isFinite(head) || head === 0) return undefined;
  return ((tail - head) / Math.abs(head)) * 100;
}
function withProp<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Partial<Record<K, V>>);
}

function toDayLabel(day: string): string {
  if (!day || day.length < 10) return day;
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

type Props = { from: string; to: string; prevFrom: string; prevTo: string };

export default function HeaderKpis({ from, to, prevFrom, prevTo }: Props) {
  const { data: cur } = useQuery({
    queryKey: ["kpi", from, to],
    queryFn: () => getKpi({ from, to }),
  });

  const { data: prev } = useQuery({
    queryKey: ["kpi-prev", prevFrom, prevTo],
    queryFn: () => getKpi({ from: prevFrom, to: prevTo }),
  });

  const { data: daily } = useQuery({
    queryKey: ["daily", from, to],
    queryFn: () => getRevenueDaily({ from, to }),
  });

  const ds: ResAdminRevenuePointDTO[] = Array.isArray(daily) ? daily : [];

  const revSpark = ds.map((d) => ({
    x: toDayLabel(d.day),
    y: Number(d.revenue ?? 0),
  }));
  const orderSpark = ds.map((d) => ({
    x: toDayLabel(d.day),
    y: Number(d.orders ?? 0),
  }));

  const k = {
    revenue: cur?.revenue ?? 0,
    orders: cur?.orders ?? 0,
    orderValue: cur?.orderValue ?? 0,
    conversionRate: cur?.conversionRate ?? 0,
    totalOrders: cur?.totalOrders ?? 0,
  };
  const p = {
    revenue: prev?.revenue ?? 0,
    orders: prev?.orders ?? 0,
    orderValue: prev?.orderValue ?? 0,
    conversionRate: prev?.conversionRate ?? 0,
    totalOrders: prev?.totalOrders ?? 0,
  };

  const compareLabel = labelFrom(prevFrom);

  // MoM deltas
  const dRevenue = pctDelta(p.revenue, k.revenue) ?? undefined;
  const dOrders = pctDelta(p.orders, k.orders) ?? undefined;
  const dOrderValue = pctDelta(p.orderValue, k.orderValue) ?? undefined;
  const dConversionRate = pctDelta(p.conversionRate, k.conversionRate) ?? undefined;
  const dTotalOrders = pctDelta(p.totalOrders, k.totalOrders) ?? undefined;

  // Net-trend
  const tRevenue = calcTrendPct(revSpark);
  const tOrders = calcTrendPct(orderSpark);
  const tOrderValue = (() => {
    const val = ds.map((d) => {
      const rev = Number(d.revenue ?? 0);
      const od = Number(d.orders ?? 0);
      return { x: "", y: od > 0 ? rev / od : 0 };
    });
    return calcTrendPct(val);
  })();
  const tTotal = calcTrendPct(orderSpark);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-5">
      <KpiCard
        title="Doanh thu"
        value={k.revenue}
        format="currency"
        compareLabel={compareLabel}
        {...withProp("deltaPct", dRevenue)}
        {...withProp("trendPct", tRevenue)}
        sparkline={revSpark}
        icon={<DollarSign />}
        tone="fuchsia"
      />
      <KpiCard
        title="Số đơn"
        value={k.orders}
        format="number"
        compareLabel={compareLabel}
        {...withProp("deltaPct", dOrders)}
        {...withProp("trendPct", tOrders)}
        sparkline={orderSpark}
        icon={<CheckCircle2 />}
        tone="orange"
      />
      <KpiCard
        title="Giá trị đơn TB"
        value={k.orderValue}
        format="currency"
        compareLabel={compareLabel}
        {...withProp("deltaPct", dOrderValue)}
        {...withProp("trendPct", tOrderValue)}
        sparkline={revSpark}
        icon={<Receipt />}
        tone="sky"
      />
      <KpiCard
        title="Tỷ lệ chuyển đổi"
        value={k.conversionRate}
        format="percent"
        compareLabel={compareLabel}
        {...withProp("deltaPct", dConversionRate)}
        {...withProp("trendPct", tOrders)}
        sparkline={orderSpark}
        icon={<Percent />}
        tone="emerald"
      />
      <KpiCard
        title="Tổng số đơn"
        value={k.totalOrders}
        format="number"
        compareLabel={compareLabel}
        {...withProp("deltaPct", dTotalOrders)}
        {...withProp("trendPct", tTotal)}
        sparkline={orderSpark}
        icon={<ShoppingBag />}
        tone="indigo"
      />
    </div>
  );
}
