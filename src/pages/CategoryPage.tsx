import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { LANGUAGE_VI } from "../types/labels";
import {
  listByCategorySlug,
  getCategories,
  type CatalogFilters,
  type AgeBoundKey,
  type ProductStatus,
  type LanguageKey,
  type SpringPage,
  type BookListItem,
} from "../types/books.ts";
import ProductCard from "../components/ProductCard";
import { ChevronDown } from "lucide-react";
import Pagination from "../components/Pagination";

/* helpers */
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const fmtVND = (n: number) => {
  try {
    return n.toLocaleString("vi-VN");
  } catch {
    return String(n);
  }
};
const prettifySlug = (s: string) =>
  decodeURIComponent(s)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type LocalCategory = { id: string; name: string; children?: string[] };
const CATEGORIES: LocalCategory[] = [
  {
    id: "van-hoc",
    name: "Sách Văn Học",
    children: ["Tiểu Thuyết", "Truyện Ngắn", "Light Novel", "Ngôn Tình"],
  },
  {
    id: "thieu-nhi",
    name: "Sách Thiếu Nhi",
    children: [
      "Manga - Comic",
      "Kiến Thức Bách Khoa",
      "Sách Tranh Kỹ Năng Sống",
      "Vừa Học Vừa Chơi Với Trẻ",
    ],
  },
  {
    id: "kinh-te",
    name: "Sách Kinh Tế",
    children: [
      "Nhân Vật - Bài Học Kinh Doanh",
      "Quản Trị - Lãnh Đạo",
      "Marketing - Bán Hàng",
      "Phân Tích Kinh Tế",
    ],
  },
  {
    id: "tieu-su",
    name: "Sách Tiểu Sử - Hồi Ký",
    children: ["Câu Chuyện Cuộc Đời", "Chính Trị", "Kinh Tế", "Nghệ Thuật - Giải Trí"],
  },
  {
    id: "tam-ly",
    name: "Sách Tâm Lý - Kỹ Năng Sống",
    children: ["Kỹ Năng Sống", "Rèn Luyện Nhân Cách", "Tâm Lý", "Sách Cho Tuổi Mới Lớn"],
  },
  {
    id: "giao-khoa",
    name: "Sách Giáo Khoa - Tham Khảo",
    children: ["Sách Giáo Khoa", "Sách Tham Khảo", "Luyện thi ĐH, CĐ", "Mẫu Giáo"],
  },
  {
    id: "nuoi-day-con",
    name: "Sách Nuôi Dạy Con",
    children: [
      "Cẩm Nang Làm Cha Mẹ",
      "Phương Pháp Giáo Dục Trẻ Các Nước",
      "Phát Triển Trí Tuệ Cho Trẻ",
      "Phát Triển Kỹ Năng Cho Trẻ",
    ],
  },
  {
    id: "sach-hoc-ngoai-ngu",
    name: "Sách Học Ngoại Ngữ",
    children: ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hoa", "Tiếng Hàn"],
  },
];
const SLUG_VI_SHORT: Record<string, string> = {
  "van-hoc": "Sách Văn Học",
  "thieu-nhi": "Sách Thiếu Nhi",
  "kinh-te": "Sách Kinh Tế",
  "tieu-su": "Sách Tiểu Sử - Hồi Ký",
  "tam-ly": "Sách Tâm Lý - Kỹ Năng Sống",
  "giao-khoa": "Sách Giáo Khoa - Tham Khảo",
  "nuoi-day-con": "Sách Nuôi Dạy Con",
  "sach-hoc-ngoai-ngu": "Sách Học Ngoại Ngữ",
};

const AGE_BOUND_OPTIONS: { key: AgeBoundKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "6", label: "Trên 6 tuổi" },
  { key: "12", label: "Trên 12 tuổi" },
  { key: "16", label: "Trên 16 tuổi" },
  { key: "18", label: "Trên 18 tuổi" },
];
const LANG_OPTIONS: Array<[LanguageKey, string]> = Object.entries(LANGUAGE_VI) as never;

type SortKey = "NEWEST" | "BEST" | "PRICE_DESC" | "PRICE_ASC";
const SORT_OPTIONS: { key: SortKey; label: string; sort: string; direction: "ASC" | "DESC" }[] = [
  { key: "NEWEST", label: "Mới nhất", sort: "createdAt", direction: "DESC" },
  { key: "BEST", label: "Bán chạy nhất", sort: "sold", direction: "DESC" },
  { key: "PRICE_DESC", label: "Giá cao → thấp", sort: "price", direction: "DESC" },
  { key: "PRICE_ASC", label: "Giá thấp → cao", sort: "price", direction: "ASC" },
];

