// src/pages/RelatedAllPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  getBookDetailById,
  listBooks,
  type BookListItem,
  type SpringPage,
  type ListParams,
} from "../types/books";
import ProductCard from "../components/ProductCard";

export default function RelatedAllPage() {
  const { bookId: bookIdStr } = useParams<{ bookId: string }>();
  const bookId = Number(bookIdStr);

  const [sp, setSp] = useSearchParams();
  const by = (sp.get("by") === "author" ? "author" : "category") as "author" | "category";

  const [authorIds, setAuthorIds] = useState<number[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SpringPage<BookListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Lấy chi tiết sách để biết author/category
  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      if (!Number.isFinite(bookId) || bookId <= 0) return;
      const d = await getBookDetailById(bookId);
      if (!alive) return;
      setAuthorIds((d.authors ?? []).map((a) => Number(a.id)));
      setCategoryIds((d.categories ?? []).map((c) => Number(c.id)));
    })()
      .catch(() => {})
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [bookId]);

  // 2) Fetch danh sách theo tab hiện tại
  useEffect(() => {
    let alive = true;

    // Chưa có id nào thì chưa gọi list
    if (by === "author" && authorIds.length === 0) return;
    if (by === "category" && categoryIds.length === 0) return;

    setLoading(true);

    const params: ListParams = {
      status: "ACTIVE",
      page,
      size: 24,
      sort: "createdAt",
      direction: "DESC",
      ...(by === "author" && authorIds[0] ? { authorId: authorIds[0] } : {}),
      ...(by === "category" && categoryIds[0] ? { categoryId: categoryIds[0] } : {}),
    };

    listBooks(params)
      .then((res) => alive && setData(res))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [authorIds, categoryIds, by, page]);

  const title = useMemo(
    () => (by === "author" ? "Tất cả gợi ý theo Tác giả" : "Tất cả gợi ý theo Danh mục"),
    [by],
  );

  const switchTab = (next: "category" | "author") => {
    setSp(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("by", next);
        p.delete("page");
        return p;
      },
      { replace: true },
    );
    setPage(1);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1550px] px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-emerald-600 hover:underline">
          Trang chủ
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-gray-900">Gợi ý cho bạn</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => switchTab("category")}
            className={`rounded-lg px-4 py-2 text-sm ${
              by === "category" ? "bg-white shadow ring-1 ring-gray-200" : "text-gray-600"
            }`}
          >
            Theo danh mục
          </button>
          <button
            onClick={() => switchTab("author")}
            className={`rounded-lg px-4 py-2 text-sm ${
              by === "author" ? "bg-white shadow ring-1 ring-gray-200" : "text-gray-600"
            }`}
          >
            Theo tác giả
          </button>
        </div>
      </header>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-[320px] animate-pulse rounded-2xl bg-white/80 ring-1 ring-gray-100"
            />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {data.content.map((b) => (
              <ProductCard key={b.id} item={b} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                ← Trước
              </button>
              <div className="text-sm text-gray-700">
                Trang {page} / {data.totalPages}
              </div>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
