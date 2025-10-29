// src/components/ProductCard.tsx
import { Link } from "react-router-dom";
import { PLACEHOLDER, resolveThumb } from "../types/img";
import type { BookListItem } from "../types/books";

type Props = {
  item: BookListItem;
  catSlug?: string;
};

const isNewWithin = (d?: string | null, days = 14) => {
  if (!d) return false;
  const created = new Date(d);
  if (Number.isNaN(created.getTime())) return false;
  return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24) <= days;
};

export default function ProductCard({ item, catSlug }: Props) {
  const price = item.effectivePrice ?? item.price;
  const hasSale = item.salePrice != null && item.salePrice < item.price;
  const percent =
    hasSale && item.price > 0 ? Math.max(0, Math.round(100 - (price / item.price) * 100)) : 0;

  const href = catSlug ? `/danh-muc/${catSlug}/${item.slug}` : `/books/${item.slug}`;
  const imgSrc = resolveThumb(item.thumbnail);
  const showNew = isNewWithin(item.createdAt);

  return (
    <Link
      to={href}
      className="group flex h-full flex-col rounded-xl p-2 md:p-3 transition hover:shadow-md"
      aria-label={item.title}
      title={item.title}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-50">
        <img
          src={imgSrc}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
          }}
        />

        {showNew && (
          <span className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-1 text-[10px] md:text-[11px] font-semiboldtext-white shadow">
            New
          </span>
        )}

        {hasSale && (
          <span className="absolute top-2 right-0 rounded-l-md bg-rose-600 px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-bold text-white shadow">
            -{percent}%
          </span>
        )}
      </div>

      <div className="mt-2 line-clamp-2 min-h-[2.25rem] md:min-h-[2.5rem] text-[13px] md:text-sm leading-5 font-medium text-gray-900">
        {item.title}
      </div>

      <div className="mt-auto pt-2">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-rose-600 text-[13.5px] md:text-base">{Number(price).toLocaleString()} ₫</span>
          {hasSale && (
            <span className="text-xs md:text-sm text-gray-500 line-through">
              {Number(item.price).toLocaleString()} ₫
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] md:text-xs text-gray-500">Đã bán {item.sold}</div>
      </div>
    </Link>
  );
}
