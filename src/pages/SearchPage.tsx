// src/pages/SearchPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchBooks } from "../types/books.ts";
import type { BookListItem, SpringPage, ProductStatus } from "../types/books.ts";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [pageData, setPageData] = useState<SpringPage<BookListItem> | null>(null);

  /* ========= Query params (UI-friendly) ========= */
  const q = sp.get("q") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1"));       // UI 1-based
  const size = Math.max(1, Number(sp.get("size") ?? "20"));
  const sort = sp.get("sort") ?? "createdAt";                    // "createdAt" | "price" | "sold"...
  const direction = (sp.get("direction") as "ASC" | "DESC") ?? "DESC";

  const statusRaw = sp.get("status") ?? undefined;
  const authorId = sp.get("authorId") ? Number(sp.get("authorId")) : undefined;
  const categoryId = sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined;
  const publisherId = sp.get("publisherId") ? Number(sp.get("publisherId")) : undefined;
  const supplierId = sp.get("supplierId") ? Number(sp.get("supplierId")) : undefined;

  // Chuẩn hoá status theo enum BE
  const status: ProductStatus | undefined = useMemo(() => {
    if (!statusRaw) return undefined;
    return statusRaw.toUpperCase() as ProductStatus;
  }, [statusRaw]);

  /* ========= Fetch (khớp BE) ========= */
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!q.trim()) {
        setPageData(null);
        return;
      }
      setLoading(true);
      try {
        // Spring pageable: 0-based page index
        const req: Parameters<typeof searchBooks>[0] = {
          q,
          page: page - 1,
          size,
          sort,
          direction,
          ...(status ? { status } : {}),
          ...(authorId !== undefined ? { authorId } : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(publisherId !== undefined ? { publisherId } : {}),
          ...(supplierId !== undefined ? { supplierId } : {}),
        };

        const data = await searchBooks(req);
        if (mounted) setPageData(data);
      } catch {
        if (mounted) setPageData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [q, page, size, sort, direction, status, authorId, categoryId, publisherId, supplierId]);

  /* ========= Helpers ========= */
  const totalPages = pageData?.totalPages ?? 0;

  const onPageChange = (newPage: number) => {
    sp.set("page", String(newPage));
    sp.set("size", String(size));
    setSp(sp, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Đổi sort/direction → reset về trang 1
  const setSort = (sortField: string, dir: "ASC" | "DESC") => {
    sp.set("sort", sortField);
    sp.set("direction", dir);
    sp.set("page", "1");
    setSp(sp, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-[1550px] px-4 py-6 md:px-6">
          <div className="mb-4 text-sm text-gray-600">
            Kết quả cho <span className="font-medium">"{q}"</span>
            {pageData && <span> — {pageData.totalElements} sản phẩm</span>}
          </div>

          {/* ========= Sort bar ========= */}
          <div className="mb-4 flex flex-wrap gap-2 text-base">
            <button
              onClick={() => setSort("createdAt", "DESC")}
              className={`rounded border px-3 py-1.5 transition ${
                sort === "createdAt" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-100"
              }`}
            >
              Mới nhất
            </button>

            <button
              onClick={() => setSort("price", "ASC")}
              className={`rounded border px-3 py-1.5 transition ${
                sort === "price" && direction === "ASC"
                  ? "bg-gray-900 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Giá tăng dần
            </button>

            <button
              onClick={() => setSort("price", "DESC")}
              className={`rounded border px-3 py-1.5 transition ${
                sort === "price" && direction === "DESC"
                  ? "bg-gray-900 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              Giá giảm dần
            </button>
          </div>

          {/* ========= Grid ========= */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[300px] animate-pulse rounded-xl border bg-white p-4" />
              ))
            ) : pageData?.content?.length ? (
              pageData.content.map((b) => <ProductCard key={String(b.id)} item={b} />)
            ) : (
              <div className="col-span-full text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>
            )}
          </div>

          {/* ========= Pagination ========= */}
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
          )}
        </div>
      </main>
    </div>
  );
}
