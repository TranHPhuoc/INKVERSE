// src/pages/AuthorDetailPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import {
  makeAuthorHeader,
  getAuthorFeaturedWorksById,
  listAuthorBooksById,
  fetchAuthorBySlug,
  type AuthorDetail,
  type BookLite,
} from "../services/author";
import { addAndSelectOne, addCartItem } from "../services/cart";
import { getBookDetailById } from "../types/books";
import { AUTHOR_META } from "../types/authorMeta";
import type { AuthorMeta } from "../types/authorMeta";

const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";
const nf = new Intl.NumberFormat("vi-VN");

/* ========= Fly-to-cart ========= */
function animateFlyToCartFrom(el?: HTMLElement | null): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      if (!el) return resolve();
      const cartBtn = document.getElementById("header-cart-icon") as HTMLElement | null;
      if (!cartBtn) return resolve();

      const imgRect = el.getBoundingClientRect();
      const cartRect = cartBtn.getBoundingClientRect();
      const ghost = el.cloneNode(true) as HTMLElement;

      ghost.style.position = "fixed";
      ghost.style.left = `${imgRect.left}px`;
      ghost.style.top = `${imgRect.top}px`;
      ghost.style.width = `${imgRect.width}px`;
      ghost.style.height = `${imgRect.height}px`;
      ghost.style.borderRadius = "14px";
      ghost.style.zIndex = "9999";
      ghost.style.boxShadow = "0 10px 40px rgba(0,0,0,.15)";
      ghost.style.transition = "transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms";
      ghost.style.pointerEvents = "none";
      document.body.appendChild(ghost);

      const dx = cartRect.left + cartRect.width / 2 - (imgRect.left + imgRect.width / 2);
      const dy = cartRect.top + cartRect.height / 2 - (imgRect.top + imgRect.height / 2);

      requestAnimationFrame(() => {
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.14) rotate(8deg)`;
        ghost.style.opacity = "0.35";
      });

      window.setTimeout(() => {
        ghost.remove();
        cartBtn.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
          { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" },
        );
        resolve();
      }, 650);
    } catch {
      resolve();
    }
  });
}

/* ========== Page ========== */
export default function AuthorDetailPage() {
  const { slug = "" } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const authorIdParam = Number(sp.get("authorId"));

  const [author, setAuthor] = useState<AuthorDetail>(() => makeAuthorHeader(slug, authorIdParam));
  const [featured, setFeatured] = useState<BookLite[]>([]);
  const [books, setBooks] = useState<BookLite[]>([]);
  const [hoverIdx, setHoverIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // mô tả (lấy từ getBookDetailById khi hover ở preview)
  const [activeDesc, setActiveDesc] = useState<string>("");

  // ref ảnh preview để bay vào giỏ
  const previewImgRef = useRef<HTMLImageElement | null>(null);

  const safeIdx = useMemo(
    () => (featured.length ? Math.min(Math.max(hoverIdx, 0), featured.length - 1) : -1),
    [featured, hoverIdx],
  );
  const active = useMemo(() => (safeIdx >= 0 ? featured[safeIdx] : null), [featured, safeIdx]);

  /* -------- fetch header + lists -------- */
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {/**/}
    setLoading(true);

    (async () => {
      let id = authorIdParam;
      let header = makeAuthorHeader(slug, id);

      // Nếu thiếu authorId trong URL -> resolve từ slug
      if (!Number.isFinite(id) || id <= 0) {
        const found = await fetchAuthorBySlug(slug).catch(() => null);
        if (found) {
          id = Number(found.id);
          header = makeAuthorHeader(slug, id);
        } else {
          setAuthor(header);
          setFeatured([]);
          setBooks([]);
          setLoading(false);
          return;
        }
      }

      setAuthor(header);
      const [f, b] = await Promise.all([
        getAuthorFeaturedWorksById(id),
        listAuthorBooksById(id),
      ]);
      setFeatured(Array.isArray(f) ? f : []);
      setBooks(Array.isArray(b) ? b : []);
      setHoverIdx(0);
      setLoading(false);
    })();
  }, [slug, authorIdParam]);

  /* -------- fetch real description for active book -------- */
  useEffect(() => {
    (async () => {
      if (!active?.id) {
        setActiveDesc("");
        return;
      }
      try {
        const detail = await getBookDetailById(Number(active.id));
        setActiveDesc(String(detail?.description ?? ""));
      } catch {
        setActiveDesc("");
      }
    })();
  }, [active?.id]);

  async function handleAddToCart() {
    if (!active?.id) return;
    await addCartItem({ bookId: Number(active.id), qty: 1 });
    await animateFlyToCartFrom(previewImgRef.current);
  }

  async function handleBuyNow() {
    if (!active?.id) return;
    try {
      await addAndSelectOne({ bookId: Number(active.id), qty: 1 });
      await animateFlyToCartFrom(previewImgRef.current);
      navigate("/checkout");
    } catch (err) {
      alert((err as Error)?.message ?? "Không thể mua ngay");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100">
        <div className={`${SHELL} py-16`}>
          <div className="grid gap-6 lg:grid-cols-[160px,1fr]">
            <div className="h-40 w-40 animate-pulse rounded-2xl bg-white/10" />
            <div>
              <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="mt-6 h-16 w-full animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta: AuthorMeta | undefined = AUTHOR_META[author.name];
  const life: string = meta?.life ?? "";
  const shortBio: string = author.shortBio || meta?.bio || "";
  const quote: string | undefined = meta?.quote;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {/* ===== Hero / Header ===== */}
      <div
        className="relative isolate bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"
        aria-label={`Thông tin tác giả ${author.name}`}
      >
        <div className={`${SHELL} py-16 lg:py-20`}>
          {/* avatar | (title + bio + quick facts) — top aligned */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar with subtle motion */}
            <motion.img
              src={author.avatarUrl || author.coverUrl || ""}
              alt={author.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ rotate: 1.5, scale: 1.02 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-40 w-40 flex-shrink-0 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10"
            />

            {/* Right: Name + Bio */}
            <div className="min-w-0 flex-1 pt-[2px]">
              <h1 className="mb-3 text-3xl font-semibold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.18)] lg:text-4xl">
                {author.name}
                {!!life && (
                  <span className="ml-3 align-middle text-base font-normal text-slate-300">
                    ({life})
                  </span>
                )}
              </h1>

              <div
                className="
                  max-w-[900px] text-[15px] leading-7 text-slate-200/90
                  prose prose-invert
                  prose-p:my-3 prose-p:first:mt-0 prose-p:last:mb-0
                  prose-strong:text-white prose-strong:font-semibold
                "
                dangerouslySetInnerHTML={{ __html: shortBio }}
              />
            </div>
          </div>
        </div>

        {/* radial glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]" />
      </div>

      {/* ===== Featured works ===== */}
      {featured.length > 0 && (
        <section className={`${SHELL} py-14`}>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="bg-gradient-to-r from-rose-300 to-indigo-300 bg-clip-text text-2xl font-semibold text-transparent">
              Những tác phẩm nổi bật
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left list (clickable + hover preview) */}
            <ul className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur">
              {featured.map((bk, i) => {
                const isActive = i === safeIdx;
                return (
                  <li key={bk.id}>
                    <Link
                      to={`/books/${bk.slug}`}
                      onMouseEnter={() => setHoverIdx(i)}
                      onFocus={() => setHoverIdx(i)}
                      className={`group flex w-full cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-left transition ${
                        isActive ? "bg-white/10 ring-1 ring-white/15" : "hover:bg-white/5"
                      }`}
                      aria-current={isActive ? "true" : "false"}
                    >
                      <img
                        src={bk.cover}
                        alt={bk.title}
                        className="h-16 w-12 flex-none rounded-md object-cover shadow transition group-hover:scale-[1.02]"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-100 group-hover:text-white">
                          {bk.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {bk.salePrice != null ? (
                            <>
                              <span className="font-semibold">{nf.format(bk.salePrice)} đ</span>
                              <span className="ml-2 line-through opacity-60">
                                {nf.format(bk.price)} đ
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold">{nf.format(bk.price)} đ</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Right preview */}
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 16 }}
                className="relative grid grid-cols-[220px,1fr] gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-900/30 p-6 backdrop-blur"
              >
                <motion.img
                  ref={previewImgRef}
                  src={active.cover}
                  alt={active.title}
                  whileHover={{ rotateY: 3, scale: 1.04 }}
                  transition={{ type: "spring", stiffness: 100, damping: 12 }}
                  className="h-[320px] w-[220px] rounded-xl object-cover shadow-2xl ring-4 ring-white/5"
                />
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold">{active.title}</h3>

                  <div className="mt-2 text-sm text-slate-300">
                    Giá{" "}
                    {active.salePrice != null ? (
                      <>
                        <span className="font-semibold text-white">
                          {nf.format(active.salePrice)} đ
                        </span>
                        <span className="ml-2 line-through opacity-60">
                          {nf.format(active.price)} đ
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold text-white">{nf.format(active.price)} đ</span>
                    )}
                  </div>

                  {/* mô tả  */}
                  {!!activeDesc && <ExpandableClamp html={activeDesc} maxHeight={140} />}

                  <div className="mt-auto flex gap-3 pt-6">
                    <button
                      onClick={handleAddToCart}
                      className="rounded-xl border border-white/20 px-5 py-2.5 font-medium text-white/90 hover:bg-white/10 cursor-pointer"
                    >
                      Thêm vào giỏ
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="rounded-xl bg-rose-500/90 px-5 py-2.5 font-semibold text-white shadow hover:brightness-110 cursor-pointer"
                    >
                      Mua ngay
                    </button>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_30%,rgba(99,102,241,0.15),transparent_70%)]" />
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ===== All books ===== */}
      {books.length > 0 && (
        <section className={`${SHELL} pb-20`}>
          <h2 className="mb-6 text-2xl font-semibold">Tất cả tác phẩm</h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((bk) => {
              const hasSale = bk.salePrice != null && Number(bk.salePrice) < Number(bk.price);
              return (
                <Link
                  key={bk.id}
                  to={`/books/${bk.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  {/* Image area  */}
                  <div className="relative">
                    <div className="aspect-[3/4] w-full">
                      <img
                        src={bk.cover}
                        alt={bk.title}
                        className="h-full w-full rounded-b-none rounded-t-2xl object-cover"
                      />
                    </div>
                    {hasSale && (
                      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-rose-600/95 px-2 py-0.5 text-xs font-semibold text-white">
                        -
                        {Math.max(
                          0,
                          Math.round(
                            ((Number(bk.price) - Number(bk.salePrice ?? bk.price)) /
                              Number(bk.price || 1)) *
                            100,
                          ),
                        )}
                        %
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="p-3">
                    <div className="line-clamp-2 h-[2.6em] text-sm font-medium text-slate-100 group-hover:text-white">
                      {bk.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {hasSale ? (
                        <>
                          <span className="font-semibold text-white">{nf.format(bk.salePrice!)} đ</span>
                          <span className="ml-2 line-through opacity-60">{nf.format(bk.price)} đ</span>
                        </>
                      ) : (
                        <span className="font-semibold text-white">{nf.format(bk.price)} đ</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== Optional quote / legacy ===== */}
      {!!quote && (
        <section className="pb-16">
          <div className={`${SHELL}`}>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mx-auto max-w-3xl text-center text-lg italic text-slate-300"
            >
              “{quote}”
            </motion.p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ========== Component ========== */
function ExpandableClamp({ html, maxHeight = 140 }: { html: string; maxHeight?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [realH, setRealH] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setRealH(el.scrollHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("load", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", update);
    };
  }, [html]);

  const showToggle = (realH ?? 0) > maxHeight + 8;

  return (
    <div className="mt-3">
      <motion.div
        animate={{ height: expanded ? (realH ?? "auto") : maxHeight }}
        transition={{ duration: 0.45, ease: [0.25, 0.8, 0.25, 1] }}
        className="relative overflow-hidden text-sm leading-6 text-slate-300/90"
      >
        <div
          ref={ref}
          className="prose prose-invert prose-p:my-0 prose-p:leading-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && showToggle && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-900/40 to-transparent" />
        )}
      </motion.div>

      {showToggle && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-rose-300 hover:text-rose-200"
          >
            {expanded ? (
              <>
                Rút gọn
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
                </svg>
              </>
            ) : (
              <>
                Xem thêm
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
