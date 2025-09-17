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

    const href = catSlug
        ? `/danh-muc/${catSlug}/${item.slug}`
        : `/books/${item.slug}`;

    const imgSrc = resolveThumb(item.thumbnail);
    const showNew = isNewWithin((item as any).createdAt);

    return (
        <Link
            to={href}
            className="group border rounded-xl p-3 h-full flex flex-col hover:shadow-md transition"
            aria-label={item.title}
            title={item.title}
        >
            {/* Thumbnail + badges */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-50">
                <img
                    src={imgSrc}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                    }}
                />

                {/* Badge NEW */}
                {showNew && (
                    <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow">
            New
          </span>
                )}

                {/* Ribbon SALE */}
                {hasSale && (
                    <span className="absolute top-2 right-0 bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-l-md shadow">
            -{percent}%
          </span>
                )}
            </div>

            {/* Title */}
            <div className="mt-2 text-sm font-medium line-clamp-2 leading-5 min-h-[2.5rem] text-gray-900">
                {item.title}
            </div>

            {/* Price */}
            <div className="mt-auto pt-2">
                <div className="flex items-baseline gap-2">
          <span className="font-semibold text-rose-600">
            {price.toLocaleString()} ₫
          </span>
                    {hasSale && (
                        <span className="line-through text-gray-500 text-xs">
              {item.price.toLocaleString()} ₫
            </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Đã bán {item.sold}</div>
            </div>
        </Link>
    );
}
