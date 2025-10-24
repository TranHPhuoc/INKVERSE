// src/pages/ProductDetailsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";

import type { BookDetail } from "../types/books";
import { getBookDetailBySlug, getBookDetailById } from "../types/books";
import { langVi, ageVi, coverVi } from "../types/labels";
import { PLACEHOLDER } from "../types/img";
import { addCartItem, addAndSelectOne } from "../services/cart";
import { useAuth } from "../context/useAuth";
import useCheckoutGuard from "../hooks/useCheckoutGuard";
import BookGallery from "../components/BookGallery";
import BookReviewAndComment from "../components/BookReviewAndComment";
import { getRatingSummary, canReview } from "../services/rating";
import FavoriteHeart from "../components/FavoriteHeart";
import ErrorBoundary from "../components/ErrorBoundary";
import { isFavorite, getCount as getFavCount } from "../store/favorite-store";
import ReviewModal from "../components/ReviewModal";
import RelatedBooksGrid from "../components/RelatedBooksGrid";
import ProductDescription from "../components/ProductDescription";
import { toast } from "react-hot-toast";

/* ---------- Types ---------- */
type BookDetailView = BookDetail & {
  likedByMe?: boolean;
  favoriteCount?: number;
};
type ToastKind = "cart" | "fav";

/* ---------- Helpers ---------- */
function sanitizeSlug(raw: string): string {
  const trimmed = (raw ?? "").trim().replace(/[.,;:!?]+$/g, "");
  const lower = trimmed.toLowerCase();
  const ascii = lower.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
  return ascii.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function decodeSafe(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}
function formatVND(n?: number | null): string {
  if (n == null) return "";
  try { return Number(n).toLocaleString("vi-VN"); } catch { return String(n); }
}

/* ---------- Small UI bits ---------- */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 ${filled ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}`} aria-hidden>
      <path d="M10 15.27 15.18 18l-1.64-5.03L18 9.24l-5.19-.04L10 4 7.19 9.2 2 9.24l4.46 3.73L4.82 18 10 15.27z" />
    </svg>
  );
}
function StarRating({ avg = 0, count = 0 }: { avg?: number; count?: number }) {
  const full = Math.round(avg);
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < full} />)}
      </div>
      <span className="font-semibold">{Number.isFinite(avg) ? avg.toFixed(1) : "0.0"}</span>
      <span className="text-gray-300">•</span>
      <span className="text-gray-500">{count} đánh giá</span>
    </div>
  );
}
function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b border-gray-100 py-2 text-sm last:border-none">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{children}</div>
    </div>
  );
}

/* Add-to-cart animation */
function animateFlyToCart(sourceEl: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const cartBtn = document.getElementById("header-cart-icon") as HTMLElement | null;
      if (!cartBtn) return resolve();

      const imgRect = sourceEl.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();
      const ghost = sourceEl.cloneNode(true) as HTMLElement;
      ghost.style.position = "fixed";
      ghost.style.left = `${imgRect.left}px`;
      ghost.style.top = `${imgRect.top}px`;
      ghost.style.width = `${imgRect.width}px`;
      ghost.style.height = `${imgRect.height}px`;
      ghost.style.borderRadius = "14px";
      ghost.style.zIndex = "9999";
      ghost.style.boxShadow = "0 10px 40px rgba(0,0,0,.15)";
      ghost.style.transition = "transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms";
      ghost.style.pointerEvents = "none";
      document.body.appendChild(ghost);

      const dx = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
      const dy = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.14) rotate(8deg)`;
        ghost.style.opacity = "0.35";
      });

      window.setTimeout(() => {
        ghost.remove();
        cartBtn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
          { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
        resolve();
      }, 650);
    } catch {
      resolve();
    }
  });
}

