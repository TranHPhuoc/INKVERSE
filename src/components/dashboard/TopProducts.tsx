import type { ResAdminTopBookDTO } from "../../services/admin/metrics";

const nf = new Intl.NumberFormat("vi-VN");

type Props = {
  items?: ResAdminTopBookDTO[] | null | unknown;
  loading?: boolean | undefined;
};

export default function TopProducts({ items, loading }: Props) {
  const list: ResAdminTopBookDTO[] = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-2xl bg-[#1e2240] p-5 text-white shadow-inner">
      {/* Header */}
      <div className="mb-3 grid grid-cols-[1.2fr_0.4fr_0.4fr] items-center border-b border-white/10 pb-2 text-[13px] font-semibold uppercase tracking-wide text-white/80">
        <span>Top 10 sản phẩm bán chạy</span>
        <span className="text-center">Đã bán</span>
        <span className="text-right">Doanh thu</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1.2fr_0.4fr_0.4fr] items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-white/20 animate-pulse" />
                <div className="h-3 w-40 rounded bg-white/20 animate-pulse" />
              </div>
              <div className="h-3 w-8 rounded bg-white/20 justify-self-center animate-pulse" />
              <div className="h-3 w-16 rounded bg-white/20 justify-self-end animate-pulse" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="py-8 text-center text-white/60">
          Chưa có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {list.map((p) => (
            <div
              key={p.bookId}
              className="grid grid-cols-[1.2fr_0.4fr_0.4fr] items-center gap-3 py-2 hover:bg-white/5 transition-colors"
            >
              {/* Cột 1 */}
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 overflow-hidden rounded bg-white/20 flex-shrink-0">
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="text-sm truncate">{p.title}</p>
              </div>

              {/* Cột 2 + 3 */}
              <span className="text-sm text-center">{p.sold}</span>
              <span className="text-sm text-right font-medium">
                {nf.format(p.revenue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
