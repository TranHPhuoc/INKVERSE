// src/pages/HomePage.tsx
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Headphones, ShieldCheck, Truck } from "lucide-react";
import {
  motion,
  type Variants,
  type Transition,
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

/* ───────── constants ───────── */
const BANNERS = [banner1, banner2, banner3];
const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ───────── animations ───────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: EASE },
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
  const ref = useRef<HTMLDivElement | null>(null);
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

/* ───────── Hero Banner ───────── */
const DURATION = 0.65;

const HeroBanner: React.FC<{ images: string[]; intervalMs?: number; className?: string }> = ({
  images,
  intervalMs = 3000,
  className,
}) => {
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
    const stop = (): void => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    const start = (): void => {
      stop();
      timerRef.current = window.setInterval(() => {
        if (!isHoverRef.current) setIndex((i) => i + 1);
      }, intervalMs);
    };
    start();
    return stop;
  }, [images.length, intervalMs]);

  const x = useMotionValue(0);

  const onTransitionSettled = (): void => {
    if (images.length < 1) return;
    if (index === slides.length - 1) {
      setWithTransition(false);
      setIndex(1);
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

  // IMPORTANT: typing Transition explicitly + set undefined for else-branch (exactOptionalPropertyTypes)
  const trackTransition: Transition = {
    duration: withTransition ? DURATION : 0,
    ...(withTransition ? { type: "tween" as const, ease: EASE } : {}),
  };

  return (
    <div
      ref={wrapRef}
      className={`relative aspect-[2240/1109] max-h-[820px] w-full overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
      onMouseEnter={() => (isHoverRef.current = true)}
      onMouseLeave={() => (isHoverRef.current = false)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setIndex((i) => i - 1);
        if (e.key === "ArrowRight") setIndex((i) => i + 1);
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
              style={{ rotateY, scale, opacity }}
            >
              <img
                src={src}
                alt={`banner-${i}`}
                className="absolute inset-0 h-full w-full object-cover"
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
            onClick={() => setIndex((i) => i - 1)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex((i) => i + 1)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 flex w-full justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${i === real ? "bg-white" : "bg-white/60"}`}
                onClick={() => setIndex(i + 1)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ───────── main page ───────── */
export default function HomePage() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Newest grid (UI 1-based)
  const [newPage, setNewPage] = useState<number>(1);
  const [newest, setNewest] = useState<BookListItem[]>([]);
  const [newTotalPages, setNewTotalPages] = useState<number>(1);

  // Load home feed
  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      try {
        const res = await getHomeFeed();
        if (!cancelled) setFeed(res ?? null);
      } catch (e) {
        const msg =
          (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          (e as Error).message ||
          "Không tải được trang chủ";
        if (!cancelled) setErr(msg);
      }
    };
    void fetchFeed();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchNewest = async () => {
      try {
        const pageRes: SpringPage<BookListItem> = await listBooks({
          page: newPage,
          size: 18,
          sort: "createdAt",
          direction: "DESC",
          status: "ACTIVE",
        });
        if (!cancelled) {
          setNewest(pageRes?.content ?? []);
          setNewTotalPages(Math.max(1, pageRes?.totalPages ?? 1));
        }
      } catch {
        if (!cancelled) {
          setNewest([]);
          setNewTotalPages(1);
        }
      }
    };
    void fetchNewest();
    return () => {
      cancelled = true;
    };
  }, [newPage]);

  const validFlash = (feed?.featuredSale ?? []).filter((b) => {
    const now = Date.now();
    const s = !b.saleStartAt || new Date(b.saleStartAt).getTime() <= now;
    const e = !b.saleEndAt || new Date(b.saleEndAt).getTime() >= now;
    return !!b.salePrice && s && e;
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ErrorBoundary fallback={<div className="p-6 text-rose-600">Có lỗi khi tải trang chủ</div>}>
        <main className="flex-1 bg-gray-50">
          {/* Banner */}
          <div className="py-4">
            <div className={SHELL}>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <HeroBanner images={BANNERS} />
                </div>
                <div className="hidden flex-col gap-4 lg:col-span-4 lg:flex">
                  {[banner4, banner5].map((b, i) => (
                    <div key={i} className="overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={b}
                        alt={`side-${i}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {err && (
            <div className="py-2">
              <div className={`${SHELL} text-rose-600`}>{err}</div>
            </div>
          )}

          {/* Flash Sales */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                  <SectionHeader label="FLASH SALES" bg="bg-[#BE2623]" text="text-white" />
                  <div className="p-4">
                    <ProductCarousel
                      items={validFlash}
                      endpoint="/books"
                      params={{ status: "ACTIVE", sort: "saleEndAt", direction: "ASC" }}
                      rows={1}
                      cols={6}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Newest */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                  <SectionHeader label="SẢN PHẨM MỚI" bg="bg-[#1E3A8A]" text="text-white" />
                  <div className="p-4">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                      {newest.length > 0
                        ? newest.map((b, i) => (
                            <Reveal key={b.id ?? `${i}`} index={i}>
                              <ProductCard item={b} />
                            </Reveal>
                          ))
                        : Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-64 rounded bg-gray-100" />
                          ))}
                    </div>
                    <Pagination
                      page={newPage}
                      totalPages={newTotalPages}
                      onChange={setNewPage}
                      autoScrollTop
                    />
                  </div>
                </div>
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

          {/* Best Sellers */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <div className="overflow-hidden rounded-2xl bg-white/80 shadow">
                  <SectionHeader label="SẢN PHẨM BÁN CHẠY" bg="bg-[#047857]" text="text-white" />
                  <div className="p-4">
                    <ProductCarousel
                      items={feed?.bestSellers ?? []}
                      endpoint="/books"
                      params={{ status: "ACTIVE", sort: "sold", direction: "DESC" }}
                      rows={2}
                      cols={6}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Services */}
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
        </main>
      </ErrorBoundary>
    </div>
  );
}

/* ───────── Section Header ───────── */
const SectionHeader: React.FC<{ label: string; badge?: string; bg?: string; text?: string }> = ({
  label,
  badge,
  bg = "bg-white",
  text = "text-gray-900",
}) => (
  <div
    className={`flex items-center justify-center rounded-t-2xl border-b px-4 py-3 ${bg} ${text}`}
  >
    <h2 className="text-lg font-semibold tracking-tight md:text-xl">{label}</h2>
    {!!badge && (
      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[11px] font-medium">
        {badge}
      </span>
    )}
  </div>
);
