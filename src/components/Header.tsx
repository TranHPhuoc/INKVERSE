import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Phone,
  ShoppingCart,
  History,
  User as UserIcon,
  Heart,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import HeaderCategoryMenu from "./HeaderCategoryMenu";
import PillNav from "../components/Animation/PillNav";
import logo from "../assets/logoweb.png";
import { getCart } from "../services/cart";
import SearchBox from "./SearchBox";

/* ===== Layout container ===== */
const SHELL = "mx-auto w-full max-w-[1440px] px-4 sm:px-6";

/* ===== Cart badge cache (anti-jitter) ===== */
const BADGE_KEY = "CART_BADGE_COUNT";
let lastBadgeSetAt = 0;
const getBadgeCache = () => {
  const n = Number(localStorage.getItem(BADGE_KEY) || "0");
  return Number.isFinite(n) ? n : 0;
};
const setBadgeCache = (n: number) => {
  lastBadgeSetAt = Date.now();
  localStorage.setItem(BADGE_KEY, String(Math.max(0, n | 0)));
};
const recentlySet = (ms = 900) => Date.now() - lastBadgeSetAt < ms;

function extractUniqueCount(res: unknown): number {
  const r = res as { uniqueItems?: number; distinctItems?: number; items?: unknown[] } | null;
  if (!r) return 0;
  if (typeof r.uniqueItems === "number") return r.uniqueItems;
  if (typeof r.distinctItems === "number") return r.distinctItems;
  if (Array.isArray(r.items)) return r.items.length;
  return 0;
}

