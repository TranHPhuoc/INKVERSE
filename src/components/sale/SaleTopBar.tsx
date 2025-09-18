import { useRef, useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, User as UserIcon } from "lucide-react";
import { AuthAPI } from "../../services/auth";

export default function SaleTopbar() {
    const navigate = useNavigate();
    const loc = useLocation();
    const [open, setOpen] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const crumbs = useMemo(() => {
        const parts = loc.pathname.split("/").filter(Boolean);
        const acc: { label: string; to: string }[] = [];
        let path = "";
        for (const p of parts) {
            path += `/${p}`;
            acc.push({ label: decodeURIComponent(p), to: path });
        }
        return acc;
    }, [loc.pathname]);

    const handleLogout = async () => {
        try { await AuthAPI.logout(); } catch {
            //
        }
        localStorage.clear();
        setOpen(false);
        navigate("/dang-nhap", { replace: true });
    };

    // --- hover controls (open on hover, close with small delay to avoid flicker)
    const openNow = () => { if (!open) setOpen(true); };
    const closeSoon = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => setOpen(false), 160);
    };
    const cancelClose = () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };

    const userLabel = useMemo(() => {
        try {
            const raw = localStorage.getItem("auth.user");
            if (!raw) return "Sale";
            const u = JSON.parse(raw) as { email?: string; username?: string };
            return u.username || u.email || "Sale";
        } catch {
            return "Sale";
        }
    }, []);
    return (
        <header className="h-14 sticky top-0 z-10 flex items-center bg-white/70 backdrop-blur border-b">
            <div className="flex-1 px-4">
                {/* breadcrumb đơn giản /sale/... */}
                <nav className="text-sm text-gray-500">
                    <Link to="/sale" className="hover:underline">sale</Link>
                    {crumbs.slice(1).map((c, i, arr) => (
                        <span key={c.to}>
                        <span className="mx-2">/</span>
                            {i === arr.length - 1
                                ? <span className="text-gray-900 font-medium">{c.label}</span>
                                : <Link to={c.to} className="hover:underline">{c.label}</Link>}
                        </span>
                    ))}
                </nav>
            </div>

            {/* Account */}
            <div className="px-4 flex items-center gap-2">
                <span className="text-sm text-gray-700 pointer-events-none">{userLabel}</span>

                <div
                    className="relative"
                    onMouseEnter={openNow}
                    onMouseLeave={closeSoon}
                >
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setOpen(v => !v)} //mobile//
                        aria-haspopup="menu"
                        aria-expanded={open}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                        <UserIcon className="h-5 w-5" />
                    </motion.button>

                    {/* Dropdown */}
                    <motion.div
                        initial={false}
                        animate={open ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: -6, pointerEvents: "none" }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg z-50"
                        role="menu"
                        onMouseEnter={cancelClose}
                        onMouseLeave={closeSoon}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <div
                            className="absolute -top-2 right-0 h-2 w-full"
                            aria-hidden
                            onMouseEnter={cancelClose}
                        />
                        <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-gray-50 cursor-pointer"
                            role="menuitem"
                        >
                            <LogOut className="h-4 w-4" /> Đăng xuất
                        </button>
                    </motion.div>
                </div>
            </div>
        </header>
    );
}
