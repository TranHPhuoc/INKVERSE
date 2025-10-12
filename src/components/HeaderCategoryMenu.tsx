// src/components/HeaderCategoryMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getCategoryTree, type CategoryTree } from "../types/books";
import { ChevronRight, Loader2 } from "lucide-react";

/* -------------------- Trigger button -------------------- */
const BurgerButton: React.FC<{ open: boolean; onClick: () => void; className?: string }> = ({
  open,
  onClick,
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Đóng danh mục" : "Mở danh mục"}
      className={`relative grid h-11 w-11 cursor-pointer place-items-center rounded-full border bg-white shadow-sm ${className}`}
    >
      <span
        className={[
          "absolute block h-[2px] w-[20px] rounded-full bg-neutral-900",
          "transition-transform duration-200 ease-[cubic-bezier(.22,.61,.36,1)]",
          "origin-center",
          open ? "translate-y-0 rotate-45" : "-translate-y-[4px] rotate-0",
        ].join(" ")}
      />
      <span
        className={[
          "absolute block h-[2px] w-[20px] rounded-full bg-neutral-900",
          "transition-transform duration-200 ease-[cubic-bezier(.22,.61,.36,1)]",
          "origin-center",
          open ? "translate-y-0 -rotate-45" : "translate-y-[4px] rotate-0",
        ].join(" ")}
      />
    </button>
  );
};

/* -------------------- Animation -------------------- */
const ease = [0.22, 0.61, 0.36, 1] as const;

/* -------------------- Component -------------------- */
export default function HeaderCategoryMenu() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Fetch categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getCategoryTree();
        if (!alive) return;
        const arr = Array.isArray(data) ? data : [];
        setCats(arr);
        setActiveIdx(0);
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

  // Close when click outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open || !wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  // Keyboard nav on the sidebar list
  const onKeyDownList: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (cats.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, cats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const root = cats[activeIdx];
      if (root) {
        setOpen(false);
        navigate(`/danh-muc/${root.slug}`);
      }
    }
  };

  const active = cats[activeIdx] ?? null;
  const subs = active?.children ?? [];

  return (
    <div ref={wrapRef} className="relative">
      <BurgerButton open={open} onClick={() => setOpen((v) => !v)} />

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="cat-flyout"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease } }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18, ease } }}
            className="absolute top-[120%] left-0 z-50 w-[1000px] overflow-hidden rounded-2xl border bg-white/70 shadow-2xl backdrop-blur-xl"
            role="menu"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-indigo-100 via-fuchsia-100 to-rose-100" />

            <div className="flex min-h-[360px]">
              {/* LEFT: root list */}
              <div
                ref={listRef}
                tabIndex={0}
                onKeyDown={onKeyDownList}
                className="w-[260px] shrink-0 border-r bg-white/80 p-2 backdrop-blur-xl"
              >
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải…
                  </div>
                ) : err ? (
                  <div className="p-3 text-sm text-rose-600">{err}</div>
                ) : cats.length === 0 ? (
                  <div className="p-3 text-sm text-gray-600">Chưa có danh mục.</div>
                ) : (
                  <ul className="space-y-1">
                    {cats.map((c, i) => {
                      const active = i === activeIdx;
                      return (
                        <li key={c.id}>
                          <button
                            onMouseEnter={() => setActiveIdx(i)}
                            onFocus={() => setActiveIdx(i)}
                            onClick={() => {
                              setOpen(false);
                              navigate(`/danh-muc/${c.slug}`);
                            }}
                            className={[
                              "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[14px]",
                              active
                                ? "bg-gradient-to-r from-indigo-50 to-fuchsia-50 text-gray-900 ring-1 ring-black/5"
                                : "text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                          >
                            <span className="truncate font-semibold">{c.name}</span>
                            <ChevronRight
                              className={[
                                "ml-2 h-4 w-4 flex-none transition-transform",
                                active
                                  ? "translate-x-[1px] opacity-100"
                                  : "opacity-40 group-hover:opacity-70",
                              ].join(" ")}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* RIGHT: detail panel */}
              <div className="flex min-w-0 flex-1 flex-col bg-white/70">
                <div className="flex items-center justify-between px-5 pt-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-extrabold tracking-wide text-gray-900 uppercase">
                      {active?.name ?? "Danh mục"}
                    </h3>
                  </div>
                  {active && (
                    <Link
                      to={`/danh-muc/${active.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={active?.id ?? "empty"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease } }}
                    exit={{ opacity: 0, y: -6, transition: { duration: 0.15, ease } }}
                    className="px-5 py-3"
                  >
                    {subs.length === 0 ? (
                      <div className="rounded-xl border bg-white/70 p-4 text-sm text-gray-500">
                        Chưa có danh mục con.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {subs.slice(0, 18).map((s) => (
                          <div
                            key={s.id}
                            className="rounded-xl border bg-white p-3 ring-1 ring-black/5 transition hover:shadow-sm"
                          >
                            <Link
                              to={`/danh-muc/${s.slug}`}
                              onClick={() => setOpen(false)}
                              className="line-clamp-1 text-[13.5px] font-semibold text-gray-800 hover:text-indigo-600"
                            >
                              {s.name}
                            </Link>

                            {/* grandchildren if any */}
                            {Array.isArray(s.children) && s.children.length > 0 && (
                              <ul className="mt-1.5 space-y-1">
                                {s.children.slice(0, 4).map((gc) => (
                                  <li key={gc.id}>
                                    <Link
                                      to={`/danh-muc/${gc.slug}`}
                                      onClick={() => setOpen(false)}
                                      className="block truncate text-[12.5px] text-gray-600 hover:text-indigo-600"
                                    >
                                      {gc.name}
                                    </Link>
                                  </li>
                                ))}
                                {s.children.length > 4 && (
                                  <li className="pt-0.5 text-[12px] text-gray-500">
                                    +{s.children.length - 4} mục nữa
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