const CategoryNavCard: React.FC = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string, hasChildren: boolean) => {
    if (hasChildren) setOpen((o) => ({ ...o, [id]: !o[id] }));
  };
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <h3 className="bg-[#faf3e0] px-4 py-3 text-sm font-semibold text-black">DANH MỤC SẢN PHẨM</h3>
      <nav className="divide-y">
        {CATEGORIES.map((c) => {
          const opened = !!open[c.id];
          const hasChildren = !!c.children?.length;
          return (
            <div key={c.id}>
              <Link
                to={`/danh-muc/${c.id}`}
                className="flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
              >
                <span className="text-gray-800">{c.name}</span>
                {hasChildren ? (
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${opened ? "rotate-180" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggle(c.id, hasChildren);
                    }}
                  />
                ) : (
                  <span className="h-4 w-4" />
                )}
              </Link>
              {hasChildren && (
                <div
                  className="overflow-hidden bg-white/60 transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: opened ? `${(c.children!.length + 1) * 40}px` : "0px" }}
                >
                  <ul className="py-1">
                    {c.children!.map((child) => (
                      <li key={child}>
                        <Link
                          to={`/danh-muc/${toSlug(child)}`}
                          className="block py-2 pr-4 pl-10 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          {child}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

/* price slider */
type PriceSliderProps = {
  min?: number;
  max?: number;
  step?: number;
  valueMin: number | null;
  valueMax: number | null;
  onChange: (lo: number | null, hi: number | null) => void;
};
function PriceSlider({
  min = 0,
  max = 2_000_000,
  step = 1000,
  valueMin,
  valueMax,
  onChange,
}: PriceSliderProps) {
  const lo = valueMin ?? min,
    hi = valueMax ?? max;
  const left = ((lo - min) / (max - min)) * 100,
    right = 100 - ((hi - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span>{valueMin != null ? `${fmtVND(lo)} ₫` : `Từ ${fmtVND(min)} ₫`}</span>
        <span>{valueMax != null ? `${fmtVND(hi)} ₫` : `Đến ${fmtVND(max)} ₫`}</span>
      </div>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded bg-gray-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded bg-rose-500"
          style={{ left: `${left}%`, right: `${right}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), min, hi);
            onChange(v <= min ? null : v, valueMax);
          }}
          className="pointer-events-none absolute inset-x-0 h-8 w-full appearance-none bg-transparent [-webkit-appearance:none]"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), lo, max);
            onChange(valueMin, v >= max ? null : v);
          }}
          className="pointer-events-none absolute inset-x-0 h-8 w-full appearance-none bg-transparent [-webkit-appearance:none]"
        />
      </div>
      <style>{`
        input[type="range"]::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:18px; height:18px; border-radius:9999px; background:#ef4444; border:2px solid #fff; box-shadow:0 0 0 1px #ef4444; cursor:pointer; margin-top:-8px; pointer-events:auto; }
        input[type="range"]::-moz-range-thumb{ width:18px; height:18px; border-radius:9999px; background:#ef4444; border:2px solid #fff; box-shadow:0 0 0 1px #ef4444; cursor:pointer; }
      `}</style>
      {(valueMin != null || valueMax != null) && (
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="mt-2 text-xs text-rose-600 hover:underline"
        >
          Xóa giá
        </button>
      )}
    </div>
  );
}

/* page */
export default function CategoryPage() {
  const { catSlug = "" } = useParams<{ catSlug: string }>();
  const [sp, setSp] = useSearchParams();

  const page = Number(sp.get("page")) > 0 ? Number(sp.get("page")) : 1;
  const size = Number(sp.get("size")) > 0 ? Number(sp.get("size")) : 12;
  const sortKey: SortKey = (sp.get("sort") as SortKey) || "NEWEST";

  const publisher = sp.get("publisher") || "";
  const supplier = sp.get("supplier") || "";
  const language = (sp.get("language") as LanguageKey) || "";
  const status = (sp.get("status") as ProductStatus) || "";
  const priceMin = sp.get("priceMin") || "";
  const priceMax = sp.get("priceMax") || "";
  const age = (sp.get("age") as AgeBoundKey) || "ALL";

  const filters: CatalogFilters = useMemo(
    () => ({
      publisher: publisher || undefined,
      supplier: supplier || undefined,
      language: language || undefined,
      status: status || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      ageMin: (age as AgeBoundKey) ?? "ALL",
    }),
    [publisher, supplier, language, status, priceMin, priceMax, age],
  );

  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState<SpringPage<BookListItem> | null>(null);
  const [catName, setCatName] = useState<string>(SLUG_VI_SHORT[catSlug] ?? prettifySlug(catSlug));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await getCategories();
        const found = cats.find((c) => c.slug === catSlug);
        if (mounted) setCatName(found?.name ?? SLUG_VI_SHORT[catSlug] ?? prettifySlug(catSlug));
      } catch {
        if (mounted) setCatName(SLUG_VI_SHORT[catSlug] ?? prettifySlug(catSlug));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [catSlug]);

  // load products
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const s = SORT_OPTIONS.find((o) => o.key === sortKey)!;
        const data = await listByCategorySlug(catSlug, page, size, {
          ...filters,
          sort: s.sort,
          direction: s.direction,
        });
        if (mounted) setPageData(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [catSlug, page, size, sortKey, filters]);

  const setParam = (k: string, v?: string) => {
    if (!v) sp.delete(k);
    else sp.set(k, v);
    if (k !== "page") sp.set("page", "1");
    setSp(sp, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onPickAge = (k: AgeBoundKey) => setParam("age", k === "ALL" ? undefined : k);
  const clearAll = () => {
    const keep = new Set(["size"]);
    Array.from(sp.keys()).forEach((k) => {
      if (!keep.has(k)) sp.delete(k);
    });
    sp.set("page", "1");
    sp.set("size", String(size));
    setSp(sp, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* LEFT */}
        <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
          <CategoryNavCard />
          <div className="rounded-2xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Bộ lọc</h2>
              <button
                onClick={clearAll}
                className="cursor-pointer text-xs text-rose-600 hover:underline"
              >
                Xóa tất cả
              </button>
            </div>
            {/* publisher */}
            <div className="border-t py-3">
              <div className="mb-1.5 text-xs font-medium">Nhà xuất bản</div>
              <input
                value={publisher}
                onChange={(e) => setParam("publisher", e.target.value || undefined)}
                placeholder="VD: Kim Đồng"
                className="h-9 w-full rounded-lg border px-2 text-sm"
              />
            </div>
            {/* supplier */}
            <div className="border-t py-3">
              <div className="mb-1.5 text-xs font-medium">Nhà cung cấp</div>
              <input
                value={supplier}
                onChange={(e) => setParam("supplier", e.target.value || undefined)}
                placeholder="VD: Fahasa"
                className="h-9 w-full rounded-lg border px-2 text-sm"
              />
            </div>
            {/* language */}
            <div className="border-t py-3">
              <div className="mb-1.5 text-xs font-medium">Ngôn ngữ</div>
              <select
                value={language}
                onChange={(e) => setParam("language", e.target.value || undefined)}
                className="h-9 w-full rounded-lg border bg-white px-2 text-sm"
              >
                <option value="">Tất cả</option>
                {LANG_OPTIONS.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {/* price */}
            <div className="border-t py-3">
              <div className="mb-1.5 text-xs font-medium">Giá (₫)</div>
              <PriceSlider
                valueMin={priceMin ? Number(priceMin) : null}
                valueMax={priceMax ? Number(priceMax) : null}
                onChange={(lo, hi) => {
                  if (lo == null) sp.delete("priceMin");
                  else sp.set("priceMin", String(lo));
                  if (hi == null) sp.delete("priceMax");
                  else sp.set("priceMax", String(hi));
                  sp.set("page", "1");
                  setSp(sp, { replace: true });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                min={0}
                max={2_000_000}
                step={1000}
              />
            </div>
            {/* age */}
            <div className="border-t py-3">
              <div className="mb-1.5 text-xs font-medium">Độ tuổi</div>
              <div className="flex flex-col gap-1">
                {AGE_BOUND_OPTIONS.map((a) => {
                  const checked = (age || "ALL") === a.key;
                  return (
                    <label key={a.key} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="ageMin"
                        className="h-4 w-4 accent-rose-600"
                        checked={checked}
                        onChange={() => onPickAge(a.key)}
                      />
                      <span className={checked ? "font-medium" : ""}>{a.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <section>
          {/* header + sort/size */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">Danh mục: {catName}</h1>
              {pageData && (
                <div className="mt-1 text-sm text-gray-600">
                  Có {pageData.totalElements} sản phẩm • Trang {page}/{pageData.totalPages || 1}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Sắp xếp theo:</label>
              <select
                value={sortKey}
                onChange={(e) => setParam("sort", e.target.value as SortKey)}
                className="h-9 rounded-lg border bg-white px-2 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={size}
                onChange={(e) => setParam("size", String(Number(e.target.value)))}
                className="h-9 rounded-lg border bg-white px-2 text-sm"
              >
                {[12, 24, 36].map((s) => (
                  <option key={s} value={s}>
                    {s} sản phẩm
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-xl border bg-white p-4" />
              ))
            ) : pageData?.content?.length ? (
              pageData.content.map((b) => (
                <ProductCard key={String(b.id)} item={b} catSlug={catSlug} />
              ))
            ) : (
              <div className="col-span-full text-sm text-gray-500">Không có sản phẩm phù hợp.</div>
            )}
          </div>

          {/* pagination */}
          {pageData && pageData.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={pageData.totalPages}
              onChange={(p) => setParam("page", String(p))}
            />
          )}
        </section>
      </div>
    </div>
  );
}
