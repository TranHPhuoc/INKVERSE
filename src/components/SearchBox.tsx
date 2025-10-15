// src/components/SearchBox.tsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createSearchParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { AxiosRequestConfig } from "axios";
import { Search as SearchIcon, X as XIcon } from "lucide-react";
import api from "../services/api";
import { resolveThumb, PLACEHOLDER } from "../types/img";

/* ===== Config ===== */
const DEBOUNCE_MS = 250;
const LIMIT = 8;

/* ===== Types ===== */
interface PageResp<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

interface ResBookListItemDTO {
  id: number;
  title: string;
  slug?: string;
  thumbnail?: string | null;
  cover?: string | null;
  imageUrl?: string | null;
  authorName?: string | null;
  author?: { name?: string | null } | null;
  price?: number | null;
  salePrice?: number | null;
  finalPrice?: number | null;
  effectivePrice?: number | null;
}

interface SuggestItem {
  id: number;
  title: string;
  slug?: string;
  thumbnail?: string;
}

/* ===== Helpers ===== */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function highlight(text: string, keyword: string): React.ReactNode {
  const i = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (i < 0 || !keyword) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-sky-100 px-0.5 text-sky-800">
        {text.slice(i, i + keyword.length)}
      </mark>
      {text.slice(i + keyword.length)}
    </>
  );
}

function mapToSuggest(b: ResBookListItemDTO): SuggestItem {
  const it: SuggestItem = { id: b.id, title: b.title };
  if (b.slug) it.slug = b.slug;
  const thumb = b.thumbnail ?? b.cover ?? b.imageUrl ?? undefined;
  if (thumb) it.thumbnail = thumb;
  return it;
}

/* ===== API ===== */
async function fetchSuggest(q: string, signal?: AbortSignal): Promise<SuggestItem[]> {
  if (!q.trim()) return [];

  const params = {
    q: q.trim(),
    keyword: q.trim(),
    page: 0,
    size: LIMIT,
    sort: "createdAt",
    direction: "DESC",
  };

  const config: AxiosRequestConfig = signal ? { params, signal } : { params };

  try {
    const res = await api.get("/api/v1/books/search", config);
    const raw = (res as unknown as { data?: unknown }).data as
      | PageResp<ResBookListItemDTO>
      | { data?: PageResp<ResBookListItemDTO> }
      | undefined;

    const page: PageResp<ResBookListItemDTO> | undefined =
      (raw && (raw as { data?: PageResp<ResBookListItemDTO> }).data) ||
      (raw as PageResp<ResBookListItemDTO>) ||
      undefined;

    const list = Array.isArray(page?.content) ? page!.content : [];
    return list.map(mapToSuggest);
  } catch {
    return [];
  }
}

/* ===== Motion ===== */
const listVariants = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

