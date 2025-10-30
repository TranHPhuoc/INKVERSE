import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

/* ---------- Format helpers (KHÔNG any) ---------- */
/* eslint-disable react-refresh/only-export-components */
export function formatInt(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  return Number.isFinite(v) ? new Intl.NumberFormat("vi-VN").format(v) : String(n);
}

export function formatAmount(v: number | string): string {
  const num = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(num) ? new Intl.NumberFormat("vi-VN").format(num) : String(v);
}

export function formatDT(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN");
}

/* ---------- UI bits ---------- */
export function TypeBadge({
                            type,
                          }: {
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT";
}): ReactElement {
  const colorMap: Record<string, string> = {
    INBOUND: "bg-emerald-100 text-emerald-700 border-emerald-200",
    OUTBOUND: "bg-sky-100 text-sky-700 border-sky-200",
    ADJUSTMENT: "bg-amber-100 text-amber-800 border-amber-200",
  };
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[12px] font-medium", colorMap[type])}
    >
      {type}
    </Badge>
  );
}

export function PageHeader({
                             title,
                             subtitle,
                             right,
                           }: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}): ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ children }: { children?: React.ReactNode }): ReactElement {
  return <div className="py-12 text-center text-muted-foreground">{children ?? "Không có dữ liệu"}</div>;
}