/* ================= Page ================= */
export default function ProductDetailsPage() {
  const { bookSlug = "" } = useParams<{ bookSlug: string }>();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const by = sp.get("by");         // "id" | null
  const action = sp.get("action"); // "review" | null

  const [data, setData] = useState<BookDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [qty, setQty] = useState(1);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const guard = useCheckoutGuard("/checkout");

  const galleryWrapRef = useRef<HTMLDivElement | null>(null);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [toastKind, setToastKind] = useState<ToastKind>("cart");

  const [summary, setSummary] = useState<{ average?: number; count?: number }>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [reviewRefreshTick, setReviewRefreshTick] = useState(0);
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  /* Rating summary */
  useEffect(() => {
    let dead = false;
    if (!data?.id) return;
    getRatingSummary(Number(data.id))
      .then((s) => { if (!dead) setSummary({ average: Number(s.average ?? 0), count: s.count ?? 0 }); })
      .catch(() => { if (!dead) setSummary({ average: 0, count: 0 }); });
    return () => { dead = true; };
  }, [data?.id]);

  /* Permission to write review */
  useEffect(() => {
    let active = true;
    if (!data?.id) return;
    canReview(Number(data.id))
      .then((r) => { if (active) setCanWrite(!!r.eligible); })
      .catch(() => { if (active) setCanWrite(false); });
    return () => { active = false; };
  }, [data?.id]);

  /* Load book detail (no redirect to /search) */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        let detail: BookDetailView;

        if (by === "id") {
          const id = Number(bookSlug);
          if (!Number.isFinite(id) || id <= 0) throw new Error("ID không hợp lệ");
          detail = (await getBookDetailById(id)) as BookDetailView;
        } else {
          // Try raw -> decoded -> sanitized slug
          const tries = [bookSlug, decodeSafe(bookSlug || ""), sanitizeSlug(bookSlug || "")];
          let ok: BookDetailView | null = null;
          for (const s of tries) {
            try {
              ok = (await getBookDetailBySlug(s)) as unknown as BookDetailView;
              if (ok) break;
            } catch { /* try next */ }
          }
          if (!ok) throw new Error("NOT_FOUND");
          detail = ok;
        }

        if (!alive) return;
        setData(detail);
      } catch {
        if (!alive) return;
        setErr("Không tìm thấy sách hoặc server đang bận. Vui lòng thử lại sau.");
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [bookSlug, by]);

  /* Open write-review modal via query ?action=review */
  useEffect(() => {
    if (action === "review") {
      setReviewOpen(true);
      setTimeout(() => { reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 0);
    }
  }, [action]);

  const price = useMemo<number>(() => Number(data?.effectivePrice ?? data?.price ?? 0), [data]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-gray-600">
        <div className="animate-pulse rounded-2xl bg-gray-100 px-4 py-2">Đang tải…</div>
      </div>
    );
  }
  if (err) return <div className="mx-auto max-w-6xl p-6 text-red-600">{err}</div>;
  if (!data) return null;

  const hasSale = !!data.salePrice && Number(data.salePrice) < Number(data.price ?? 0);
  const discountPercent = hasSale
    ? Math.round(((Number(data.price) - Number(data.salePrice ?? data.price)) / Number(data.price)) * 100)
    : 0;

  const gallery = (data.images?.length ?? 0) > 0 ? data.images : [{ id: -1, url: PLACEHOLDER, sortOrder: 0 }];

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(99, q + 1));

  function getCurrentMainImageEl(): HTMLImageElement | null {
    const wrap = galleryWrapRef.current;
    return (
      (wrap?.querySelector(".main-image") as HTMLImageElement | null) ||
      (wrap?.querySelector('img[alt="book image"]') as HTMLImageElement | null) ||
      null
    );
  }

  async function handleAddToCart() {
    if (!data?.id) return;
    const safeQty = Math.min(Math.max(1, qty | 0), 99);
    await addCartItem({ bookId: data.id, qty: safeQty });
    const mainEl = getCurrentMainImageEl();
    if (mainEl) await animateFlyToCart(mainEl);
    setToastKind("cart");
    setToastMsg("Sản phẩm đã được thêm vào giỏ hàng!");
    setToastOpen(true);
    window.setTimeout(() => setToastOpen(false), 1400);
  }

  async function handleBuyNow() {
    if (!isAuthenticated) {
      if (data?.id) localStorage.setItem("pendingBuyNow", JSON.stringify({ bookId: data.id, qty }));
      toast.error("Bạn chưa đăng nhập/đăng ký. Vui lòng đăng nhập để tiếp tục mua hàng", {
        duration: 3000,
        style: { background: "#1f1f1f", color: "#fff", borderRadius: "12px", fontWeight: 500 },
      });
      const ok = await guard.ensureReady();
      if (ok) navigate("/checkout");
      return;
    }

    if (!data?.id) return;
    const safeQty = Math.min(Math.max(1, qty | 0), 99);
    try {
      await addAndSelectOne({ bookId: data.id, qty: safeQty });
      const mainEl = getCurrentMainImageEl();
      if (mainEl) await animateFlyToCart(mainEl);
      toast.success("Đã thêm vào giỏ. Chuyển tới thanh toán…", {
        duration: 2000,
        style: { background: "#1f1f1f", color: "#fff", borderRadius: "12px", fontWeight: 500 },
      });
      const ok = await guard.ensureReady();
      if (ok) navigate("/checkout");
    } catch (e) {
      console.error(e);
      toast.error("Không thể mua ngay. Vui lòng thử lại.");
    }
  }

  const firstCat = data.categories?.[0];
  const breadcrumb = (
    <nav className="mb-5 text-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-gray-600 ring-1 ring-gray-200">
        <Link to="/" className="hover:text-rose-600 hover:underline">Trang chủ</Link>
        <span className="text-gray-300">/</span>
        {firstCat ? (
          <>
            <Link to={`/danh-muc/${firstCat.slug ?? ""}`} className="hover:text-rose-600 hover:underline">{firstCat.name}</Link>
            <span className="text-gray-300">/</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">Sản phẩm</span>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="font-medium text-gray-800">{data.title}</span>
      </div>
    </nav>
  );

  const storeLiked = isAuthenticated ? isFavorite(Number(data.id)) : false;
  const storeCount = isAuthenticated ? getFavCount(Number(data.id)) : undefined;
  const initialLiked = isAuthenticated ? storeLiked || Boolean(data.likedByMe) : false;
  const initialCount = storeCount ?? data.favoriteCount ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-rose-50/[.35] to-white">
      <main className="flex-1">
        <div className="mx-auto max-w-[1550px] px-4 py-8 md:px-6">
          {breadcrumb}

          <div className="grid grid-cols-1 gap-8 md:grid-cols-[520px_minmax(0,1fr)]">
            {/* Left: Gallery + Actions */}
            <div className="relative z-[120] md:sticky md:top-20 md:self-start">
              <div ref={galleryWrapRef} className="relative z-[130] rounded-2xl border border-gray-100 bg-white/70 p-3 shadow-[0_10px_30px_-12px_rgba(244,63,94,.25)] backdrop-blur">
                <BookGallery images={gallery} initialIndex={0} />
                {discountPercent > 0 && (
                  <span className="pointer-events-none absolute right-3 top-3 rounded-xl bg-rose-600/95 px-2.5 py-1 text-xl font-semibold text-white shadow">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={handleAddToCart} className="h-11 cursor-pointer rounded-xl border-2 border-rose-600/90 bg-white font-medium text-rose-600 transition-all hover:-translate-y-0.5 hover:bg-rose-50 active:translate-y-0">
                  Thêm vào giỏ hàng
                </button>
                <button type="button" onClick={handleBuyNow} className="h-11 cursor-pointer rounded-xl bg-rose-600 font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0">
                  Mua ngay
                </button>
              </div>
            </div>

            {/* Right: Info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm ring-1 ring-white/50 backdrop-blur">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold leading-snug text-gray-900">{data.title}</h1>
                  <FavoriteHeart
                    bookId={Number(data.id)}
                    initialLiked={initialLiked}
                    initialCount={initialCount}
                    size={22}
                    className="ml-1 translate-y-[1px] rounded-full border bg-white/80 px-2 py-1 backdrop-blur"
                    onToggle={(liked) => {
                      setToastKind("fav");
                      setToastMsg(liked ? "Đã thêm vào mục yêu thích!" : "Đã xoá khỏi mục yêu thích");
                      setToastOpen(true);
                      window.setTimeout(() => setToastOpen(false), liked ? 1400 : 1200);
                    }}
                  />
                </div>

                {/* meta */}
                <div className="mt-2 grid grid-cols-1 gap-y-1 text-sm text-gray-700 sm:grid-cols-2">
                  {data.supplier && <div>Nhà cung cấp: <span className="font-semibold text-gray-900">{data.supplier.name}</span></div>}
                  {data.authors?.length ? (
                    <div>Tác giả: <span className="font-semibold text-gray-900">{data.authors.map((a) => a.name).join(", ")}</span></div>
                  ) : null}
                  {data.publisher && <div>Nhà xuất bản: <span className="font-semibold text-gray-900">{data.publisher.name}</span></div>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StarRating avg={summary.average ?? 0} count={summary.count ?? 0} />
                  <span className="hidden h-4 w-px bg-gray-200 sm:block" />
                  <span className="text-sm text-gray-600">Đã bán {data.sold}</span>
                </div>

                {/* Price */}
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-bold tracking-tight text-rose-600">{formatVND(price)} ₫</span>
                  {hasSale && <span className="translate-y-[-2px] text-gray-500 line-through">{formatVND(Number(data.price))} ₫</span>}
                  {discountPercent > 0 && (
                    <span className="translate-y-[-3px] rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                      Tiết kiệm {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Quantity */}
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <span className="text-sm text-gray-600">Số lượng</span>
                  <div className="inline-flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <button type="button" onClick={dec} className="cursor-pointer px-3 py-2 text-lg hover:bg-gray-50" aria-label="Giảm số lượng">−</button>
                    <input
                      value={qty}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(99, Number(e.target.value.replace(/\D/g, "")) || 1));
                        setQty(v);
                      }}
                      className="w-12 py-2 text-center outline-none"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Số lượng"
                    />
                    <button type="button" onClick={inc} className="cursor-pointer px-3 py-2 text-lg hover:bg-gray-50" aria-label="Tăng số lượng">+</button>
                  </div>
                </div>
              </div>

              {/* Specs */}
              <div className="rounded-2xl border border-gray-100 bg-white/70 p-5 shadow-sm ring-1 ring-white/50 backdrop-blur">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Thông tin chi tiết</h2>
                <div>
                  {data.isbn13 && <SpecRow label="Mã sách">{data.isbn13}</SpecRow>}
                  {data.supplier && <SpecRow label="Tên nhà cung cấp">{data.supplier.name}</SpecRow>}
                  {data.authors?.length ? <SpecRow label="Tác giả">{data.authors.map((a) => a.name).join(", ")}</SpecRow> : null}
                  {data.publisher && <SpecRow label="NXB">{data.publisher.name}</SpecRow>}
                  {data.publicationYear != null && <SpecRow label="Năm XB">{data.publicationYear}</SpecRow>}
                  {data.language && <SpecRow label="Ngôn ngữ">{langVi(data.language)}</SpecRow>}
                  {data.coverType && <SpecRow label="Loại bìa">{coverVi(data.coverType)}</SpecRow>}
                  {data.ageRating && <SpecRow label="Độ tuổi">{ageVi(data.ageRating)}</SpecRow>}
                  {data.weightGram != null && <SpecRow label="Trọng lượng (g)">{data.weightGram}</SpecRow>}
                  {(data.widthCm || data.heightCm || data.thicknessCm) && (
                    <SpecRow label="Kích thước">
                      {data.heightCm ?? "?"} × {data.widthCm ?? "?"} × {data.thicknessCm ?? "?"} cm
                    </SpecRow>
                  )}
                  {data.pageCount != null && <SpecRow label="Số trang">{data.pageCount}</SpecRow>}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <ProductDescription description={data.description} />
        </div>
      </main>

      {/* Toast mini */}
      <div className={`${toastOpen ? "" : "pointer-events-none"} fixed inset-0 z-[1000] grid place-items-center`}>
        {toastOpen && <div className="absolute inset-0 bg-black/10" />}
        {toastOpen && (
          <div className="pointer-events-auto mx-4 flex animate-[fadeIn_.2s] items-center gap-3 rounded-2xl bg-neutral-800/95 px-6 py-5 text-white shadow-2xl ring-1 ring-white/10">
            {toastKind === "cart" ? (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-400"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
              </div>
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-500/20 ring-1 ring-rose-400/40">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-400"><path fill="currentColor" d="M12 21s-6.72-4.35-9.33-7.06A5.88 5.88 0 0 1 12 4.44a5.88 5.88 0 0 1 9.33 9.5C18.72 16.65 12 21 12 21z" /></svg>
              </div>
            )}
            <div className="text-base font-medium">{toastMsg}</div>
          </div>
        )}
      </div>

      {/* Reviews & Comments */}
      {data.id ? (
        <section className="bg-gradient-to-b from-white to-rose-50/40">
          <div className="mx-auto max-w-[1990px] px-4 py-10 md:px-6">
            <div className="mb-6 flex items-center gap-3" ref={reviewsRef} id="reviews-section">
              <h2 className="text-xl font-semibold tracking-tight">Đánh giá sản phẩm</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-rose-200/80 to-transparent" />
            </div>

            <ErrorBoundary>
              <div className="group relative animate-[fadeIn_.25s_ease-out] rounded-2xl border border-rose-100/80 bg-white/90 p-5 shadow-[0_6px_30px_-10px_rgba(244,63,94,0.25)] ring-1 ring-white/40 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-rose-100/70" />
                <BookReviewAndComment
                  bookId={data.id}
                  canWrite={canWrite}
                  onOpenWrite={() => setReviewOpen(true)}
                  refreshKey={reviewRefreshTick}
                />
              </div>
            </ErrorBoundary>
          </div>
          <RelatedBooksGrid bookId={data.id} />
        </section>
      ) : null}

      {/* Review Modal */}
      {data.id && (
        <ReviewModal
          bookId={Number(data.id)}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onSubmitted={async () => {
            setCanWrite(false);
            try {
              const s = await getRatingSummary(Number(data.id));
              setSummary({ average: Number(s.average ?? 0), count: s.count ?? 0 });
            } catch { /* ignore */ }
            setReviewRefreshTick((t) => t + 1);
            setTimeout(() => { reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
          }}
        />
      )}
    </div>
  );
}