/* ===== Component ===== */
export default function SearchBox({ className = "" }: { className?: string }) {
  const [kw, setKw] = useState("");
  const q = useDebounced(kw, DEBOUNCE_MS);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SuggestItem[]>([]);
  const [prevKw, setPrevKw] = useState("");
  const [active, setActive] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const abortRef = useRef<AbortController | null>(null);
  const composing = useRef(false);

  const navigate = useNavigate();

  /* ===== Measure input rect ===== */
  const [rect, setRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);
  const measure = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, bottom: r.bottom });
  };

  useLayoutEffect(() => {
    if (open) measure();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const onWin = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open]);

  /* ===== Close on outside click ===== */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  /* ===== Fetch suggestions ===== */
  useEffect(() => {
    if (!q.trim()) {
      setHits([]);
      setLoading(false);
      setActive(-1);
      setPrevKw("");
      return;
    }

    setLoading(true);
    setPrevKw(q);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    fetchSuggest(q, ac.signal)
      .then((res) => {
        setHits(res);
        setActive(res.length ? 0 : -1);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [q]);

  /* ===== Optimistic filter ===== */
  const viewHits = useMemo((): SuggestItem[] => {
    const k = kw.trim().toLowerCase();
    if (!k) return [];
    if (loading && prevKw && k.startsWith(prevKw.toLowerCase())) {
      return hits.filter((h) => h.title.toLowerCase().includes(k)).slice(0, LIMIT);
    }
    return hits;
  }, [kw, hits, loading, prevKw]);

  /* ===== Actions ===== */
  const goProduct = (it: SuggestItem) => {
    const url = it.slug ? `/books/${it.slug}` : `/books/${it.id}`;
    setOpen(false);
    setTimeout(() => navigate(url), 0);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const keyword = kw.trim();
    if (!keyword) return;
    setOpen(false);
    setTimeout(
      () =>
        navigate({
          pathname: "/search",
          search: `?${createSearchParams({ q: keyword })}`,
        }),
      0,
    );
  };

  /* ===== Keyboard nav ===== */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (viewHits.length > 0 || kw.trim().length > 0)) setOpen(true);
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, viewHits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = viewHits[active];
      if (pick) goProduct(pick);
      else submit();
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  const showFooter = useMemo(() => kw.trim().length > 0, [kw]);
  const setItemRef = (i: number) => (el: HTMLLIElement | null) => {
    itemRefs.current[i] = el;
  };

  /* ===== UI ===== */
  return (
    <>
      <div ref={wrapperRef} className={`relative ${className}`}>
        <form
          onSubmit={submit}
          role="search"
          className={[
            "group",
            "flex items-center gap-2",
            // khung mảnh, tông lạnh
            "h-11 md:h-12 rounded-full",
            "bg-gradient-to-r from-sky-50/80 via-teal-50/80 to-sky-50/80",
            "ring-1 ring-slate-200 hover:ring-sky-300/80 focus-within:ring-sky-400",
            "backdrop-blur-xl shadow-[0_6px_18px_-10px_rgba(14,165,233,.45)]",
            "pl-3 pr-2 transition-all",
          ].join(" ")}
        >
          <SearchIcon
            className="ml-0.5 h-[18px] w-[18px] text-slate-600/80 group-focus-within:text-sky-700"
            aria-hidden
          />

          <input
            value={kw}
            onChange={(e) => {
              if (composing.current) {
                setKw(e.target.value);
                return;
              }
              setKw(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              measure();
            }}
            onKeyDown={onKeyDown}
            onCompositionStart={() => (composing.current = true)}
            onCompositionEnd={(e) => {
              composing.current = false;
              setKw(e.currentTarget.value);
            }}
            placeholder="Tìm kiếm sách, tác giả…"
            className="h-full flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-suggest-list"
          />

          {/* Nút xóa nhanh */}
          {kw && (
            <button
              type="button"
              onClick={() => setKw("")}
              className="grid size-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100/70 hover:text-slate-800 transition cursor-pointer"
              aria-label="Xóa từ khóa"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            className="h-9 md:h-10 cursor-pointer rounded-full bg-rose-700 px-4 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-rose-600 active:scale-[0.98]"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {open && rect
        ? createPortal(
          <AnimatePresence>
            {kw.trim().length > 0 || viewHits.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                style={{ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width }}
                className={[
                  "z-[9999] overflow-hidden rounded-2xl",
                  "border border-sky-100/80 bg-white/90 backdrop-blur-xl",
                  "shadow-[0_20px_40px_-18px_rgba(14,165,233,.25)]",
                ].join(" ")}
                role="listbox"
                aria-label="Gợi ý tìm kiếm"
              >
                <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-sky-100 via-teal-100 to-sky-100" />

                <div className="p-0.5">
                  {loading && viewHits.length === 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <li key={idx} className="flex items-center gap-3 p-3">
                          <div className="h-12 w-9 flex-none rounded bg-slate-200/70 animate-pulse" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
                            <div className="h-3 w-1/3 rounded bg-slate-100 animate-pulse" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : !loading && viewHits.length === 0 && kw.trim().length > 0 ? (
                    <div className="p-4 text-sm text-slate-600">
                      Không có kết quả cho “<span className="font-medium text-slate-800">{kw.trim()}</span>”.
                    </div>
                  ) : (
                    <motion.ul
                      id="search-suggest-list"
                      ref={listRef}
                      variants={listVariants}
                      initial="initial"
                      animate="animate"
                      exit="initial"
                      className="max-h-[70vh] divide-y divide-slate-100 overflow-auto"
                    >
                      {viewHits.map((it, i) => (
                        <motion.li
                          key={it.id}
                          variants={itemVariants}
                          layout
                          onMouseDown={(e) => {
                            e.preventDefault();
                            goProduct(it);
                          }}
                          onMouseEnter={() => setActive(i)}
                          onMouseLeave={() => setActive(-1)}
                          ref={setItemRef(i)}
                          className={[
                            "flex cursor-pointer items-center gap-3 p-3 transition",
                            i === active
                              ? "bg-sky-50"
                              : "hover:bg-sky-50/70",
                          ].join(" ")}
                          role="option"
                          aria-selected={i === active}
                        >
                          {it.thumbnail ? (
                            <img
                              src={resolveThumb(it.thumbnail)}
                              alt={it.title}
                              className="h-12 w-9 flex-none rounded object-cover ring-1 ring-sky-100"
                              onError={(e) => {
                                if (e.currentTarget.src !== PLACEHOLDER) {
                                  e.currentTarget.src = PLACEHOLDER;
                                }
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid h-12 w-9 flex-none place-items-center rounded bg-slate-200 text-[10px] text-slate-500">
                              No img
                            </div>
                          )}
                          <div className="min-w-0 flex-1 truncate font-medium text-slate-900">
                            {highlight(it.title, kw)}
                          </div>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}

                  {showFooter ? (
                    <div className="flex items-center justify-between bg-sky-50/60 px-3 py-2">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          submit();
                        }}
                        className="rounded-lg px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-100 cursor-pointer"
                      >
                        Xem tất cả “{kw.trim()}”
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )
        : null}
    </>
  );
}
