import {
  AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer,
} from "recharts";
import type { ResAdminRevenuePointDTO } from "../../services/admin/metrics";

const nf = new Intl.NumberFormat("vi-VN");

type Props = {
  data?: ResAdminRevenuePointDTO[] | null | unknown;
  loading?: boolean | undefined;
};

export default function RevenueArea({ data, loading }: Props) {
  const list: ResAdminRevenuePointDTO[] = Array.isArray(data) ? data : [];
  const chartData = list.map((d) => ({
    day: new Date(d.day).toLocaleDateString("en-GB"),
    revenue: Number(d.revenue ?? 0),
  }));

  return (
    <div className="rounded-3xl bg-[#1e2240] p-5 text-white shadow-inner ring-1 ring-white/10">
      <p className="mb-4 text-[13px] font-semibold tracking-wide text-white/80">
        DOANH THU THEO NGÀY
      </p>

      {loading ? (
        <div className="h-72 w-full animate-pulse rounded-2xl bg-white/10" />
      ) : chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-white/60">
          Chưa có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <CartesianGrid strokeOpacity={0.15} />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,.7)" }} tickMargin={8} />
              <YAxis tickFormatter={(v: number) => nf.format(v)} tick={{ fill: "rgba(255,255,255,.7)" }} />
              <Tooltip
                formatter={(v: number) => `${nf.format(v)} ₫`}
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
