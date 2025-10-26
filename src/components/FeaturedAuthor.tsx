import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ===== Images ===== */
import NguyenNhatAnh from "../assets/authors/NguyenNhatAnh.jpg";
import ToHoai from "../assets/authors/ToHoai.jpg";
import NamCao from "../assets/authors/NamCao.jpg";
import VuTrongPhung from "../assets/authors/VuTrongPhung.jpg";
import MaVanKhang from "../assets/authors/Nha-van-Ma-Van-Khang.png";
import NguyenNgocTu from "../assets/authors/NguyenNgocTu.jpg";
import TranDangKhoa from "../assets/authors/TranDangKhoa.jpg";

import JKRowling from "../assets/authors/J.K. Rowling.jpg";
import AgathaChristie from "../assets/authors/AgathaChristie.jpg";
import PauloCoelho from "../assets/authors/PauloCoelho.jpg";
import StephenKing from "../assets/authors/StephenKing.webp";
import WarrenBuffett from "../assets/authors/warrenbuffett.webp";
import ArthurConanDoyle from "../assets/authors/ArthurConanDoyle.jpg";
import NapoleonHill from "../assets/authors/NapoleonHill.jpg";

/* ===== Types ===== */
type TabKey = "vn" | "intl";

type FeaturedAuthorItem = {
  id?: number;
  name: string;
  avatar?: string | null;
  slug?: string;
};

/* ===== Slug Map ===== */
const SLUG_MAP: Record<string, string> = {
  "Nguyễn Nhật Ánh": "nguyen-nhat-anh",
  "Tô Hoài": "to-hoai",
  "Nam Cao": "nam-cao",
  "Vũ Trọng Phụng": "vu-trong-phung",
  "Ma Văn Kháng": "ma-van-khang",
  "Nguyễn Ngọc Tư": "nguyen-ngoc-tu",
  "Trần Đăng Khoa": "tran-dang-khoa",
  "Warren Buffett": "warren-buffett",
  "J.K. Rowling": "jk-rowling",
  "Agatha Christie": "agatha-christie",
  "Paulo Coelho": "paulo-coelho",
  "Stephen King": "stephen-king",
  "Arthur Conan Doyle": "arthur-conan-doyle",
  "Napoleon Hill": "napoleon-hill",
};

/* ===== Data ===== */
const DOMESTIC: FeaturedAuthorItem[] = [
  { id: 11, name: "Nguyễn Nhật Ánh", avatar: NguyenNhatAnh },
  { id: 52, name: "Tô Hoài", avatar: ToHoai },
  { id: 18, name: "Nam Cao", avatar: NamCao },
  { id: 19, name: "Vũ Trọng Phụng", avatar: VuTrongPhung },
  { id: 55, name: "Ma Văn Kháng", avatar: MaVanKhang },
  { id: 56, name: "Nguyễn Ngọc Tư", avatar: NguyenNgocTu },
  { id: 57, name: "Trần Đăng Khoa", avatar: TranDangKhoa },
];

const INTERNATIONAL: FeaturedAuthorItem[] = [
  { id: 58, name: "Warren Buffett", avatar: WarrenBuffett },
  { id: 59, name: "J.K. Rowling", avatar: JKRowling },
  { id: 60, name: "Agatha Christie", avatar: AgathaChristie },
  { id: 6, name: "Paulo Coelho", avatar: PauloCoelho },
  { id: 61, name: "Stephen King", avatar: StephenKing },
  { id: 62, name: "Arthur Conan Doyle", avatar: ArthurConanDoyle },
  { id: 43, name: "Napoleon Hill", avatar: NapoleonHill },
];

const TABS = [
  { key: "vn" as const, label: "Tác giả Việt Nam", data: DOMESTIC },
  { key: "intl" as const, label: "Tác giả nước ngoài", data: INTERNATIONAL },
];

const easeOutBezier = [0.22, 1, 0.36, 1] as const;

