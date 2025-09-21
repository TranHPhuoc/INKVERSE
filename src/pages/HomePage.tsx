import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { motion, type Variants, useInView, useAnimationControls } from "framer-motion";

import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import ErrorBoundary from "../components/ErrorBoundary";

import type { BookListItem, HomeFeed, SpringPage } from "../types/books";
import { getHomeFeed, listBooks } from "../types/books";

import banner1 from "../assets/bannerbooks1.png";
import banner2 from "../assets/bannerbooks2.jpeg";
import banner3 from "../assets/backgroundbooks.png";

/* ───────────────────────── constants ───────────────────────── */
type Category = { id: string; name: string; children?: string[] };
const BANNERS: string[] = [banner1, banner2, banner3];

const CATEGORIES: Category[] = [
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
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={controls}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */
const isSaleActive = (b: BookListItem) => {
  if (!b?.salePrice) return false;
  const now = Date.now();
  const startOK = !b.saleStartAt || new Date(b.saleStartAt).getTime() <= now;
  const endOK = !b.saleEndAt || new Date(b.saleEndAt).getTime() >= now;
  return startOK && endOK;
};

/* ───────────────────────── components ───────────────────────── */
const CategorySidebar: React.FC = () => {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (id: string, hasChildren: boolean) => {
    if (hasChildren) setOpen((o) => ({ ...o, [id]: !o[id] }));
  };
  return (
    <aside className="hidden w-[440px] shrink-0 border-r pr-4 lg:block">
      <div className="overflow-hidden rounded-xl border bg-white shadow-[0_10px_30px_rgba(2,6,23,.06)]">
        <h3 className="bg-rose-50 px-4 py-3 text-base font-semibold text-gray-900">
          DANH MỤC SẢN PHẨM
        </h3>
        <nav className="divide-y">
          {CATEGORIES.map((c) => {
            const opened = !!open[c.id];
            const hasChildren = !!c.children?.length;
            return (
              <div key={c.id}>
                <a
                  href={`/danh-muc/${c.id}`}
                  className="flex w-full items-center justify-between px-5 py-3 text-[15px] font-medium hover:bg-gray-50"
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
                </a>

                {hasChildren && (
                  <div
                    className="overflow-hidden bg-white/60 transition-[max-height] duration-300 ease-in-out"
                    style={{ maxHeight: opened ? `${(c.children!.length + 1) * 40}px` : "0px" }}
                  >
                    <ul className="py-1">
                      {c.children!.map((child) => (
                        <li key={child}>
                          <a
                            href={`/danh-muc/${toSlug(child)}`}
                            className="block py-2 pr-4 pl-12 text-[14px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            {child}
                          </a>
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
    </aside>
  );
};

type HeroBannerProps = { images: string[]; intervalMs?: number };
const HeroBanner: React.FC<HeroBannerProps & { className?: string }> = ({
  images,
  intervalMs = 3000,
  className,
}) => {
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
      className={`relative aspect-[2240/1109] max-h-[650px] w-full overflow-hidden rounded-xl border bg-gray-100 ${className}`}
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
      <div
        className={`flex h-full ${withTransition ? "transition-transform duration-700 ease-out" : "transition-none"}`}
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTransitionEnd={onTransitionEnd}
      >
        {slides.map((src, i) => (
          <div key={`${src}-${i}`} className="relative h-full min-w-full">
            <img
              src={src}
              alt={`banner-${i}`}
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden={i !== index}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/0" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/60 hover:text-gray-900"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/60 hover:text-gray-900"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 flex w-full justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                className={`h-2.5 w-2.5 rounded-full border ${i === real ? "border-white bg-white" : "border-white/60 bg-white/60"}`}
                onClick={() => setIndex(i + 1)}
                aria-label={`Chuyển đến ảnh ${i + 1}`}
                aria-pressed={i === real}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ───────────────────────── page ───────────────────────── */
export default function HomePage() {
  const skeletonCount = 10;

  const flashRef = useRef<HTMLDivElement | null>(null);
  const newestRef = useRef<HTMLDivElement | null>(null);
  const bestRef = useRef<HTMLDivElement | null>(null);

  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newPage, setNewPage] = useState(1);
  const [newSize] = useState(15);
  const [newest, setNewest] = useState<BookListItem[]>([]);
  const [newTotalPages, setNewTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingFeed(true);
        const res = await getHomeFeed();
        if (mounted) setFeed(res ?? null);
      } catch (e: any) {
        if (mounted) setErr(e?.response?.data?.message || e?.message || "Không tải được trang chủ");
      } finally {
        if (mounted) setLoadingFeed(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const pageRes: SpringPage<BookListItem> = await listBooks({
          page: newPage,
          size: newSize,
          sort: "createdAt",
          direction: "DESC",
          status: "ACTIVE",
        });
        if (!mounted) return;
        setNewest(pageRes?.content ?? []);
        setNewTotalPages(Math.max(1, pageRes?.totalPages ?? 1));
      } catch {
        if (mounted) {
          setNewest([]);
          setNewTotalPages(1);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [newPage, newSize]);

  // Grid tự fill cột
  const renderGrid = (items: BookListItem[], loading: boolean) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {loading && (!items || items.length === 0) ? (
        Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="h-64 rounded bg-gray-100" />
        ))
      ) : items && items.length > 0 ? (
        items.map((b, i) => (
          <Reveal key={b.id ?? `${i}`} index={i}>
            <ProductCard item={b} />
          </Reveal>
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500">Không có sản phẩm</div>
      )}
    </div>
  );

  const flashSale = useMemo(() => (feed?.featuredSale ?? []).filter(isSaleActive), [feed]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ErrorBoundary fallback={<div className="p-6 text-rose-600">Có lỗi khi tải trang chủ</div>}>
        <main className="flex-1 bg-gray-50">
          {/* Banner (khung 1990px) */}
          <div className="w-full px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
            <div className="mx-auto flex max-w-[1990px] gap-4">
              <CategorySidebar />
              <HeroBanner images={BANNERS} intervalMs={3000} className="w-[1550px]" />
            </div>
          </div>

          {err && (
            <div className="w-full px-4 md:px-6 xl:px-10 2xl:px-14">
              <div className="mx-auto max-w-[1990px] text-rose-600">{err}</div>
            </div>
          )}

          {/* Flash sale */}
          <Reveal>
            <div className="w-full px-4 py-6 md:px-6 xl:px-10 2xl:px-14" ref={flashRef}>
              <div className="mx-auto max-w-[1990px]">
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Flash sale</div>}
                >
                  <div className="overflow-hidden rounded-2xl border bg-white/80 shadow">
                    <SectionHeader
                      label="Flash Sales"
                      badge={`${flashSale.length} sản phẩm`}
                      tone="rose"
                    />
                    <div className="p-4">{renderGrid(flashSale, loadingFeed)}</div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Reveal>

          {/* Newest */}
          <Reveal>
            <div className="w-full px-4 py-6 md:px-6 xl:px-10 2xl:px-14" ref={newestRef}>
              <div className="mx-auto max-w-[1990px]">
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Sản phẩm mới</div>}
                >
                  <div className="overflow-hidden rounded-2xl border bg-white/80 shadow">
                    <SectionHeader
                      label="Sản phẩm mới"
                      badge={`${newSize} / trang`}
                      tone="indigo"
                    />
                    <div className="p-4">
                      {renderGrid(newest, false)}
                      <Pagination
                        page={newPage}
                        totalPages={newTotalPages}
                        onChange={setNewPage}
                        scrollTarget={newestRef}
                        autoScrollTop
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Reveal>

          {/* Bestseller */}
          <Reveal>
            <div className="w-full px-4 py-6 md:px-6 xl:px-10 2xl:px-14" ref={bestRef}>
              <div className="mx-auto max-w-[1990px]">
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Bán chạy</div>}
                >
                  <div className="overflow-hidden rounded-2xl border bg-white/80 shadow">
                    <SectionHeader
                      label="Sản phẩm bán chạy"
                      badge={`${feed?.bestSellers?.length ?? 0} sản phẩm`}
                      tone="rose"
                    />
                    <div className="p-4">{renderGrid(feed?.bestSellers ?? [], loadingFeed)}</div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Reveal>

          {/* Services */}
          <div className="border-t bg-white">
            <div className="w-full px-4 py-8 md:px-6 xl:px-10 2xl:px-14">
              <div className="mx-auto max-w-[1990px]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    {
                      Icon: Truck,
                      title: "GIAO HÀNG MIỄN PHÍ VÀ NHANH CHÓNG",
                      sub: "Miễn phí cho đơn hàng trên 500.000đ",
                      tone: "rose" as const,
                    },
                    {
                      Icon: Headphones,
                      title: "Dịch vụ chăm sóc khách hàng 24/7",
                      sub: "Hỗ trợ thân thiện mọi lúc",
                      tone: "indigo" as const,
                    },
                    {
                      Icon: ShieldCheck,
                      title: "Thanh toán an toàn",
                      sub: "Bảo mật thông tin & hoàn tiền",
                      tone: "rose" as const,
                    },
                  ].map(({ Icon, title, sub, tone }, i) => (
                    <Reveal
                      key={i}
                      index={i}
                      className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow"
                    >
                      <div
                        className={`${tone === "rose" ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-indigo-50 text-indigo-600 ring-indigo-100"} rounded-xl p-3 ring-1`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
}

/* ───────────────────── Section Header ───────────────────── */
const SectionHeader: React.FC<{ label: string; badge?: string; tone?: "rose" | "indigo" }> = ({
  label,
  badge,
  tone = "rose",
}) => {
  const color =
    tone === "rose"
      ? {
          bar: "bg-rose-600",
          chipBg: "bg-rose-50",
          chipText: "text-rose-700",
          chipRing: "ring-rose-200",
          from: "from-rose-50",
          to: "to-white",
        }
      : {
          bar: "bg-indigo-600",
          chipBg: "bg-indigo-50",
          chipText: "text-indigo-700",
          chipRing: "ring-indigo-200",
          from: "from-indigo-50",
          to: "to-white",
        };

  return (
    <div
      className={`flex items-center justify-between rounded-t-2xl border-b bg-gradient-to-b px-4 py-3 ${color.from} ${color.to}`}
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className={`h-7 w-2.5 rounded-full md:w-3 ${color.bar}`} />
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">{label}</h2>
        {!!badge && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ${color.chipBg} ${color.chipText} ring-1 ${color.chipRing}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
