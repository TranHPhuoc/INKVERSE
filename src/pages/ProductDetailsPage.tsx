// src/pages/ProductDetailPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { BookDetail } from "../types/books";
import { getBookDetailBySlug } from "../types/books";
import { langVi, ageVi, coverVi } from "../types/labels";
import { PLACEHOLDER } from "../types/img";
import { addCartItem, addAndSelectOne} from "../services/cart";
import { useAuth } from "../context/AuthContext";
import useCheckoutGuard from "../hooks/useCheckoutGuard.tsx";
import BookGallery from "../components/BookGallery";

/* ================= Helpers ================= */
function formatVND(n?: number | null): string {
    if (n == null) return "";
    try {
        return Number(n).toLocaleString("vi-VN");
    } catch {
        return String(n);
    }
}

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
            <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < full} />)}</div>
            <span className="font-medium">{Number.isFinite(avg) ? avg.toFixed(1) : "0.0"}</span>
            <span className="text-gray-300">|</span>
            <span>{count} đánh giá</span>
        </div>
    );
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-2 gap-4 py-2 border-b">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="text-sm text-gray-900">{children}</div>
        </div>
    );
}

/** Hiệu ứng “bay vào giỏ” */
function animateFlyToCart(sourceEl: HTMLElement): Promise<void> {
    return new Promise<void>((resolve) => {
        try {
            const cartBtn = document.querySelector('[aria-label="Giỏ hàng"]') as HTMLElement | null;
            if (!cartBtn) return resolve();

            const imgRect = sourceEl.getBoundingClientRect();
            const cartRect = cartBtn.getBoundingClientRect();

            const ghost = sourceEl.cloneNode(true) as HTMLElement;
            ghost.style.position = "fixed";
            ghost.style.left = `${imgRect.left}px`;
            ghost.style.top = `${imgRect.top}px`;
            ghost.style.width = `${imgRect.width}px`;
            ghost.style.height = `${imgRect.height}px`;
            ghost.style.borderRadius = "12px";
            ghost.style.zIndex = "9999";
            ghost.style.transition = "transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms";
            ghost.style.pointerEvents = "none";
            document.body.appendChild(ghost);

            const dx = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
            const dy = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

            requestAnimationFrame(() => {
                ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.15) rotate(12deg)`;
                ghost.style.opacity = "0.4";
            });

            window.setTimeout(() => {
                ghost.remove();
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
    const [data, setData] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [qty, setQty] = useState(1);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const guard = useCheckoutGuard("/checkout");

    // lấy thẻ <img> chính trong BookGallery cho hiệu ứng bay
    const galleryWrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setErr(null);

        getBookDetailBySlug(bookSlug)
            .then((d) => {
                if (!mounted) return;
                setData(d);
            })
            .catch((e: unknown) => {
                if (!mounted) return;
                setErr(e instanceof Error ? e.message : "Lỗi tải chi tiết sách");
            })
            .finally(() => mounted && setLoading(false));

        return () => {
            mounted = false;
        };
    }, [bookSlug]);

    const price = useMemo<number>(() => Number(data?.effectivePrice ?? data?.price ?? 0), [data]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-600">Đang tải…</div>;
    }
    if (err) return <div className="max-w-6xl mx-auto p-6 text-red-600">{err}</div>;
    if (!data) return null;

    const hasSale = data.salePrice != null && Number(data.salePrice) < Number(data.price ?? 0);
    const discountPercent = hasSale
        ? Math.round(((Number(data.price) - Number(data.salePrice ?? data.price)) / Number(data.price)) * 100)
        : 0;

    const gallery = (data.images?.length ?? 0) > 0 ? data.images : [{ id: -1, url: PLACEHOLDER, sortOrder: 0 }];

    const ratingAvg = 0;
    const ratingCount = 0;

    const dec = () => setQty((q) => Math.max(1, q - 1));
    const inc = () => setQty((q) => Math.min(99, q + 1));

    function getCurrentMainImageEl(): HTMLImageElement | null {
        // ưu tiên class .main-image, fallback alt
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

        window.dispatchEvent(new Event("cart:changed"));
    }

    async function handleBuyNow() {
        if (!isAuthenticated) {
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
            window.dispatchEvent(new Event("cart:changed"));

            const ok = await guard.ensureReady();
            if (ok) navigate("/checkout");
        } catch (e) {
            console.error(e);
            alert("Không thể mua ngay. Vui lòng thử lại.");
        }
    }

    const firstCat = data.categories?.[0];
    const breadcrumb = (
        <nav className="text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span className="mx-1.5">/</span>
            {firstCat ? (
                <>
                    <Link to={`/danh-muc/${firstCat.slug ?? ""}`} className="hover:underline">{firstCat.name}</Link>
                    <span className="mx-1.5">/</span>
                </>
            ) : (
                <>
                    <span className="text-gray-400">Sản phẩm</span>
                    <span className="mx-1.5">/</span>
                </>
            )}
            <span className="text-gray-800">{data.title}</span>
        </nav>
    );

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
                    {breadcrumb}

                    <div className="grid grid-cols-1 md:grid-cols-[420px_minmax(0,1fr)] md:gap-8 lg:gap-10">
                        {/* Left: Gallery + Actions */}
                        <div className="mx-auto md:mx-0 w-full max-w-[420px]">
                            <div ref={galleryWrapRef} className="relative">
                                <BookGallery images={gallery} initialIndex={0} />
                                {discountPercent > 0 && (
                                    <span className="absolute top-3 left-3 rounded-md bg-rose-600 text-white text-xs px-2 py-1 shadow">
                    -{discountPercent}%
                  </span>
                                )}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="flex-1 h-11 rounded-xl border-2 border-rose-600 text-rose-600 font-medium hover:bg-rose-50 cursor-pointer"
                                >
                                    Thêm vào giỏ hàng
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBuyNow}
                                    className="flex-1 h-11 rounded-xl bg-rose-600 text-white font-medium hover:opacity-90 cursor-pointer"
                                >
                                    Mua ngay
                                </button>
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="mt-6 md:mt-0">
                            <h1 className="text-2xl font-bold leading-snug">{data.title}</h1>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm text-gray-700">
                                {data.supplier && <div>Nhà cung cấp: <span className="font-bold text-gray-900">{data.supplier.name}</span></div>}
                                {data.authors?.length ? (
                                    <div>Tác giả: <span className="font-bold text-gray-900">{data.authors.map((a) => a.name).join(", ")}</span></div>
                                ) : null}
                                {data.publisher && <div>Nhà xuất bản: <span className="font-bold text-gray-900">{data.publisher.name}</span></div>}
                            </div>

                            {/* Rating + sold */}
                            <div className="mt-3 flex items-center gap-3">
                                <StarRating avg={ratingAvg} count={ratingCount} />
                                <span className="text-gray-300">|</span>
                                <span className="text-sm text-gray-600">Đã bán {data.sold}</span>
                            </div>

                            {/* Price block */}
                            <div className="mt-3 flex items-center gap-3">
                                <span className="text-2xl font-semibold text-rose-600">{formatVND(price)} ₫</span>
                                {hasSale && <span className="line-through text-gray-500">{formatVND(Number(data.price))} ₫</span>}
                                {discountPercent > 0 && <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs">-{discountPercent}%</span>}
                            </div>

                            {/* Quantity */}
                            <div className="mt-4 flex items-center gap-4">
                                <span className="text-sm text-gray-600">Số lượng:</span>
                                <div className="inline-flex items-center rounded-lg border overflow-hidden">
                                    <button type="button" onClick={dec} className="px-3 py-2 text-lg hover:bg-gray-50 cursor-pointer">−</button>
                                    <input
                                        value={qty}
                                        onChange={(e) => {
                                            const v = Math.max(1, Math.min(99, Number(e.target.value.replace(/\D/g, "")) || 1));
                                            setQty(v);
                                        }}
                                        className="w-12 text-center outline-none py-2"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        aria-label="Số lượng"
                                    />
                                    <button type="button" onClick={inc} className="px-3 py-2 text-lg hover:bg-gray-50 cursor-pointer">+</button>
                                </div>
                            </div>

                            {/* Detail */}
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold mb-2">Thông tin chi tiết</h2>
                                <div>
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
                                            {data.widthCm ?? "?"} × {data.heightCm ?? "?"} × {data.thicknessCm ?? "?"} cm
                                        </SpecRow>
                                    )}
                                    {data.pageCount != null && <SpecRow label="Số trang">{data.pageCount}</SpecRow>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {!!data.description && (
                        <div className="mt-10">
                            <h2 className="text-lg font-semibold mb-3">Mô tả sản phẩm</h2>
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: data.description }} />
                        </div>
                    )}
                </div>
            </main>

            {/* Modal nhắc thêm địa chỉ khi cần */}
            {guard.modal}
        </div>
    );
}
