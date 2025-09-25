import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { getMyFavorites } from "../services/favorite";
import type { FavoriteBookItem } from "../services/favorite";

export default function FavoritesPage() {
  const [data, setData] = useState<FavoriteBookItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const size = 20;

  useEffect(() => {
    (async () => {
      const res = await getMyFavorites(page, size);
      setData(res.content);
      setTotalPages(res.totalPages);
    })();
  }, [page, size]);

  // Bỏ tim -> gỡ card khỏi list ngay
  useEffect(() => {
    const onFav = (e: Event) => {
      const detail = (e as CustomEvent<{ bookId: number; liked: boolean }>).detail;
      if (!detail) return;
      if (detail.liked === false) {
        setData((cur) => cur.filter((b) => b.id !== detail.bookId));
      }
    };
    window.addEventListener("favorite:changed", onFav as EventListener);
    return () => window.removeEventListener("favorite:changed", onFav as EventListener);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold">Sản phẩm yêu thích</h1>

      {data.length === 0 ? (
        <div className="rounded-xl border p-8 text-center text-slate-600">
          Chưa có sản phẩm nào.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-40"
            disabled={page === 0}
          >
            Trước
          </button>
          <div className="text-sm">
            Trang {page + 1}/{totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-40"
            disabled={page >= totalPages - 1}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
