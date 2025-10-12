import type { ResAdminTopBookDTO } from "../../services/admin/metrics";

const nf = new Intl.NumberFormat("vi-VN");

type Props = {
  items?: ResAdminTopBookDTO[] | null | unknown;
  loading?: boolean | undefined;
};


export default function TopProducts({ items, loading }: Props) {
  const list: ResAdminTopBookDTO[] = Array.isArray(items) ? items : [];

  return (
    // h-full + flex-col, phần danh sách flex-1 để chiều cao khớp với RevenueArea
    <div className="h-full rounded-2xl bg-[#1e2240] p-6 text-white shadow-inner flex flex-col">
      <div className="mb-4 grid grid-cols-[1.4fr_0.35fr_0.35fr] items-center border-b border-white/10 pb-2 text-[13px] font-semibold uppercase tracking-wide text-white/80">
        <span>Top 10 sản phẩm bán chạy</span>
        <span className="text-center">Đã bán</span>
        <span className="text-right">Doanh thu</span>
      </div>

      {loading ? (
        <div className="flex-1 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1.4fr_0.35fr_0.35fr] items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-white/20 animate-pulse" />
                <div className="h-3 w-60 rounded bg-white/20 animate-pulse" />
              </div>
              <div className="h-3 w-10 rounded bg-white/20 justify-self-center animate-pulse" />
              <div className="h-3 w-20 rounded bg-white/20 justify-self-end animate-pulse" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-white/60">
          Chưa có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        // flex-1 + overflow-auto nếu danh sách dài
        <div className="flex-1 divide-y divide-white/10 overflow-auto">
          {list.map((p) => (
            <div
              key={p.bookId}
              className="grid grid-cols-[1.4fr_0.35fr_0.35fr] items-center gap-3 py-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 overflow-hidden rounded bg-white/20 shrink-0">
                  {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="h-full w-full object-cover" /> : null}
                </div>
                <p className="text-sm whitespace-normal break-words leading-snug">{p.title}</p>
              </div>
              <span className="text-sm text-center">{p.sold}</span>
              <span className="text-sm text-right font-medium">{nf.format(p.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
