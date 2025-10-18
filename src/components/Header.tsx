// src/components/Header.tsx
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

  /* ---- Pills ---- */
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

  /* ---- Account menu hover ---- */
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
    <header className="sticky top-0 z-300 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_-20px_rgba(2,6,23,.35)]">
      <div className={SHELL}>
        <div className="flex h-[72px] items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Về trang chủ">
            <img src={logo} alt="INKVERSE" className="h-12 md:h-14 w-auto" />
          </Link>

          {/* Search + Category (embedded) */}
          <div className="flex flex-1 justify-center">
            {/* Không dùng overflow-hidden để không chặn portal của SearchBox */}
            <div className="flex w-full max-w-[820px] items-center gap-2 rounded-full bg-white/70 ring-1 ring-slate-200 backdrop-blur-xl shadow-[0_6px_20px_-8px_rgba(0,0,0,.25)] px-2 py-1">
              <HeaderCategoryMenu variant="embedded" className="ml-1 cursor-pointer" />
              <span className="h-6 w-px bg-slate-200" />
              {/* SearchBox auto handle submit + suggestions */}
              <SearchBox className="flex-1" />
            </div>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center">
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
                className="ml-2 inline-flex h-11 items-center gap-1 rounded-full border px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
              >
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
                  className="inline-flex h-11 items-center gap-1 rounded-full border px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white cursor-pointer"
                  onClick={() => navigate("/tai-khoan/ho-so-cua-toi")}
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
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
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
                            <History className="h-4 w-4 " /> Lịch sử mua hàng
                          </Link>
                        </>
                      )}

                      {/* SALE */}
                      {isSale && (
                        <>
                          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                            <Home className="h-4 w-4" /> HomePage
                          </Link>
                          <Link to="/sale" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                            <ShoppingCart className="h-4 w-4" /> SalePage
                          </Link>
                        </>
                      )}

                      {/* ADMIN */}
                      {isAdmin && (
                        <>
                          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                            <Home className="h-4 w-4" /> HomePage
                          </Link>
                          <Link to="/sale" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                            <ShoppingCart className="h-4 w-4" /> SalePage
                          </Link>
                          <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
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
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-gray-50 cursor-pointer"
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
      </div>
    </header>
  );
};

export default Header;
