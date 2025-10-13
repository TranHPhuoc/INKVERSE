// src/pages/HomePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Truck,
  Zap,
  Sprout,
  PenTool,
  TrendingUp,
} from "lucide-react";
import {
  motion,
  type Variants,
  type Transition,
  useInView,
  useAnimationControls,
  useMotionValue,
  animate as fmAnimate,
} from "framer-motion";

import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import ErrorBoundary from "../components/ErrorBoundary";
import ProductCarousel from "../components/ProductCarousel";
import type { BookListItem, HomeFeed } from "../types/books";
import { getHomeFeed, listBooks } from "../types/books";

import banner1 from "../assets/bannerbooks1.png";
import banner2 from "../assets/BannerFlashsale.jpg";
import banner3 from "../assets/backgroundbooks.png";
import banner4 from "../assets/INKVERSE.SITE1.jpg";
import banner5 from "../assets/INKVERSE.SITE2.png";
import FeaturedAuthorsTabs from "../components/FeaturedAuthor";

/* ===== constants ===== */
const BANNERS = [banner1, banner2, banner3];
const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ===== animations ===== */
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
    void controls.start(inView ? "visible" : "hidden");
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

/* ===== Hero Banner ===== */
const DURATION = 0.65;

const HeroBanner: React.FC<{ images: string[]; intervalMs?: number; className?: string }> = ({
  images,
  intervalMs = 3000,
  className,
}) => {
  const hasCarousel = images.length >= 2;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ok = true;
    const preload = async () => {
      await Promise.all(
        images.map(
          (src) =>
            new Promise<void>((res) => {
              const img = new Image();
              img.onload = () => res();
              img.onerror = () => res();
              img.src = src;
            }),
        ),
      );
      if (ok) setLoaded(true);
    };
    if (images.length) void preload();
    return () => {
      ok = false;
    };
  }, [images]);

  const [index, setIndex] = useState(1);
  const timerRef = useRef<number | null>(null);
  const isHoverRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapW, setWrapW] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(Math.max(1, el.clientWidth || 1)));
    ro.observe(el);
    setWrapW(Math.max(1, el.clientWidth || 1));
    return () => ro.disconnect();
  }, []);

  const x = useMotionValue(0);
  const slides = useMemo(
    () => (images.length ? [images.at(-1)!, ...images, images[0]!] : []),
    [images],
  );

  useEffect(() => {
    x.set(-index * wrapW);
  }, [wrapW]);

  // autoplay
  useEffect(() => {
    if (!hasCarousel || !loaded) return;
    const stop = () => {
      if (timerRef.current != null) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    const start = () => {
      stop();
      timerRef.current = window.setInterval(() => {
        if (!isHoverRef.current && !isAnimatingRef.current) {
          setIndex((i) => i + 1);
        }
      }, intervalMs);
    };
    start();
    return stop;
  }, [hasCarousel, loaded, intervalMs]);

  const transition: Transition = { duration: DURATION, ease: [0.22, 1, 0.36, 1] };

  useEffect(() => {
    if (!slides.length) return;
    const total = slides.length;
    const w = Math.max(1, wrapW);
    isAnimatingRef.current = true;

    const controls = fmAnimate(x, -index * w, transition);
    controls.then(() => {
      isAnimatingRef.current = false;

      if (index === total - 1) {
        x.set(-1 * w);
        setIndex(1);
      } else if (index === 0) {
        x.set(-1 * (total - 2) * w);
        setIndex(total - 2);
      }
    });
    return () => controls.stop();
  }, [index, slides.length, wrapW, x]);

  const go = (dir: -1 | 1) => {
    if (!hasCarousel || !loaded) return;
    if (isAnimatingRef.current) return;
    setIndex((i) => i + dir);
  };

  return (
    <div
      ref={wrapRef}
      className={`relative aspect-[2240/1109] max-h-[820px] w-full overflow-hidden rounded-xl bg-gray-100 ${className ?? ""}`}
      onMouseEnter={() => (isHoverRef.current = true)}
      onMouseLeave={() => (isHoverRef.current = false)}
    >
      {!loaded ? (
        <div className="h-full w-full animate-pulse bg-gray-100" />
      ) : (
        <motion.div className="flex h-full will-change-transform" style={{ x }}>
          {slides.map((src, i) => (
            <div key={i} className="relative h-full min-w-full">
              <img
                src={src}
                alt={`banner-${i}`}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/0" />
            </div>
          ))}
        </motion.div>
      )}

      {hasCarousel && loaded && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/25 p-2 text-white backdrop-blur transition hover:bg-white/70 hover:text-gray-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

/* ===== helpers ===== */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  const n =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const int = parseInt(n, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/* ===== FlashSaleCard ===== */
const FlashSaleCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const RED = "#DC2626";
  return (
    <div className="relative overflow-hidden rounded-2xl shadow ring-1 ring-black/5">
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
        style={{
          background: `linear-gradient(180deg,
            ${rgba(RED, 0.78)} 0%,
            ${rgba(RED, 0.42)} 32%,
            ${rgba(RED, 0.16)} 68%,
            ${rgba(RED, 0.0)} 100%),
            radial-gradient(110% 65% at 50% -10%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 55%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-center rounded-t-2xl px-4 py-3">
          <h2
            className="text-lg font-semibold tracking-tight text-white md:text-xl"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
          >
            FLASH SALES
          </h2>
        </div>
        <div className="p-4">{children}</div>
      </div>

      <motion.div
        className="absolute -top-2 left-4 z-[1] opacity-25"
        animate={{ y: [0, 6, 0], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Zap className="h-9 w-9 text-white" />
      </motion.div>
      <motion.div
        className="absolute top-8 right-6 z-[1] rotate-12 opacity-20"
        animate={{ y: [0, -5, 0], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
      >
        <Zap className="h-11 w-11 text-white" />
      </motion.div>
    </div>
  );
};

type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;

const GradientSectionCard: React.FC<{
  label: string;
  startHex: `#${string}`;
  endHex: `#${string}`;
  Icon: LucideIcon;
  children: React.ReactNode;
}> = ({ label, startHex, endHex, Icon, children }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl shadow ring-1 ring-black/5">
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
        style={{
          background: `linear-gradient(180deg,
            ${rgba(startHex, 0.65)} 0%,
            ${rgba(endHex, 0.32)} 40%,
            ${rgba(endHex, 0.12)} 75%,
            ${rgba(endHex, 0.0)} 100%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-center rounded-t-2xl px-4 py-3">
          <h2 className="text-lg font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] md:text-xl">
            {label}
          </h2>
        </div>
        <div className="p-4">{children}</div>
      </div>
      <motion.div
        className="absolute -top-2 left-4 z-[1] opacity-25"
        animate={{ y: [0, 6, 0], opacity: [0.18, 0.3, 0.18] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="h-9 w-9 text-white" />
      </motion.div>
      <motion.div
        className="absolute top-8 right-6 z-[1] rotate-12 opacity-20"
        animate={{ y: [0, -5, 0], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
      >
        <Icon className="h-11 w-11 text-white" />
      </motion.div>
    </div>
  );
};

/* ===== Page ===== */
export default function HomePage() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [, setErr] = useState<string | null>(null);

  const [newPage, setNewPage] = useState(1);
  const [newest, setNewest] = useState<BookListItem[]>([]);
  const [newTotalPages, setNewTotalPages] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await getHomeFeed();
        setFeed(res ?? null);
      } catch {
        setErr("Không tải được trang chủ");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await listBooks({
          page: newPage,
          size: 18,
          sort: "createdAt",
          direction: "DESC",
          status: "ACTIVE",
        });
        setNewest(res?.content ?? []);
        setNewTotalPages(Math.max(1, res?.totalPages ?? 1));
      } catch {
        setNewest([]);
      }
    })();
  }, [newPage]);

  const flash = feed?.featuredSale ?? [];

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
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Flash Sales */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <FlashSaleCard>
                  <ProductCarousel
                    items={flash}
                    rows={1}
                    cols={6}
                    emptyHint={flash.length === 0 ? "Hiện chưa có chương trình Flash Sale." : ""}
                  />
                </FlashSaleCard>
              </div>
            </div>
          </Reveal>

          {/* Newest */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <GradientSectionCard
                  label="SẢN PHẨM MỚI"
                  startHex="#2563EB"
                  endHex="#38BDF8"
                  Icon={Sprout}
                >
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                    {newest.length > 0
                      ? newest.map((b, i) => (
                          <Reveal key={b.id ?? `${i}`} index={i}>
                            <ProductCard item={b} />
                          </Reveal>
                        ))
                      : Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="h-64 animate-pulse rounded bg-gray-100" />
                        ))}
                  </div>
                  <Pagination
                    page={newPage}
                    totalPages={newTotalPages}
                    onChange={setNewPage}
                    autoScrollTop
                  />
                </GradientSectionCard>
              </div>
            </div>
          </Reveal>

          {/* Featured Authors */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <GradientSectionCard
                  label="TÁC GIẢ NỔI BẬT"
                  startHex="#7E22CE"
                  endHex="#3B82F6"
                  Icon={PenTool}
                >
                  <FeaturedAuthorsTabs />
                </GradientSectionCard>
              </div>
            </div>
          </Reveal>

          {/* Best Sellers */}
          <Reveal>
            <div className="py-6">
              <div className={SHELL}>
                <GradientSectionCard
                  label="SẢN PHẨM BÁN CHẠY"
                  startHex="#10B981"
                  endHex="#34D399"
                  Icon={TrendingUp}
                >
                  <ProductCarousel
                    items={feed?.bestSellers ?? []}
                    rows={2}
                    cols={6}
                    emptyHint={
                      (feed?.bestSellers?.length ?? 0) === 0 ? "Chưa có sản phẩm bán chạy." : ""
                    }
                  />
                </GradientSectionCard>
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
                },
                {
                  Icon: Headphones,
                  title: "CHĂM SÓC KHÁCH HÀNG 24/7",
                  sub: "Hỗ trợ thân thiện mọi lúc",
                },
                {
                  Icon: ShieldCheck,
                  title: "THANH TOÁN AN TOÀN",
                  sub: "Bảo mật thông tin & hoàn tiền",
                },
              ].map(({ Icon, title, sub }, i) => (
                <Reveal
                  key={i}
                  index={i}
                  className="flex items-center gap-4 rounded-2xl p-5 shadow"
                >
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 ring-1 ring-indigo-100">
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
