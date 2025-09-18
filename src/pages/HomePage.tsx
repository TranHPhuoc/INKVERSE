import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, Truck, Headphones, ShieldCheck } from "lucide-react";
import { motion, type Variants, useInView, useAnimationControls } from "framer-motion";


import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

import type { BookListItem } from "../types/books";
import { listBooks } from "../types/books";

import banner1 from "../assets/bannerbooks1.png";
import banner2 from "../assets/bannerbooks2.jpeg";
import banner3 from "../assets/backgroundbooks.png";

/* ───────────────────────── constants ───────────────────────── */
type Category = { id: string; name: string; children?: string[] };
const BANNERS: string[] = [banner1, banner2, banner3];

const CATEGORIES: Category[] = [
    { id: "van-hoc", name: "Sách Văn Học", children: ["Tiểu Thuyết", "Truyện Ngắn", "Light Novel", "Ngôn Tình"] },
    { id: "thieu-nhi", name: "Sách Thiếu Nhi", children: ["Manga - Comic", "Kiến Thức Bách Khoa", "Sách Tranh Kỹ Năng Sống", "Vừa Học Vừa Chơi Với Trẻ"] },
    { id: "kinh-te", name: "Sách Kinh Tế", children: ["Nhân Vật - Bài Học Kinh Doanh", "Quản Trị - Lãnh Đạo", "Marketing - Bán Hàng", "Phân Tích Kinh Tế"] },
    { id: "tieu-su", name: "Sách Tiểu Sử - Hồi Ký", children: ["Câu Chuyện Cuộc Đời", "Chính Trị", "Kinh Tế", "Nghệ Thuật - Giải Trí"] },
    { id: "tam-ly", name: "Sách Tâm Lý - Kỹ Năng Sống", children: ["Kỹ Năng Sống", "Rèn Luyện Nhân Cách", "Tâm Lý", "Sách Cho Tuổi Mới Lớn"] },
    { id: "giao-khoa", name: "Sách Giáo Khoa - Tham Khảo", children: ["Sách Giáo Khoa", "Sách Tham Khảo", "Luyện thi ĐH, CĐ", "Mẫu Giáo"] },
    { id: "nuoi-day-con", name: "Sách Nuôi Dạy Con", children: ["Cẩm Nang Làm Cha Mẹ", "Phương Pháp Giáo Dục Trẻ Các Nước", "Phát Triển Trí Tuệ Cho Trẻ", "Phát Triển Kỹ Năng Cho Trẻ"] },
    { id: "sach-hoc-ngoai-ngu", name: "Sách Học Ngoại Ngữ", children: ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hoa", "Tiếng Hàn"] },
];

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

const easeOutBezier = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.45, ease: easeOutBezier },
    }),
};

function Reveal({
                    children,
                    index = 0,
                    className,
                }: {
    children: React.ReactNode;
    index?: number;
    className?: string;
}) {
    const ref = React.useRef<HTMLDivElement | null>(null);
    const inView = useInView(ref, { amount: 0.2, margin: "-10% 0px -10% 0px" });
    const controls = useAnimationControls();

    useEffect(() => {
        controls.start(inView ? "visible" : "hidden");
    }, [inView, controls]);

    return (
        <motion.div ref={ref} custom={index} initial="hidden" animate={controls} variants={fadeUp} className={className}>
            {children}
        </motion.div>
    );
}

