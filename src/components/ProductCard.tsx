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
  const diffDays = (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
};

export default function ProductCard({ item, catSlug }: Props) {
  const price = item.effectivePrice ?? item.price;
  const hasSale = item.salePrice != null && item.salePrice < item.price;
  const percent = hasSale ? Math.max(0, Math.round(100 - (price / item.price) * 100)) : 0;

  const href = catSlug ? `/danh-muc/${catSlug}/${item.slug}` : `/books/${item.slug}`;

  const imgSrc = resolveThumb(item.thumbnail);
  const showNew = isNewWithin((item as any).createdAt);

  return (
    <Link
      to={href}
      className="group flex h-full flex-col rounded-xl border p-3 transition hover:shadow-md"
      aria-label={item.title}
      title={item.title}
    >
      {/* Thumbnail + badges */}
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

        {/* Badge NEW */}
        {showNew && (
          <span className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow">
            New
          </span>
        )}

        {/* Ribbon SALE */}
        {hasSale && (
          <span className="absolute top-2 right-0 rounded-l-md bg-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow">
            -{percent}%
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium text-gray-900">
        {item.title}
      </div>

      {/* Price */}
      <div className="mt-auto pt-2">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-rose-600">{price.toLocaleString()} ₫</span>
          {hasSale && (
            <span className="text-xs text-gray-500 line-through">
              {item.price.toLocaleString()} ₫
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-gray-500">Đã bán {item.sold}</div>
      </div>
    </Link>
  );
}
