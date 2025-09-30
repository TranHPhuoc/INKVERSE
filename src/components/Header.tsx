import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Phone, ShoppingCart, User as UserIcon, Heart, LogOut, Shield } from "lucide-react";
import { useAuth } from "../context/useAuth";
import SearchBox from "./SearchBox";
import HeaderCategoryMenu from "./HeaderCategoryMenu";
import PillNav from "../components/Animation/PillNav";
import logo from "../assets/logoweb.png";
import { getCart } from "../services/cart";

/* ====== layout shell 1440px ====== */
const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";

/* ---------------- badge cache ---------------- */
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

  // helper roles
  const hasRole = (r: string) => (user?.role || "").toUpperCase() === r.toUpperCase();
  const isAdmin = hasRole("ADMIN") || hasRole("ROLE_ADMIN");
  const isSale = hasRole("SALE") || hasRole("ROLE_SALE");
  const isUserOnly = hasRole("USER") || hasRole("ROLE_USER");

  useEffect(() => setOpen(false), [pathname]);

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
      /**/
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
        <span className="relative inline-flex items-center gap-1">
          <ShoppingCart className="h-[18px] w-[18px]" />
          Giỏ hàng
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-3 h-[16px] min-w-[16px] rounded-full bg-rose-600 px-1 text-[10px] leading-[16px] text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </span>
      ),
      href: "/gio-hang",
      linkProps: {
        id: "header-cart-icon",
        title: "Giỏ hàng",
        onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          navigate("/gio-hang");
        },
      },
    },
  ];

  /* ---------- Hover handlers cho dropdown tài khoản ---------- */
  const hoverRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<number | null>(null);
  const openMenu = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setOpen(true);
  };
  const scheduleClose = () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
      <div className={SHELL}>
        <div className="flex items-center justify-between gap-4 py-2 md:py-3">
          {/* Logo */}
          <Link to="/" className="flex cursor-pointer items-center gap-2">
            <img src={logo} alt="INKVERSE" className="h-14 md:h-16" />
          </Link>

          {/* Search */}
          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-[760px]">
              <div className="absolute left-0 z-10 flex items-center">
                <HeaderCategoryMenu />
              </div>
              <SearchBox className="w-full pl-14" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center">
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
                className="ml-2 inline-flex h-[44px] items-center gap-1 rounded-full border px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
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
                  className="inline-flex h-[44px] items-center gap-1 rounded-full border px-4 text-[16px] font-medium text-slate-900 transition-colors hover:bg-slate-900 hover:text-white"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => navigate("/tai-khoan/ho-so-cua-toi")}
                  title="Quản lý tài khoản"
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
                      role="menu"
                      onMouseEnter={openMenu}
                      onMouseLeave={scheduleClose}
                    >
                      {/* Menu cho USER thường */}
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
                        </>
                      )}

                      {/* Menu cho SALE */}
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

                      {/* Menu cho ADMIN */}
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

                      {/* Đăng xuất */}
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
      </div>
    </header>
  );
};

export default Header;
