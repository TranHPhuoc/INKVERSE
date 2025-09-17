// src/components/Header.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, User as UserIcon, LogOut, ShoppingCart, Home, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchBox from "./SearchBox";
import logo from "../assets/logoweb.png";
import { getCart } from "../services/cart";

const Header: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<number | null>(null);
    const navigate = useNavigate();

    const [cartCount, setCartCount] = useState<number>(0);

    // Hàm refresh badge
    async function refreshBadge() {
        try {
            if (!isAuthenticated) {
                setCartCount(0);
                return;
            }
            const res = await getCart();
            // Nếu BE trả tổng quantity
            if (typeof (res as any).totalItems === "number") {
                setCartCount((res as any).totalItems);
            } else if (Array.isArray((res as any).items)) {
                // Nếu BE trả danh sách items thì lấy length làm số sản phẩm khác nhau
                setCartCount((res as any).items.length);
            } else {
                setCartCount(0);
            }
        } catch {
            setCartCount(0);
        }
    }

    // Lấy số ban đầu khi login/logout
    useEffect(() => {
        void refreshBadge();
    }, [isAuthenticated]);

    // Nghe event cart:changed để update
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<{ totalItems?: number; uniqueItems?: number }>).detail;
            if (detail && (typeof detail.totalItems === "number" || typeof detail.uniqueItems === "number")) {
                setCartCount(detail.totalItems ?? detail.uniqueItems ?? 0);
            } else {
                void refreshBadge(); // fallback nếu event không có detail
            }
        };
        window.addEventListener("cart:changed", handler as EventListener);
        return () => window.removeEventListener("cart:changed", handler as EventListener);
    }, []);


    const armClose = () => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => setOpen(false), 120);
    };
    const cancelClose = () => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
        setOpen(true);
    };

    return (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="shrink-0"
                >
                    <Link to="/" className="flex items-center gap-2 cursor-pointer">
                        <img src={logo} alt="INKVERSE" className="h-10 md:h-12" />
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
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                        <Home className="h-4 w-4" />
                        <span>Trang chủ</span>
                    </Link>
                    <Link
                        to="/lien-he"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                        <Phone className="h-4 w-4" />
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
                            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border hover:bg-gray-50 cursor-pointer"
                            aria-label="Giỏ hàng"
                            title="Giỏ hàng"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span
                                    aria-label={`${cartCount} sản phẩm trong giỏ`}
                                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[11px] leading-[18px] px-1 text-center shadow"
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
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 text-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-rose-500 cursor-pointer"
                        >
                            <UserIcon className="h-4 w-4" />
                            Tài khoản
                        </motion.button>
                    ) : (
                        <div className="relative" onMouseEnter={cancelClose} onMouseLeave={armClose}>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setOpen((v) => !v)}
                                aria-haspopup="menu"
                                aria-expanded={open}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-full border bg-white hover:bg-gray-50 cursor-pointer"
                            >
                                <UserIcon className="h-5 w-5" />
                            </motion.button>

                            {/* Dropdown */}
                            <motion.div
                                initial={false}
                                animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                                transition={{ duration: 0.16 }}
                                className={`absolute right-0 mt-3 w-56 rounded-xl border bg-white shadow-lg z-50 ${
                                    open ? "visible" : "invisible"
                                }`}
                                role="menu"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <div className="absolute -top-3 right-0 h-3 w-full" aria-hidden />
                                <Link
                                    to="/tai-khoan/dia-chi"
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm cursor-pointer"
                                    role="menuitem"
                                    onClick={() => setOpen(false)}
                                >
                                    <UserIcon className="h-4 w-4" /> Quản lý tài khoản
                                </Link>
                                <Link
                                    to="/don-hang"
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm cursor-pointer"
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
                                    className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-rose-600 cursor-pointer"
                                    role="menuitem"
                                >
                                    <LogOut className="h-4 w-4" /> Đăng xuất
                                </button>
                            </motion.div>
                        </div>
                    )}
                </motion.nav>
            </div>

            {/* Search (mobile) */}
            <div className="md:hidden border-t bg-white">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5">
                    <div className="relative">
                        <SearchBox className="w-full pl-10" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
