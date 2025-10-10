import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Images */
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

/* ================= Types ================= */
type TabKey = "vn" | "intl";

type FeaturedAuthorItem = {
  id?: number;
  name: string;
  avatar?: string | null;
  slug?: string;
};

/* ================= Slug map  ================= */
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

/* ================= Data ================= */
const DOMESTIC: FeaturedAuthorItem[] = [
  { id: 50, name: "Nguyễn Nhật Ánh", avatar: NguyenNhatAnh }, //11
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

const TABS: { key: TabKey; label: string; data: FeaturedAuthorItem[] }[] = [
  { key: "vn", label: "Tác giả Việt Nam", data: DOMESTIC },
  { key: "intl", label: "Tác giả nước ngoài", data: INTERNATIONAL },
];

const easeOutBezier = [0.22, 1, 0.36, 1] as const;

/* ================= Helpers ================= */
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

/* ================= Grid ================= */
function AuthorGrid({ authors }: { authors: FeaturedAuthorItem[] }) {
  return (
    <motion.ul
      key={authors[0]?.name ?? "grid"}
      className="grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.38, ease: easeOutBezier }}
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
            transition={{ delay: i * 0.045, duration: 0.28, ease: easeOutBezier }}
          >
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center"
              aria-label={`Xem thông tin của ${a.name}`}
            >
              <motion.div
                className="relative h-24 w-24 overflow-hidden rounded-full border bg-white shadow"
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
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-gray-700">
                    {initialsOf(a.name)}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-0 transition-[box-shadow,ring-width] duration-300 group-hover:ring-4 group-hover:ring-rose-100/70" />
              </motion.div>

              <div className="mt-2 line-clamp-1 text-center text-sm text-gray-700">{a.name}</div>
            </a>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ================= Main ================= */
export default function FeaturedAuthorsTabs({ className = "" }: { className?: string }) {
  const [active, setActive] = useState<TabKey>("vn");
  const current = useMemo<FeaturedAuthorItem[]>(
    () => TABS.find((t) => t.key === active)?.data ?? [],
    [active],
  );

  return (
    <div className={className}>
      {/* Tabs */}
      <div className="relative flex gap-6 border-b px-4 pt-3">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`relative cursor-pointer pb-2 text-sm font-semibold transition-colors ${
                isActive ? "text-rose-600" : "text-gray-600 hover:text-gray-900"
              }`}
              aria-pressed={isActive}
            >
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="authors-underline"
                  className="absolute inset-x-0 -bottom-[2px] h-[2px] bg-rose-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <AuthorGrid key={active} authors={current} />
        </AnimatePresence>
      </div>
    </div>
  );
}
