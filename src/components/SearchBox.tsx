// src/components/SearchBox.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, createSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import { resolveThumb, PLACEHOLDER } from "../types/img";

/* ===== Config ===== */
const DEBOUNCE_MS = 300;
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
  authorName?: string;
  price?: number;
  effectivePrice?: number;
  salePrice?: number;
  finalPrice?: number;
  thumbnail?: string;
  cover?: string;
  imageUrl?: string;
  author?: { name?: string };
}
interface SuggestItem {
  id: number;
  title: string;
  slug?: string;
  authorName?: string;
  price?: number;
  thumbnail?: string;
}

/* ===== Helpers ===== */
function useDebounced<T>(v: T, ms: number) {
  const [val, setVal] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setVal(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return val;
}

const nfVND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const fmtVND = (n?: number) => (n == null ? "" : nfVND.format(n));

function highlight(txt: string, q: string) {
  const i = txt.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || !q) return txt;
  return (
    <>
      {txt.slice(0, i)}
      <mark className="rounded bg-yellow-200 px-0.5">{txt.slice(i, i + q.length)}</mark>
      {txt.slice(i + q.length)}
    </>
  );
}

function mapToSuggest(b: ResBookListItemDTO): SuggestItem {
  const it: SuggestItem = { id: b.id, title: b.title };

  if (b.slug) it.slug = b.slug;

  const author = b.authorName ?? b.author?.name;
  if (author) it.authorName = author;

  const price = b.effectivePrice ?? b.finalPrice ?? b.salePrice ?? b.price;
  if (price != null) it.price = Number(price);

  const thumb = b.thumbnail ?? b.cover ?? b.imageUrl;
  if (thumb) it.thumbnail = thumb;

  return it;
}

/* ===== API ===== */
async function fetchSuggest(q: string, signal?: AbortSignal): Promise<SuggestItem[]> {
  if (!q.trim()) return [];

  const params: Record<string, string | number> = {
    q: q.trim(),
    page: 0,
    size: LIMIT,
    sort: "createdAt",
    direction: "DESC",
  };

  const config: { params: typeof params; signal?: AbortSignal } = { params };
  if (signal) config.signal = signal;

  try {
    const res = await api.get<PageResp<ResBookListItemDTO>>("/api/v1/books/search", config);
    const page = res.data ?? { content: [] };
    const list = Array.isArray(page.content) ? page.content : [];
    return list.map(mapToSuggest);
  } catch {
    return [];
  }
}

/* ===== Component ===== */
type Props = { className?: string };

export default function SearchBox({ className = "" }: Props) {
  const [kw, setKw] = useState("");
  const q = useDebounced(kw, DEBOUNCE_MS);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SuggestItem[]>([]);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!q.trim()) { setHits([]); setLoading(false); return; }
    setLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    fetchSuggest(q, ac.signal).then(setHits).finally(() => setLoading(false));
    return () => ac.abort();
  }, [q]);

  const [rect, setRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);
  const measure = () => {
    const el = wrapperRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, bottom: r.bottom });
  };
  useLayoutEffect(() => { if (open) measure(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => { window.removeEventListener("resize", onWin); window.removeEventListener("scroll", onWin, true); };
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const keyword = kw.trim();
    if (!keyword) return;
    setOpen(false);
    navigate({
      pathname: "/search",
      search: `?${createSearchParams({ q: keyword, page: "0", size: "20", sort: "createdAt", direction: "DESC" })}`,
    });
  };

  const goProduct = (it: SuggestItem) => {
    setOpen(false);
    navigate(it.slug ? `/product/${it.slug}` : `/product/${it.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (hits.length || kw)) setOpen(true);
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const pick = hits[active]; if (pick) goProduct(pick); else submit(); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const showFooter = useMemo(() => kw.trim().length > 0, [kw]);

  return (
    <>
      <div ref={wrapperRef} className={`relative ${className}`}>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-full bg-teal-50 ring-1 ring-teal-200/70 px-4 py-2 shadow-inner">
          <input
            value={kw}
            onChange={(e) => { setKw(e.target.value); if (!open) setOpen(true); }}
            onFocus={() => { setOpen(true); measure(); }}
            onKeyDown={onKeyDown}
            placeholder="Tìm kiếm sách, tác giả…"
            className="h-11 flex-1 bg-transparent text-base outline-none placeholder:text-teal-700/50 text-teal-900 md:h-12 md:text-[15px]"
          />
          {loading && (
            <svg className="size-5 animate-spin opacity-70" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" opacity=".2" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          )}
          <button type="submit" className="h-11 cursor-pointer rounded-full bg-rose-500 px-4 text-sm font-medium text-white hover:bg-rose-600 md:h-12 md:px-5 md:text-[15px]">
            Tìm kiếm
          </button>
        </form>
      </div>

      {open && rect && createPortal(
        <AnimatePresence>
          {(kw || hits.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              style={{ position: "fixed", top: rect.bottom + 6, left: rect.left, width: rect.width }}
              className="z-[9999] overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-xl"
            >
              <ul className="max-h-[70vh] divide-y divide-teal-50 overflow-auto">
                {loading && hits.length === 0 && <li className="p-4 text-sm text-teal-700/70">Đang tìm…</li>}
                {!loading && hits.length === 0 && q && <li className="p-4 text-sm text-teal-700/70">Không có kết quả cho “{q}”.</li>}

                {hits.map((it, i) => (
                  <li
                    key={it.id}
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(-1)}
                    onClick={() => goProduct(it)}
                    className={`flex cursor-pointer items-center gap-3 p-3 transition ${i === active ? "bg-teal-50" : "hover:bg-teal-50/70"}`}
                  >
                    {it.thumbnail ? (
                      <img
                        src={resolveThumb(it.thumbnail)}
                        alt={it.title}
                        className="h-12 w-9 flex-none rounded object-cover ring-1 ring-teal-100"
                        onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER; }}
                      />
                    ) : (
                      <div className="grid h-12 w-9 flex-none place-items-center rounded bg-gray-200 text-[10px] text-gray-500">No img</div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-teal-900">{highlight(it.title, q)}</div>
                      <div className="truncate text-sm text-teal-700/70">
                        {it.authorName || "—"} {it.price != null && " • " + fmtVND(it.price)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {showFooter && (
                <div className="flex items-center justify-between bg-teal-50/60 p-2">
                  <div className="px-2 text-xs text-teal-800/70">↑↓ để chọn • Enter để mở • Esc để đóng</div>
                  <button onClick={submit} className="rounded-lg px-3 py-1 text-sm text-rose-600 hover:bg-rose-50">
                    Xem tất cả “{kw.trim()}”
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