const Header: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(() => getBadgeCache());
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* ---- Roles ---- */
  const hasRole = (r: string) => (user?.role || "").toUpperCase() === r.toUpperCase();
  const isAdmin = hasRole("ADMIN") || hasRole("ROLE_ADMIN");
  const isSale = hasRole("SALE") || hasRole("ROLE_SALE");
  const isUserOnly = hasRole("USER") || hasRole("ROLE_USER");

  useEffect(() => setOpen(false), [pathname]);

  /* ---- Cart badge sync ---- */
  const refreshBadge = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setCartCount(0);
        setBadgeCache(0);
        return;
      }
      if (recentlySet()) return;
      const res = await getCart();
      const n = extractUniqueCount(res);
      setCartCount(n);
      setBadgeCache(n);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshBadge();
  }, [isAuthenticated, refreshBadge]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ uniqueItems?: number }>).detail;
      if (typeof detail?.uniqueItems === "number") {
        setCartCount(detail.uniqueItems);
        setBadgeCache(detail.uniqueItems);
      } else {
        void refreshBadge();
      }
    };
    window.addEventListener("cart:changed", handler as EventListener);
    return () => window.removeEventListener("cart:changed", handler as EventListener);
  }, [refreshBadge]);

  /* ---- Pills (desktop) ---- */
  const pillItems = [
    {
      label: (
        <span className="inline-flex items-center gap-1">
          <Home className="h-[18px] w-[18px]" />
          Trang chủ
        </span>
      ),
      href: "/",
    },
    {
      label: (
        <span className="inline-flex items-center gap-1">
          <Phone className="h-[18px] w-[18px]" />
          Liên hệ
        </span>
      ),
      href: "/lien-he",
    },
    {
      label: (
        <span className="inline-flex items-center gap-2">
          <span className="relative mr-1.5 inline-flex">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white"
                aria-label={`Sản phẩm trong giỏ: ${cartCount}`}
              >
                {cartCount > 99 ? "99+" : cartCount}
              </motion.span>
            )}
          </span>
          Giỏ hàng
        </span>
      ),
      href: "/gio-hang",
      linkProps: {
        onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          navigate("/gio-hang");
        },
      },
    },
  ];

  /* ---- Account menu hover (desktop) ---- */
  const hoverRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const openMenu = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <header className="sticky top-0 z-[300] border-b border-slate-200/70 bg-white/80 shadow-[0_10px_30px_-20px_rgba(2,6,23,.35)] backdrop-blur-xl">
      <div className={SHELL}>
        {/* ===== DESKTOP ROW ===== */}
        <div className="hidden h-[72px] items-center justify-between gap-4 md:flex">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Về trang chủ">
            <img src={logo} alt="INKVERSE" className="h-12 w-auto md:h-14" />
          </Link>

          {/* Search + Category */}
          <div className="flex flex-1 justify-center">
            <div className="flex w-full max-w-[820px] items-center gap-2 rounded-full bg-white/70 px-2 py-1 shadow-[0_6px_20px_-8px_rgba(0,0,0,.25)] ring-1 ring-slate-200 backdrop-blur-xl">
              <HeaderCategoryMenu variant="embedded" className="ml-1 cursor-pointer" />
              <span className="h-6 w-px bg-slate-200" />
              <SearchBox className="flex-1" />
            </div>
          </div>

          {/* Actions + Account */}
          <div className="hidden items-center md:flex">
            <PillNav
              items={pillItems}
              activeHref={pathname}
              className="ml-2"
              ease="power2.easeOut"
              pillColor="#ffffff"
              hoverCircleColor="#0f172a"
              hoveredTextColor="#ffffff"
              textColor="#0f172a"
              borderColor="#94A3B8"
              navHeight="44px"
              gap="10px"
              fontSize="16px"
            />

            {!isAuthenticated ? (
              <Link
                to="/dang-ky"
                className="ml-2 inline-flex h-11 items-center gap-1 rounded-full border border-slate-400 px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"              >
                <UserIcon className="h-[18px] w-[18px]" />
                Tài khoản
              </Link>
            ) : (
              <div
                ref={hoverRef}
                className="relative ml-2"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
                onFocus={openMenu}
                onBlur={scheduleClose}
              >
                <button
                  type="button"
                  className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-full border border-slate-400 px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"                  onClick={() => navigate("/tai-khoan/ho-so-cua-toi")}
                >
                  <UserIcon className="h-[18px] w-[18px]" />
                  Tài khoản
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      key="acc-dd"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-xl border bg-white shadow-lg"
                      onMouseEnter={openMenu}
                      onMouseLeave={scheduleClose}
                    >
                      {/* USER */}
                      {isUserOnly && (
                        <>
                          <button
                            onClick={() => {
                              setOpen(false);
                              navigate("/tai-khoan/ho-so-cua-toi");
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            <UserIcon className="h-4 w-4" /> Quản lý tài khoản
                          </button>
                          <Link
                            to="/yeu-thich"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <Heart className="h-4 w-4" /> Sản phẩm yêu thích
                          </Link>
                          <Link
                            to="/don-hang"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <ShoppingCart className="h-4 w-4" /> Đơn hàng của tôi
                          </Link>
                          <Link
                            to="/lich-su-mua-hang"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <History className="h-4 w-4" /> Lịch sử mua hàng
                          </Link>
                        </>
                      )}

                      {/* SALE */}
                      {isSale && (
                        <>
                          <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <Home className="h-4 w-4" /> HomePage
                          </Link>
                          <Link
                            to="/sale"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <ShoppingCart className="h-4 w-4" /> SalePage
                          </Link>
                        </>
                      )}

                      {/* ADMIN */}
                      {isAdmin && (
                        <>
                          <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <Home className="h-4 w-4" /> HomePage
                          </Link>
                          <Link
                            to="/sale"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <ShoppingCart className="h-4 w-4" /> SalePage
                          </Link>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                            onClick={() => setOpen(false)}
                          >
                            <Shield className="h-4 w-4" /> AdminPage
                          </Link>
                        </>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          logout();
                          setOpen(false);
                          sessionStorage.setItem("intro.skip.once", "1");
                          navigate("/dang-nhap?skipIntro=1", { replace: true });
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4" /> Đăng xuất
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* ===== MOBILE STACK ===== */}
        <div className="py-2 md:hidden">
          {/* Logo giữa */}
          <div className="flex items-center justify-center">
            <Link to="/" aria-label="Về trang chủ" className="block">
              <img src={logo} alt="INKVERSE" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Hàng: Search (trái) + 4 action (phải) */}
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 basis-[62%]">
              <div className="w-full">
                <div className="flex w-full max-w-[220px] items-center gap-2 rounded-full bg-white/70 px-2 py-[1px] shadow-none ring-[0.8px] ring-slate-200 backdrop-blur-xl sm:max-w-[260px]">
                  <HeaderCategoryMenu
                    variant="embedded"
                    className="ml-0 cursor-pointer scale-[0.8] md:scale-100"
                  />
                  <span className="h-4 w-px bg-slate-200" />
                  <SearchBox className="min-w-0 flex-1" />
                </div>
              </div>
            </div>

            {/* 4 action*/}
            <nav className="flex shrink-0 items-center gap-1">
              <Link
                to="/"
                className="hidden md:inline-flex p-2 rounded-xl border"
                aria-label="Trang chủ"
              >
                <Home className="h-4 w-4" />
              </Link>

              <Link
                to="/lien-he"
                className="grid h-[32px] w-[32px] place-items-center rounded-full border-[0.8px] bg-white/70 text-slate-900"
                aria-label="Liên hệ"
              >
                <Phone className="h-4 w-4" />
              </Link>

              <Link
                to="/gio-hang"
                className="grid h-[32px] w-[32px] place-items-center rounded-full border-[0.8px] bg-white/70 text-slate-900"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-semibold text-white ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate("/tai-khoan/ho-so-cua-toi")}
                  className="grid h-[32px] w-[32px] place-items-center rounded-full border-[0.8px] bg-white/70 text-slate-900"
                  aria-label="Tài khoản"
                >
                  <UserIcon className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/dang-ky"
                  className="grid h-9 w-9 place-items-center rounded-full border bg-white/70 text-slate-900 "
                  aria-label="Tài khoản"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
