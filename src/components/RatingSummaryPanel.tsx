import { useEffect, useState } from "react";
import { getRatingSummary, type ResRatingSummary } from "../services/rating";

export default function RatingSummaryPanel({ bookId }: { bookId: number }) {
  const [sum, setSum] = useState<ResRatingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    getRatingSummary(bookId)
      .then((s) => alive && setSum(s))
      .catch(() => alive && setErr("Không tải được tóm tắt đánh giá"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [bookId]);

  const avg = Number(sum?.average ?? 0);
  const safeAvg = Number.isFinite(avg) ? avg : 0;
  const total = Number(sum?.count ?? 0);

  const getPct = (star: number) => {
    const fromPercent = sum?.percent?.[star];
    if (fromPercent != null) return Math.max(0, Math.min(100, Number(fromPercent) || 0));
    if (!total) return 0;
    const cnt = Number(sum?.distribution?.[star] ?? 0);
    return Math.round((cnt * 100) / total);
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      {loading && <div className="text-sm text-gray-500">Đang tải…</div>}
      {err && <div className="text-sm text-rose-600">{err}</div>}

      <div className="flex items-end gap-3">
        <div className="text-3xl font-semibold">{safeAvg.toFixed(1)}/5</div>
        <div className="text-sm text-gray-600">({total} đánh giá)</div>
      </div>

      <div className="mt-4 grid gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const pct = getPct(star);
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-10 text-sm text-gray-600">{star} sao</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right text-sm text-gray-600">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
