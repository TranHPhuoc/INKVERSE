// src/components/HeaderCategoryMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getCategoryTree, type CategoryTree } from "../types/books";

/* -------------------- Small hamburger button -------------------- */
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
      {/* 2 thanh mảnh – khi open xoay thành dấu X, cân giữa */}
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

/* -------------------- Panel animation presets -------------------- */
const ease = [0.22, 0.61, 0.36, 1] as const;

export default function HeaderCategoryMenu() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Fetch categories (public: /api/v1/categories/tree)
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

  // Đóng khi click ra ngoài
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open || !wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger đặt cạnh icon Trang chủ trong Header */}
      <BurgerButton open={open} onClick={() => setOpen((v) => !v)} />

      {/* Slide-down panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="cat-panel"
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: "auto", opacity: 1, y: 0, transition: { duration: 0.22, ease } }}
            exit={{ height: 0, opacity: 0, y: -6, transition: { duration: 0.18, ease } }}
            className="absolute top-[120%] left-0 z-50 w-[900px] overflow-hidden rounded-2xl border bg-white shadow-xl"
            onMouseDown={(e) => e.preventDefault()}
            role="menu"
          >
            {/* viền gradient mờ */}
            <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-rose-100 via-fuchsia-100 to-indigo-100" />

            <div className="p-3">
              {loading ? (
                <div className="p-4 text-sm text-gray-600">Đang tải danh mục…</div>
              ) : err ? (
                <div className="p-4 text-sm text-rose-600">{err}</div>
              ) : cats.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">Chưa có danh mục.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {cats.slice(0, 10).map((root) => {
                    const children = root.children || [];
                    return (
                      <div
                        key={root.id}
                        className="rounded-xl border bg-white p-3 ring-1 ring-black/5"
                      >
                        {/* Tiêu đề + Xem tất cả */}
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            className="text-[15px] font-extrabold tracking-wide text-gray-900 uppercase hover:underline"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/danh-muc/${root.slug}`);
                            }}
                          >
                            {root.name}
                          </button>
                          <Link
                            to={`/danh-muc/${root.slug}`}
                            onClick={() => setOpen(false)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Xem tất cả
                          </Link>
                        </div>

                        {/* Danh mục con (nếu có) */}
                        {children.length > 0 ? (
                          <ul className="space-y-1">
                            {children.slice(0, 6).map((c) => (
                              <li key={c.id} className="leading-5">
                                <Link
                                  to={`/danh-muc/${c.slug}`}
                                  onClick={() => setOpen(false)}
                                  className="block truncate text-[13.5px] text-gray-700 hover:text-indigo-600"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                            {children.length > 6 && (
                              <li className="pt-0.5">
                                <Link
                                  to={`/danh-muc/${root.slug}`}
                                  onClick={() => setOpen(false)}
                                  className="text-[12px] font-medium text-gray-600 hover:text-indigo-600"
                                >
                                  + {children.length - 6} danh mục con khác
                                </Link>
                              </li>
                            )}
                          </ul>
                        ) : (
                          <div className="text-[13px] text-gray-400 italic"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