/* ─────────────────────── Category Sidebar ─────────────────────── */
const CategorySidebar: React.FC = () => {
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const toggle = (id: string, hasChildren: boolean) => {
        if (!hasChildren) return;
        setOpen((o) => ({ ...o, [id]: !o[id] }));
    };

    return (
        <aside className="hidden lg:block w-64 shrink-0 pr-4 border-r">
            <div className="rounded-xl border bg-white overflow-hidden shadow-[0_10px_30px_rgba(2,6,23,.06)]">
                <h3 className="px-4 py-3 text-sm font-semibold bg-rose-50 text-gray-900">DANH MỤC SẢN PHẨM</h3>

                <nav className="divide-y">
                    {CATEGORIES.map((c) => {
                        const opened = !!open[c.id];
                        const hasChildren = !!c.children?.length;
                        const parentSlug = c.id;
                        return (
                            <div key={c.id}>
                                <Link to={`/danh-muc/${parentSlug}`} className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
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
                                    <div className="overflow-hidden transition-[max-height] duration-300 ease-in-out bg-white/60" style={{ maxHeight: opened ? `${(c.children!.length + 1) * 40}px` : "0px" }}>
                                        <ul className="py-1">
                                            {c.children!.map((child) => {
                                                const childSlug = toSlug(child);
                                                return (
                                                    <li key={child}>
                                                        <Link to={`/danh-muc/${childSlug}`} className="block py-2 pl-10 pr-4 text-[13px] text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
                                                            {child}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};

/* ───────────────────────── Banner Slider ───────────────────────── */
type HeroBannerProps = { images: string[]; intervalMs?: number };

const HeroBanner: React.FC<HeroBannerProps> = ({ images, intervalMs = 3000 }) => {
    const [index, setIndex] = useState(1);
    const [withTransition, setWithTransition] = useState(true);
    const timerRef = useRef<number | null>(null);
    const isHoverRef = useRef(false);
    const slides: string[] = [images[images.length - 1], ...images, images[0]];

    useEffect(() => {
        const start = () => {
            stop();
            timerRef.current = window.setInterval(() => {
                if (!isHoverRef.current) next();
            }, intervalMs);
        };
        const stop = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        start();
        return stop;
    }, [images.length, intervalMs]);

    const next = () => setIndex((i) => i + 1);
    const prev = () => setIndex((i) => i - 1);

    const onTransitionEnd = () => {
        if (index === slides.length - 1) {
            setWithTransition(false);
            setIndex(1);
            requestAnimationFrame(() => setWithTransition(true));
        } else if (index === 0) {
            setWithTransition(false);
            setIndex(slides.length - 2);
            requestAnimationFrame(() => setWithTransition(true));
        }
    };

    const real = (index - 1 + images.length) % images.length;

    return (
        <div
            className="relative flex-1 h-[260px] md:h-[360px] lg:h-[420px] rounded-xl overflow-hidden border bg-gray-100"
            onMouseEnter={() => (isHoverRef.current = true)}
            onMouseLeave={() => (isHoverRef.current = false)}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "ArrowLeft") prev();
                if (e.key === "ArrowRight") next();
            }}
            aria-roledescription="carousel"
            aria-label="Banner"
        >
            <div className={`flex h-full ${withTransition ? "transition-transform duration-700 ease-out" : "transition-none"}`} style={{ transform: `translateX(-${index * 100}%)` }} onTransitionEnd={onTransitionEnd}>
                {slides.map((src, i) => (
                    <div key={`${src}-${i}`} className="min-w-full h-full relative">
                        <img src={src} alt={`banner-${i}`} className="absolute inset-0 w-full h-full object-cover" aria-hidden={i !== index} />
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/0" />
                    </div>
                ))}
            </div>

            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/60 hover:text-gray-900 transition cursor-pointer" aria-label="Ảnh trước">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/60 hover:text-gray-900 transition cursor-pointer" aria-label="Ảnh sau">
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 w-full flex justify-center gap-2">
                        {images.map((_, i) => (
                            <button key={i} className={`w-2.5 h-2.5 rounded-full border ${i === real ? "bg-white border-white" : "bg-white/60 border-white/60"}`} onClick={() => setIndex(i + 1)} aria-label={`Chuyển đến ảnh ${i + 1}`} aria-pressed={i === real} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/* ───────────────────────── helpers ───────────────────────── */
const isSaleActive = (b: BookListItem) => {
    if (!b.salePrice) return false;
    const now = Date.now();
    const startOK = !b.saleStartAt || new Date(b.saleStartAt).getTime() <= now;
    const endOK = !b.saleEndAt || new Date(b.saleEndAt).getTime() >= now;
    return startOK && endOK;
};

/* ───────────────────────── page ───────────────────────── */
export default function HomePage() {
    const skeletonCount = 10;

    const [sp, setSp] = useSearchParams();
    const page = Math.max(1, Number(sp.get("page") ?? "1"));
    const size = Math.max(1, Number(sp.get("size") ?? "12"));
    const onPageChange = (p: number) => {
        sp.set("page", String(p));
        sp.set("size", String(size));
        setSp(sp, { replace: true });
    };

    const [newest, setNewest] = useState<BookListItem[]>([]);
    const [newestTotalPages, setNewestTotalPages] = useState(0);
    const [newestTotal, setNewestTotal] = useState(0);

    const [flashSale, setFlashSale] = useState<BookListItem[]>([]);
    const [bestSellers, setBestSellers] = useState<BookListItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const newestPage = await listBooks({ page, size, sort: "createdAt", direction: "DESC" });
                const flashPage = await listBooks({ page: 1, size: 12, sort: "createdAt", direction: "DESC" });
                const bestPage = await listBooks({ page: 1, size: 10, sort: "createdAt", direction: "DESC" });

                const newestItems = newestPage?.content ?? [];
                const flashAll = flashPage?.content ?? [];
                const bestItems = bestPage?.content ?? [];

                const sale = flashAll.filter(isSaleActive).slice(0, 10);
                const flashItems = sale.length > 0 ? sale : flashAll.slice(0, 10);

                if (mounted) {
                    setNewest(newestItems);
                    setNewestTotal(newestPage?.totalElements ?? 0);
                    setNewestTotalPages(newestPage?.totalPages ?? 0);
                    setFlashSale(flashItems);
                    setBestSellers(bestItems);
                }
            } catch {
                if (mounted) {
                    setNewest([]);
                    setNewestTotal(0);
                    setNewestTotalPages(0);
                    setFlashSale([]);
                    setBestSellers([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [page, size]);

    const renderGrid = (items: BookListItem[]) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading && items.length === 0
                ? Array.from({ length: skeletonCount }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded" />)
                : items.length > 0
                    ? items.map((b, i) => (
                        <Reveal key={b.id} index={i}>
                            <ProductCard item={b} />
                        </Reveal>
                    ))
                    : <div className="col-span-full text-center text-gray-500">Không có sản phẩm</div>}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-white">

            <main className="bg-gray-50 flex-1">
                <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6">
                    <div className="flex gap-4">
                        <CategorySidebar />
                        <HeroBanner images={BANNERS} intervalMs={3000} />
                    </div>
                </div>

                {/* Flash sale */}
                <Reveal>
                    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
                        <div className="rounded-2xl border bg-white/80 shadow overflow-hidden">
                            <SectionHeader label="Flash Sales" badge="Hôm nay" tone="rose" />
                            <div className="p-4">{renderGrid(flashSale)}</div>
                        </div>
                    </div>
                </Reveal>

                {/* Newest */}
                <Reveal>
                    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
                        <div className="rounded-2xl border bg-white/80 shadow overflow-hidden">
                            <SectionHeader label="Sản phẩm mới" badge={`Tổng ${newestTotal}`} tone="indigo" />
                            <div className="p-4">
                                {renderGrid(newest)}
                                <Pagination page={page} totalPages={Math.max(1, newestTotalPages)} onChange={onPageChange} />
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Bestseller */}
                <Reveal>
                    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6">
                        <div className="rounded-2xl border bg-white/80 shadow overflow-hidden">
                            <SectionHeader label="Sản phẩm bán chạy" badge="Tháng này" tone="rose" />
                            <div className="p-4">{renderGrid(bestSellers)}</div>
                        </div>
                    </div>
                </Reveal>

                {/* Services */}
                <div className="border-t bg-white">
                    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { Icon: Truck, title: "GIAO HÀNG MIỄN PHÍ VÀ NHANH CHÓNG", sub: "Miễn phí cho đơn hàng trên 500.000đ", tone: "rose" },
                            { Icon: Headphones, title: "Dịch vụ chăm sóc khách hàng 24/7", sub: "Hỗ trợ thân thiện mọi lúc", tone: "indigo" },
                            { Icon: ShieldCheck, title: "Thanh toán an toàn", sub: "Bảo mật thông tin & hoàn tiền", tone: "rose" },
                        ].map(({ Icon, title, sub, tone }, i) => (
                            <Reveal key={i} index={i} className="flex items-center gap-4 p-5 rounded-2xl border bg-white shadow">
                                <div className={`p-3 rounded-xl ${tone === "rose" ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100" : "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{title}</p>
                                    <p className="text-xs text-gray-500">{sub}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </main>

        </div>
    );
}

/* ───────────────────── Section Header ───────────────────── */
const SectionHeader: React.FC<{ label: string; badge?: string; tone?: "rose" | "indigo" }> = ({ label, badge, tone = "rose" }) => {
    const color =
        tone === "rose"
            ? { bar: "bg-rose-600", chipBg: "bg-rose-50", chipText: "text-rose-700", chipRing: "ring-rose-200", from: "from-rose-50", to: "to-white" }
            : { bar: "bg-indigo-600", chipBg: "bg-indigo-50", chipText: "text-indigo-700", chipRing: "ring-indigo-200", from: "from-indigo-50", to: "to-white" };

    return (
        <div className={`flex items-center justify-between px-4 py-3 border-b rounded-t-2xl bg-gradient-to-b ${color.from} ${color.to}`}>
            <div className="flex items-center gap-3">
                <span aria-hidden className={`h-7 w-2.5 md:w-3 rounded-full ${color.bar}`} />
                <h2 className="text-lg md:text-xl font-semibold tracking-tight">{label}</h2>
                {!!badge && <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${color.chipBg} ${color.chipText} ring-1 ${color.chipRing}`}>{badge}</span>}
            </div>
        </div>
    );
};
