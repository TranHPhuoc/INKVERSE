import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { getRelatedBooks, type BookListItem } from "../types/books";

type Props = { bookId: number };

export default function RelatedBooksGrid({ bookId }: Props) {
  const [items, setItems] = useState<BookListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getRelatedBooks(bookId, 30)
      .then((res) => alive && setItems(res))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [bookId]);

  // ===== Loading skeleton =====
  if (loading) {
    return (
      <section className="relative">
        {/* Teal Glow BG */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #14b8a6 100%)",
              backgroundSize: "100% 100%",
            }}
          />
        </div>

        <div className="mx-auto max-w-[1550px] px-4 py-10 md:px-6">
          {/* Header bar */}
          <HeaderBar />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[320px] animate-pulse rounded-2xl bg-white/80 shadow-sm ring-1 ring-white/50"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="relative">
      {/* Teal Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #14b8a6 100%)",
            backgroundSize: "100% 100%",
          }}
        />
      </div>

      <div className="mx-auto max-w-[1550px] px-4 py-10 md:px-6">
        {/* Header bar kiểu Fahasa (chữ giữa) */}
        <HeaderBar />

        {/* GRID 30 sản phẩm */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((b) => (
            <ProductCard key={b.id} item={b} />
          ))}
        </div>

        {/* Nút Xem tất cả */}
        <div className="mt-8 flex justify-center">
          <Link
            to={`/goi-y/${bookId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-white px-5 py-2.5 text-emerald-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            Xem tất cả
            <span className="text-lg leading-none">›</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeaderBar() {
  return (
    <div className="relative mb-8">
      {/* nền gradient + shadow + bo góc */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg ring-1 ring-emerald-300/50" />
      {/* nội dung trung tâm */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-3 text-white">
        {/* icon trang trí trái */}
        <Sparkle />
        <h2 className="text-center text-lg font-bold tracking-wide uppercase">Gợi ý cho bạn</h2>
        {/* icon trang trí phải (xoay đối xứng) */}
        <Sparkle className="rotate-180" />
      </div>
    </div>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 text-white/95 drop-shadow ${className}`}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2zm7 10l1.2 2.8L23 16l-2.8 1.2L19 20l-1.2-2.8L15 16l2.8-1.2L19 12zM2 12l1.2 2.8L6 16l-2.8 1.2L2 20l-1.2-2.8L-2 16l2.8-1.2L2 12z"
      />
    </svg>
  );
}
