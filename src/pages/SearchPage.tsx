import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchBooks } from "../types/books.ts";
import type { BookListItem, SpringPage } from "../types/books.ts";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState<SpringPage<BookListItem> | null>(null);

  const q = sp.get("q") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const size = Math.max(1, Number(sp.get("size") ?? "20"));
  const sort = sp.get("sort") ?? "createdAt";
  const direction = (sp.get("direction") as "ASC" | "DESC") ?? "DESC";

  const status = sp.get("status") ?? undefined;
  const authorId = sp.get("authorId") ? Number(sp.get("authorId")) : undefined;
  const categoryId = sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined;
  const publisherId = sp.get("publisherId") ? Number(sp.get("publisherId")) : undefined;
  const supplierId = sp.get("supplierId") ? Number(sp.get("supplierId")) : undefined;

  const deps = useMemo(
    () =>
      [q, page, size, sort, direction, status, authorId, categoryId, publisherId, supplierId].join(
        "|",
      ),
    [q, page, size, sort, direction, status, authorId, categoryId, publisherId, supplierId],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!q.trim()) {
        setPageData(null);
        return;
      }
      setLoading(true);
      try {
        const data = await searchBooks({
          q,
          page,
          size,
          sort,
          direction,
          status: status as any,
          authorId,
          categoryId,
          publisherId,
          supplierId,
        });
        if (mounted) setPageData(data);
      } catch (e) {
        console.error("[Search] error:", e);
        if (mounted) setPageData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [deps]);

  const totalPages = pageData?.totalPages ?? 0;

  const onPageChange = (newPage: number) => {
    sp.set("page", String(newPage));
    sp.set("size", String(size));
    setSp(sp, { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-4 text-sm text-gray-600">
            Kết quả cho <span className="font-medium">"{q}"</span>
            {pageData && <span> — {pageData.totalElements} sản phẩm</span>}
          </div>

          {/* thanh filter */}
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <Link
              to={`/search?${new URLSearchParams({ q, sort: "createdAt", direction: "DESC" }).toString()}`}
              className={`rounded border px-3 py-1.5 ${sort === "createdAt" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              Mới nhất
            </Link>
            <Link
              to={`/search?${new URLSearchParams({ q, sort: "price", direction: "ASC" }).toString()}`}
              className={`rounded border px-3 py-1.5 ${sort === "price" && direction === "ASC" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              Giá tăng dần
            </Link>
            <Link
              to={`/search?${new URLSearchParams({ q, sort: "price", direction: "DESC" }).toString()}`}
              className={`rounded border px-3 py-1.5 ${sort === "price" && direction === "DESC" ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              Giá giảm dần
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-xl border bg-white p-4" />
              ))
            ) : pageData?.content?.length ? (
              pageData.content.map((b) => <ProductCard key={String(b.id)} item={b} />)
            ) : (
              <div className="col-span-full text-sm text-gray-500">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
          )}
        </div>
      </main>
    </div>
  );
}
