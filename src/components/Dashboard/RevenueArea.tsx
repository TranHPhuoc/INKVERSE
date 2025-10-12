// src/components/Dashboard/RevenueArea.tsx
import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { ResAdminRevenuePointDTO } from "../../services/admin/metrics";

const nf = new Intl.NumberFormat("vi-VN");

type Props = {
  data?: ResAdminRevenuePointDTO[] | null | unknown;
  loading?: boolean | undefined;
};

function toDayLabel(day: string): string {
  if (!day || day.length < 10) return day;
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

function calcYAxisWidth(maxValue: number): number {
  const sample = nf.format(Math.max(0, maxValue));
  const w = sample.length * 9 + 14;
  return Math.max(56, Math.min(120, w));
}


export default function RevenueArea({ data, loading }: Props) {
  const list: ResAdminRevenuePointDTO[] = Array.isArray(data) ? (data as ResAdminRevenuePointDTO[]) : [];
  const chartData = list.map((d) => ({ day: toDayLabel(d.day), revenue: Number(d.revenue ?? 0) }));

  const maxRevenue = chartData.reduce((m, x) => (x.revenue > m ? x.revenue : m), 0);
  const yAxisWidth = calcYAxisWidth(maxRevenue);

  return (
    <div className="h-[630px] rounded-3xl bg-[#1e2240] p-6 text-white shadow-inner ring-1 ring-white/10 flex flex-col">
      <p className="mb-4 text-[13px] font-semibold tracking-wide text-white/80">
        DOANH THU THEO NGÀY
      </p>

      {loading ? (
        <div className="flex-1 animate-pulse rounded-2xl bg-white/10" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/60">
          Chưa có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 12, bottom: 0 }}>
              <CartesianGrid strokeOpacity={0.15} />
              <XAxis
                dataKey="day"
                interval="preserveStartEnd"
                minTickGap={20}
                tick={{ fill: "rgba(255,255,255,.7)", fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                width={yAxisWidth}
                tickFormatter={(v: number) => nf.format(v)}
                tick={{ fill: "rgba(255,255,255,.7)", fontSize: 12 }}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(v: number) => `${nf.format(Number(v))} ₫`}
                contentStyle={{
                  backgroundColor: "rgba(30,34,64,.95)",
                  borderRadius: 10,
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#38bdf8"
                fill="rgba(56,189,248,0.25)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
