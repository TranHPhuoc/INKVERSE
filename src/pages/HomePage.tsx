import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Headphones, ShieldCheck, Truck } from "lucide-react";
import {
  motion,
  type Variants,
  useInView,
  useAnimationControls,
  useMotionValue,
  useTransform as fmTransform,
} from "framer-motion";

import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import ErrorBoundary from "../components/ErrorBoundary";
import ProductCarousel from "../components/ProductCarousel";
import type { BookListItem, HomeFeed, SpringPage } from "../types/books";
import { getHomeFeed, listBooks } from "../types/books";

import banner1 from "../assets/bannerbooks1.png";
import banner2 from "../assets/BannerFlashsale.jpg";
import banner3 from "../assets/backgroundbooks.png";
import banner4 from "../assets/INKVERSE.SITE1.jpg";
import banner5 from "../assets/INKVERSE.SITE2.png";
import FeaturedAuthorsTabs from "../components/FeaturedAuthor";

/* ───────────────────────── constants ───────────────────────── */
const BANNERS: string[] = [banner1, banner2, banner3];
const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";
const FullBleed: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className = "",
  children,
}) => (
  <div className={`relative right-1/2 left-1/2 -mx-[50vw] w-screen ${className}`}>{children}</div>
);

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

/* ───────────────────────── Banner ───────────────────────── */
type HeroBannerProps = { images: string[]; intervalMs?: number; className?: string };

const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.65;