/* ===== Tab theme ===== */
const TAB_THEME: Record<TabKey, { text: string; start: string; end: string }> = {
  vn: { text: "#F0F8FF", start: "#FFFFFF", end: "#DCEBFF" },
  intl: { text: "#F0F8FF", start: "#FFFFFF", end: "#DCEBFF" },
};

/* ===== Helpers ===== */
function toSlug(name: string, fallback?: string): string {
  if (fallback && fallback.trim()) return fallback.trim();
  const mapped = SLUG_MAP[name];
  if (mapped) return mapped;
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

function initialsOf(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const lastTwo = parts.slice(-2);
  const ini = lastTwo.map((s) => (s[0] ?? "").toUpperCase()).join("");
  return ini || (name[0]?.toUpperCase() ?? "A");
}

/* ===== Author Grid ===== */
function AuthorGrid({ authors }: { authors: FeaturedAuthorItem[] }) {
  return (
    <motion.ul
      key={authors[0]?.name ?? "grid"}
      className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: easeOutBezier }}
    >
      {authors.map((a, i) => {
        const slug = toSlug(a.name, a.slug);
        const href =
          a.id != null
            ? `/author/${encodeURIComponent(slug)}?authorId=${a.id}`
            : `/author/${encodeURIComponent(slug)}`;

        return (
          <motion.li
            key={`${slug}-${a.id ?? i}`}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: easeOutBezier }}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center"
              aria-label={`Xem thông tin của ${a.name}`}
            >
              <motion.div
                className="relative h-24 w-24 overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 shadow-md ring-0 transition-all duration-300 group-hover:ring-2 group-hover:ring-amber-500/40"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                {a.avatar ? (
                  <img
                    src={a.avatar}
                    alt={a.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-gray-500">
                    {initialsOf(a.name)}
                  </div>
                )}
              </motion.div>

              <div className="mt-2 line-clamp-1 text-center text-sm text-slate-800/90 transition-colors group-hover:text-slate-900">
                {a.name}
              </div>
            </a>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ===== Main Component ===== */
export default function FeaturedAuthorsTabs({ className = "" }: { className?: string }) {
  const [active, setActive] = useState<TabKey>("vn");
  const current = useMemo<FeaturedAuthorItem[]>(
    () => TABS.find((t) => t.key === active)?.data ?? [],
    [active],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-300/40 p-6 shadow-[0_10px_30px_rgba(146,84,0,0.25)] ${className}`}
    >
      {/* BG */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
      linear-gradient(
        180deg,
        #2F6FE1 0%,
        #5FA0F6 28%,
        #9DC7FF 60%,
        #EAF4FF 85%,
        #FFFFFF 100%
      )
    `,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
      linear-gradient(180deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.22) 100%),
      radial-gradient(120% 70% at 50% -10%, rgba(255,255,255,0.35), transparent 70%),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 26px),
      repeating-linear-gradient(-45deg, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 26px)
    `,
          mixBlendMode: "soft-light",
        }}
      />

      <h2 className="relative z-10 mb-6 text-center text-2xl font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        TÁC GIẢ NỔI BẬT
      </h2>

      {/* Tabs */}
      <div className="relative z-10 mb-6">
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = active === t.key;
            const theme = TAB_THEME[t.key];
            const activeStyle = isActive
              ? ({ color: theme.text } as React.CSSProperties)
              : undefined;

            return (
              <motion.button
                key={t.key}
                onClick={() => setActive(t.key)}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`relative cursor-pointer pb-2 text-sm font-medium transition-colors duration-200 md:text-base ${
                  isActive
                    ? "drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]"
                    : "text-slate-800/80 hover:text-slate-900"
                }`}
                style={activeStyle as unknown as import("framer-motion").MotionStyle}
                aria-pressed={isActive}
              >
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="authors-underline"
                    className="absolute right-0 -bottom-[1px] left-0 h-[2px] rounded-full"
                    style={{ background: `linear-gradient(90deg, ${theme.start}, ${theme.end})` }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 p-2">
        <AnimatePresence mode="wait">
          <AuthorGrid key={active} authors={current} />
        </AnimatePresence>
      </div>
    </div>
  );
}
