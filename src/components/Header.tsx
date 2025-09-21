import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User as UserIcon, LogOut, ShoppingCart, Home, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchBox from "./SearchBox";
import logo from "../assets/logoweb.png";
import { getCart } from "../services/cart";

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

function extractUniqueCount(res: any): number {
  if (!res) return 0;
  if (typeof res.uniqueItems === "number") return res.uniqueItems;
  if (typeof res.distinctItems === "number") return res.distinctItems;
  if (Array.isArray(res.items)) return res.items.length;
  return 0;
}

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  const [cartCount, setCartCount] = useState<number>(() => getBadgeCache());

  async function refreshBadge() {
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
  }

  useEffect(() => {
    void refreshBadge();
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ totalItems?: number; uniqueItems?: number }>).detail;
      if (typeof detail?.uniqueItems === "number") {
        setCartCount(detail.uniqueItems);
        setBadgeCache(detail.uniqueItems);
      } else {
        void refreshBadge();
      }
    };
    window.addEventListener("cart:changed", handler as EventListener);
    return () => window.removeEventListener("cart:changed", handler as EventListener);
  }, []);

  const armClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
      {/* row chính */}
      <div className="mx-auto grid h-25 max-w-[1990px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 md:px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="shrink-0"
        >
          <Link to="/" className="flex cursor-pointer items-center gap-2">
            <img src={logo} alt="INKVERSE" className="h-20 md:h-22" />
          </Link>
        </motion.div>

        {/* Search (desktop) */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="hidden md:block"
        >
          <div className="relative">
            <SearchBox className="w-full pl-10" />
          </div>
        </motion.div>

        {/* Right actions */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 md:gap-3"
        >
          <Link
            to="/"
            className="hidden cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 text-xl text-gray-700 hover:bg-gray-50 sm:inline-flex"
          >
            <Home className="h-7 w-7" />
            <span>Trang chủ</span>
          </Link>
          <Link
            to="/lien-he"
            className="hidden cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 text-xl text-gray-700 hover:bg-gray-50 sm:inline-flex"
          >
            <Phone className="h-7 w-7" />
            <span>Liên hệ</span>
          </Link>

          {/* Cart */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/gio-hang");
            }}
          >
            <motion.button
              id="header-cart-icon"
              type="submit"
              whileTap={{ scale: 0.96 }}
              className="relative inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border hover:bg-gray-50"
              aria-label="Giỏ hàng"
              title="Giỏ hàng"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span
                  aria-label={`${cartCount} sản phẩm trong giỏ`}
                  className="absolute -top-1 -right-1 h-[18px] min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[11px] leading-[18px] text-white shadow"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </motion.button>
          </form>

          {/* Account */}
          {!isAuthenticated ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/dang-ky")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500"
            >
              <UserIcon className="h-6 w-6" />
              Tài khoản
            </motion.button>
          ) : (
            <div className="relative" onMouseEnter={cancelClose} onMouseLeave={armClose}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border bg-white hover:bg-gray-50"
              >
                <UserIcon className="h-6 w-6" />
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {open && (
                  <motion.div
                    key="acc-dd"
                    initial={{ opacity: 0, y: 10, scale: 0.98, originY: 0 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                    className="absolute right-0 z-50 mt-3 w-60 overflow-hidden rounded-xl border bg-white shadow-lg"
                    role="menu"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-rose-100 via-fuchsia-100 to-indigo-100" />
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/tai-khoan/dia-chi");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      role="menuitem"
                    >
                      <UserIcon className="h-4 w-4" />
                      Quản lý tài khoản
                    </button>
                    <Link
                      to="/don-hang"
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                    >
                      <ShoppingCart className="h-4 w-4" /> Đơn hàng của tôi
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setOpen(false);
                        navigate("/dang-nhap");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.nav>
      </div>

      {/* Search (mobile) */}
      <div className="border-t bg-white md:hidden">
        <div className="mx-auto max-w-[1990px] px-4 py-2.5 md:px-6">
          <div className="relative">
            <SearchBox className="w-full pl-10" />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