const HeroBanner: React.FC<HeroBannerProps> = ({ images, intervalMs = 3000, className }) => {
  const [index, setIndex] = useState(1);
  const [withTransition, setWithTransition] = useState(true);
  const timerRef = useRef<number | null>(null);
  const isHoverRef = useRef(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapW, setWrapW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const slides = images.length >= 1 ? [images.at(-1)!, ...images, images[0]!] : [];

  useEffect(() => {
    if (images.length < 2) return;
    const start = () => {
      stop();
      timerRef.current = window.setInterval(() => {
        if (!isHoverRef.current) next();
      }, intervalMs);
    };
    const stop = () => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    start();
    return stop;
  }, [images.length, intervalMs]);

  const next = () => setIndex((i) => i + 1);
  const prev = () => setIndex((i) => i - 1);

  const x = useMotionValue(0);

  const onTransitionSettled = () => {
    if (images.length < 1) return;
    if (index === slides.length - 1) {
      setWithTransition(false);
      setIndex(1);
      // x.set(wrapW) không cần * 1
      x.set(-wrapW);
      requestAnimationFrame(() => setWithTransition(true));
    } else if (index === 0) {
      setWithTransition(false);
      setIndex(slides.length - 2);
      x.set(-wrapW * (slides.length - 2));
      requestAnimationFrame(() => setWithTransition(true));
    }
  };

  const real = images.length ? (index - 1 + images.length) % images.length : 0;

  const trackTransition = withTransition
    ? { type: "tween" as const, ease: EASE, duration: DURATION }
    : { duration: 0 };

  return (
    <div
      ref={wrapRef}
      className={`relative aspect-[2240/1109] max-h-[820px] w-full overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
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
      <motion.div
        className="flex h-full will-change-transform"
        style={{ x, perspective: 1200, transformStyle: "preserve-3d" }}
        animate={{ x: -index * wrapW }}
        transition={trackTransition}
        onAnimationComplete={onTransitionSettled}
      >
        {slides.map((src, i) => {
          const range = [-(i + 1) * wrapW, -i * wrapW, -(i - 1) * wrapW];
          const rotateY = fmTransform(x, range, [18, 0, -18], { clamp: false });
          const scale = fmTransform(x, range, [0.94, 1, 0.94]);
          const opacity = fmTransform(x, range, [0.6, 1, 0.6]);

          return (
            <motion.div
              key={`${src}-${i}`}
              className="relative h-full min-w-full"
              style={{ rotateY, scale, opacity, transformStyle: "preserve-3d" }}
              transition={trackTransition}
            >
              <img
                src={src}
                alt={`banner-${i}`}
                className="absolute inset-0 h-full w-full object-cover"
                aria-hidden={i !== index}
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/0" />
            </motion.div>
          );
        })}
      </motion.div>

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 flex w-full justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === real ? "border-white bg-white" : "border-white/70 bg-white/60"
                }`}
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
  const flashRef = useRef<HTMLDivElement | null>(null);
  const newestRef = useRef<HTMLDivElement | null>(null);
  const bestRef = useRef<HTMLDivElement | null>(null);

  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newPage, setNewPage] = useState(1);
  const [newSize] = useState(18);
  const [newest, setNewest] = useState<BookListItem[]>([]);
  const [newTotalPages, setNewTotalPages] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingFeed(true);
        const res = await getHomeFeed();
        if (mounted) setFeed(res ?? null);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } }; message?: string }).response?.data
            ?.message ||
          (e as { message?: string }).message ||
          "Không tải được trang chủ";
        if (mounted) setErr(msg);
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

  // Grid cho "Sản phẩm mới"
  const renderGrid = (items: BookListItem[], loading: boolean) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {loading && (!items || items.length === 0) ? (
        Array.from({ length: 10 }).map((_, i) => (
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
  const bestSellers = feed?.bestSellers ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ErrorBoundary fallback={<div className="p-6 text-rose-600">Có lỗi khi tải trang chủ</div>}>
        <main className="flex-1 bg-gray-50">
          {/* Banner */}
          <div className="py-4">
            <div className={SHELL}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-8">
                  <HeroBanner images={BANNERS} intervalMs={3000} className="aspect-[16/9] w-full" />
                </div>

                <div className="hidden flex-col gap-4 lg:col-span-4 lg:flex">
                  <div className="overflow-hidden rounded-xl bg-gray-100">
                    <div className="aspect-[1120/540] w-full">
                      <img
                        src={banner4}
                        alt="Inkverse side banner 1"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-gray-100">
                    <div className="aspect-[1120/540] w-full">
                      <img
                        src={banner5}
                        alt="Inkverse side banner 2"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {err && (
            <div className="py-2">
              <div className={`${SHELL} text-rose-600`}>{err}</div>
            </div>
          )}

          {/* Flash sale – carousel 1 hàng × 6, step 1 */}
          <Reveal>
            <div className="py-6" ref={flashRef}>
              <div className={SHELL}>
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Flash sale</div>}
                >
                  <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                    <SectionHeader label="FLASH SALES" bg="bg-[#BE2623]" text="text-white" />
                    <div className="p-4">
                      <ProductCarousel items={flashSale} rows={1} cols={6} loading={loadingFeed} />
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Reveal>

          {/* Newest – giữ dạng lưới + phân trang */}
          <Reveal>
            <div className="py-6" ref={newestRef}>
              <div className={SHELL}>
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Sản phẩm mới</div>}
                >
                  <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                    <SectionHeader label="SẢN PHẨM MỚI" bg="bg-[#1E3A8A]" text="text-white" />
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

          {/* Featured Authors */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                  <SectionHeader label="TÁC GIẢ NỔI BẬT" bg="bg-[#0EA5E9]" text="text-white" />
                  <FeaturedAuthorsTabs />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Best Sellers – carousel 2 hàng × 6, step 1 cột */}
          <Reveal>
            <div className="py-6" ref={bestRef}>
              <div className={SHELL}>
                <ErrorBoundary
                  fallback={<div className="p-4 text-rose-600">Không tải được Bán chạy</div>}
                >
                  <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                    <SectionHeader label="SẢN PHẨM BÁN CHẠY" bg="bg-[#047857]" text="text-white" />
                    <div className="p-4">
                      <ProductCarousel
                        items={bestSellers}
                        rows={2}
                        cols={6}
                        loading={loadingFeed}
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </Reveal>

          {/* Services */}
          <FullBleed>
            <div className={`${SHELL} py-8`}>
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
                    title: "DỊCH VỤ CHĂM SÓC KHÁCH HÀNG 24/7",
                    sub: "Hỗ trợ thân thiện mọi lúc",
                    tone: "indigo" as const,
                  },
                  {
                    Icon: ShieldCheck,
                    title: "THANH TOÁN AN TOÀN",
                    sub: "Bảo mật thông tin & hoàn tiền",
                    tone: "rose" as const,
                  },
                ].map(({ Icon, title, sub, tone }, i) => (
                  <Reveal
                    key={i}
                    index={i}
                    className="flex items-center gap-4 rounded-2xl p-5 shadow"
                  >
                    <div
                      className={`${
                        tone === "rose"
                          ? "bg-rose-50 text-rose-600 ring-rose-100"
                          : "bg-indigo-50 text-indigo-600 ring-indigo-100"
                      } rounded-xl p-3 ring-1`}
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
          </FullBleed>
        </main>
      </ErrorBoundary>
    </div>
  );
}

/* ───────────────────── Section Header ───────────────────── */
const SectionHeader: React.FC<{
  label: string;
  badge?: string;
  /** Tailwind classes cho nền & chữ. Ví dụ: bg-[#BE2623] text-white */
  bg?: string;
  text?: string;
}> = ({ label, badge, bg = "bg-white", text = "text-gray-900" }) => {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-t-2xl border-b px-4 py-3",
        bg,
        text,
      ].join(" ")}
    >
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">{label}</h2>
      {!!badge && (
        <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-medium">
          {badge}
        </span>
      )}
    </div>
  );
};
