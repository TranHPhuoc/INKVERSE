// src/components/HeaderCategoryMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, type NavigateFunction } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getCategoryTree, type CategoryTree } from "../types/books";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Sparkles,
  ScrollText,
  Library,
  Feather,
  Layers,
  Bookmark,
  PenLine,
  Globe2,
  BookMarked,
  GraduationCap,
  Book,
  BookCopy,
  PenSquare,
  Landmark,
  Wand2,
  Boxes,
  Shapes,
  Star,
  Telescope,
  Atom,
  FlaskConical,
  BrainCircuit,
} from "lucide-react";

/* ========= animation ========= */
const ease = [0.22, 0.61, 0.36, 1] as const;

/* ========= color + icon theming ========= */
function stableHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
  return Math.abs(h);
}
const hsl = (h: number, s: number, l: number) =>
  `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

type Theme = {
  Icon: LucideIcon;
  hue: number;
  from: string;
  to: string;
  text: string;
  subtle: string;
};

const ICON_POOL: readonly LucideIcon[] = [
  BookOpen,
  Sparkles,
  ScrollText,
  Library,
  Feather,
  Layers,
  Bookmark,
  PenLine,
  Globe2,
  BookMarked,
  GraduationCap,
  Book,
  BookCopy,
  PenSquare,
  Landmark,
  Wand2,
  Boxes,
  Shapes,
  Star,
  Telescope,
  Atom,
  FlaskConical,
  BrainCircuit,
] as const;

const ICON_OVERRIDES: Record<string, LucideIcon> = {
  "thieu-nhi": Sparkles,
  "lap-trinh": Library,
  "sach-tieng-viet": Layers,
};

function makeTheme(input?: { slug?: string | null; name?: string | null }): Theme {
  const key = (input?.slug || input?.name || "cat").toLowerCase().trim();
  const hue = stableHash(key) % 360;
  const text = hsl(hue, 65, 38);
  const from = hsl(hue, 85, 97);
  const to = hsl((hue + 18) % 360, 78, 92);
  const subtle = hsl(hue, 70, 96);
  const idx = stableHash(key + "_icon") % ICON_POOL.length;
  const Icon: LucideIcon = ICON_OVERRIDES[key] ?? ICON_POOL[idx]!;
  return { Icon, hue, from, to, text, subtle };
}

/* ========= Burger button (ghost) ========= */
const BurgerButton: React.FC<{
  open: boolean;
  onClick: () => void;
  className?: string;
}> = ({ open, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    title="Danh mục"
    aria-label={open ? "Đóng danh mục" : "Mở danh mục"}
    className={[
      "relative grid h-9 w-9 md:h-11 md:w-11 place-items-center",
      "border-0 bg-transparent shadow-none ring-0 outline-none",
      "cursor-pointer select-none hover:bg-transparent focus:ring-0 focus:outline-none",
      className,
    ].join(" ")}
  >
    <span
      className={[
        "absolute block h-[2px] w-[20px] rounded-full bg-neutral-900",
        "origin-center transition-transform duration-200 ease-[cubic-bezier(.22,.61,.36,1)]",
        open ? "translate-y-0 rotate-45" : "-translate-y-[4px] rotate-0",
      ].join(" ")}
    />
    <span
      className={[
        "absolute block h-[2px] w-[20px] rounded-full bg-neutral-900",
        "origin-center transition-transform duration-200 ease-[cubic-bezier(.22,.61,.36,1)]",
        open ? "translate-y-0 -rotate-45" : "translate-y-[4px] rotate-0",
      ].join(" ")}
    />
  </button>
);

/* ========= Component ========= */
type MenuProps = { variant?: "embedded" | "default"; className?: string };

const HeaderCategoryMenu: React.FC<MenuProps> = ({
                                                   variant = "default",
                                                   className = "",
                                                 }) => {
  const isEmbedded = variant === "embedded";

  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const navigate: NavigateFunction = useNavigate();

  // fetch categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCategoryTree();
        if (!alive) return;
        setCats(Array.isArray(data) ? data : []);
        setErr(null);
      } catch {
        if (!alive) return;
        setErr("Không tải được danh mục");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open || !wrapRef.current) return;
      const target = e.target as HTMLElement | null;

      // Bỏ qua nếu click/blur trong form search
      if (target?.closest("form[role='search']")) return;

      if (!wrapRef.current.contains(target)) setOpen(false);
    };

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = cats[activeIdx] ?? null;
  const subs = active?.children ?? [];

  const panelTopClass = isEmbedded ? "top-[115%]" : "top-[120%]";
  const panelWidthClass = "w-[92vw] md:w-[1100px] lg:w-[1150px]";

  return (
    <div ref={wrapRef} className={["relative flex items-center", className].join(" ")}>
      <BurgerButton open={open} onClick={() => setOpen((v) => !v)} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="cat-panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease } }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18, ease } }}
            className={[
              "absolute left-0 z-50 overflow-hidden rounded-3xl border bg-white/70 shadow-2xl backdrop-blur-xl",
              panelTopClass,
              panelWidthClass,
            ].join(" ")}
            onMouseDown={(e) => e.preventDefault()}
            role="menu"
          >
            <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-fuchsia-100 via-rose-100 to-indigo-100" />

            <div className="flex min-h-[360px] md:min-h-[400px]">
              {/* LEFT: list roots */}
              <div className="basis-[180px] md:basis-[240px] shrink-0 border-r bg-white/70 p-2.5 md:p-3">
                {loading ? (
                  <div className="p-4 text-sm text-gray-600">Đang tải danh mục…</div>
                ) : err ? (
                  <div className="p-4 text-sm text-rose-600">{err}</div>
                ) : cats.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">Chưa có danh mục.</div>
                ) : (
                  <ul className="space-y-1">
                    {cats.map((root, i) => {
                      const isActive = i === activeIdx;
                      const theme = makeTheme(root);
                      return (
                        <li key={root.id}>
                          <button
                            onMouseEnter={() => setActiveIdx(i)}
                            onClick={() => {
                              setOpen(false);
                              navigate(`/danh-muc/${root.slug}`);
                            }}
                            className={[
                              "group flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] md:text-[14px] font-medium",
                              "cursor-pointer transition-all duration-200",
                              isActive ? "text-gray-900 shadow-sm" : "text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                            style={
                              isActive
                                ? { background: `linear-gradient(90deg, ${theme.subtle}, #fff)` }
                                : undefined
                            }
                          >
                            <span
                              className="grid h-6 w-6 md:h-7 md:w-7 place-items-center rounded-lg ring-1 ring-black/5"
                              style={{
                                background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                              }}
                            >
                              <theme.Icon
                                className="h-3.5 w-3.5 md:h-4 md:w-4"
                                style={{ color: theme.text }}
                              />
                            </span>
                            <span className="truncate font-semibold">{root.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* RIGHT: showcase */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active?.id ?? "empty"}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.25, ease } }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.18, ease } }}
                  className="relative flex grow basis-0 min-w-0 flex-col justify-between px-3 md:px-8 py-5 md:py-6"
                >
                  {/* bg image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                      backgroundImage: `url(${
                        active
                          ? `https://source.unsplash.com/1200x800/?book,${encodeURIComponent(
                            active.name,
                          )}`
                          : "https://source.unsplash.com/1200x800/?books"
                      })`,
                    }}
                  />
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />

                  <div className="relative z-10 px-4 md:px-8 py-5 md:py-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-extrabold tracking-wide text-gray-900 uppercase drop-shadow-sm">
                        {active?.name}
                      </h3>
                      {active && (
                        <Link
                          to={`/danh-muc/${active.slug}`}
                          onClick={() => setOpen(false)}
                          className="rounded-full px-3 py-1 text-[12px] font-semibold text-white shadow transition-colors"
                          style={{
                            background: `linear-gradient(90deg,
                              ${hsl(stableHash(active.slug ?? active.name ?? "") % 360, 75, 55)},
                              ${hsl(
                              ((stableHash(active.slug ?? active.name ?? "") % 360) + 20) % 360,
                              75,
                              55,
                            )}
                            )`,
                          }}
                        >
                          Xem tất cả
                        </Link>
                      )}
                    </div>

                    {subs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 md:gap-3">
                        {subs.slice(0, 12).map((s) => {
                          const th = makeTheme(s);
                          return (
                            <Link
                              key={s.id}
                              to={`/danh-muc/${s.slug}`}
                              onClick={() => setOpen(false)}
                              className="group relative cursor-pointer overflow-hidden rounded-xl border border-black/5 bg-white/60 px-3 py-2 text-[13px] md:text-sm text-gray-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
                            >
                              <span className="relative z-10 font-medium">{s.name}</span>
                              <span
                                className="absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-200 group-hover:w-full"
                                style={{
                                  background: `linear-gradient(90deg, ${th.text}, ${hsl(
                                    (th.hue + 20) % 360,
                                    65,
                                    38,
                                  )})`,
                                }}
                              />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 md:mt-6 text-sm text-gray-500 italic">
                        Danh mục này chưa có danh mục con.
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderCategoryMenu;
