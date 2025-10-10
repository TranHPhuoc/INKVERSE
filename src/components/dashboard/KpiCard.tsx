import { memo, useEffect, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

/* ========= Number formatters ========= */
const nfNumber = new Intl.NumberFormat("vi-VN");
const nfCurrency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const nfPercent = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 2,
});

function formatValue(v: number, mode: "number" | "currency" | "percent") {
  if (mode === "currency") return nfCurrency.format(v || 0);
  if (mode === "percent") return nfPercent.format((v || 0) / 100); // input = 0..100
  return nfNumber.format(v || 0);
}

/* ========= Theme tones ========= */
type Tone = "indigo" | "sky" | "orange" | "fuchsia" | "emerald" | "rose";
const TONE: Record<Tone, { bg: string; fg: string; ring: string; stroke: string }> = {
  indigo: {
    bg: "bg-indigo-500",
    fg: "text-white",
    ring: "ring-indigo-100",
    stroke: "stroke-indigo-500",
  },
  sky: { bg: "bg-sky-500", fg: "text-white", ring: "ring-sky-100", stroke: "stroke-sky-500" },
  orange: {
    bg: "bg-orange-500",
    fg: "text-white",
    ring: "ring-orange-100",
    stroke: "stroke-orange-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-500",
    fg: "text-white",
    ring: "ring-fuchsia-100",
    stroke: "stroke-fuchsia-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    fg: "text-white",
    ring: "ring-emerald-100",
    stroke: "stroke-emerald-500",
  },
  rose: { bg: "bg-rose-500", fg: "text-white", ring: "ring-rose-100", stroke: "stroke-rose-500" },
};

/* ========= Types ========= */
export type SparkPoint = { x: string; y: number };

type KpiCardProps = {
  title: string;
  value: number;
  format: "number" | "currency" | "percent";
  compareLabel: string;
  deltaPct?: number;
  trendPct?: number;
  icon: React.ReactNode;
  tone?: Tone;
  loading?: boolean;
  sparkline?: SparkPoint[];
};

/* ========= Path helper (Catmull–Rom) ========= */
function toSmoothPath(points: { x: number; y: number }[], tension = 1): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  const segs: string[] = [`M ${points[0]!.x} ${points[0]!.y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = (points[i - 1] ?? points[i])!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = (points[i + 2] ?? points[i + 1])!;

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    segs.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`);
  }
  return segs.join(" ");
}

/* ========= Sparkline ========= */
type SparklineProps = { data: SparkPoint[]; tone?: Tone; trendPct?: number };
function withProp<K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> {
  return value === undefined ? {} : ({ [key]: value } as Partial<Record<K, V>>);
}

function Sparkline({ data, tone = "indigo", trendPct }: SparklineProps) {
  const w = 260,
    h = 40,
    pad = 4;

  const strokeClass =
    typeof trendPct === "number"
      ? trendPct >= 0
        ? "stroke-emerald-500"
        : "stroke-rose-500"
      : TONE[tone].stroke;

  const { path, end } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { path: "", end: null as { x: number; y: number } | null };
    }

    const ys = data.map((d) => Number(d.y ?? 0));
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const span = max - min || 1;

    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
    const yScale = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);

    const pts = data.map((d, i) => ({ x: pad + i * stepX, y: yScale(d.y) }));
    return { path: toSmoothPath(pts, 1), end: pts[pts.length - 1] };
  }, [data]);

  if (!path) return null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" role="img" aria-label="Biểu đồ xu hướng">
      <motion.path
        d={path}
        className={strokeClass}
        fill="none"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {end && <circle cx={end.x} cy={end.y} r="3" className={strokeClass} fill="currentColor" />}
    </svg>
  );
}

/* ========= KPI Card ========= */
function KpiCardBase({
  title,
  value,
  format,
  compareLabel,
  deltaPct, // MoM
  trendPct, // Xu hướng nội tháng
  icon,
  tone = "indigo",
  loading,
  sparkline,
}: KpiCardProps) {
  // animated number
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  useEffect(() => {
    spring.set(value || 0);
  }, [value, spring]);

  const shown = useTransform(spring, (v) =>
    formatValue(format === "percent" ? v : Math.round(v), format),
  );

  const hasTrend = typeof trendPct === "number" && !Number.isNaN(trendPct);
  const hasDelta = typeof deltaPct === "number" && !Number.isNaN(deltaPct) && isFinite(deltaPct);
  const isDeltaInf = deltaPct === Infinity;

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white/90 px-4 py-3 shadow-sm ring-1 ${TONE[tone].ring}`}
      role="group"
      aria-label={title}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>

          <motion.p
            className="text-2xl font-semibold tracking-tight text-slate-900"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
          >
            {loading ? "—" : <motion.span>{shown}</motion.span>}
          </motion.p>

          {/* Nhãn “so với …” */}
          <p className="mt-0.5 text-xs text-slate-500">{compareLabel}</p>

          {/* MoM */}
          {isDeltaInf && (
            <p className="text-[11px] text-emerald-600">Tăng mạnh (từ 0)</p>
          )}
          {hasDelta && (
            <p
              className={`text-[11px] ${
                (deltaPct ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {compareLabel} {(deltaPct ?? 0) >= 0 ? "tăng" : "giảm"}{" "}
              {nfPercent.format(Math.abs(deltaPct ?? 0) / 100)}
            </p>
          )}
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE[tone].bg} ${TONE[tone].fg} shadow-md`}
          aria-hidden
        >
          {icon}
        </div>
      </div>

      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} tone={tone} {...withProp("trendPct", trendPct)} />
      )}

      {/* subtle blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-slate-100/40 blur-2xl"
      />
    </div>
  );
}

export default memo(KpiCardBase);
