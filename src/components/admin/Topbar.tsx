// src/components/admin/TopBar.tsx
import { useRef, useState, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, User as UserIcon, Home, ShoppingCart, Shield } from "lucide-react";
import { useAuth } from "../../context/useAuth";

export default function AdminTopbar() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user, logout } = useAuth();

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

  const openNow = () => {
    if (!open) setOpen(true);
  };
  const closeSoon = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 160);
  };
  const cancelClose = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  const userLabel = useMemo(() => user?.name || user?.email || "Admin", [user?.name, user?.email]);

  const handleLogout = async () => {
    try {
      await logout(); // 👈 dùng AuthContext để reset state
    } finally {
      setOpen(false); // đóng dropdown ngay lập tức
      sessionStorage.setItem("intro.skip.once", "1"); // chặn Intro
      navigate("/dang-nhap?skipIntro=1", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-white/70 backdrop-blur">
      <div className="flex-1 px-4">
        <nav className="text-sm text-gray-500">
          <Link to="/admin" className="hover:underline">
            admin
          </Link>
          {crumbs.slice(1).map((c, i, arr) => (
            <span key={c.to}>
              <span className="mx-2">/</span>
              {i === arr.length - 1 ? (
                <span className="font-medium text-gray-900">{c.label}</span>
              ) : (
                <Link to={c.to} className="hover:underline">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Account */}
      <div className="flex items-center gap-2 px-4">
        <span className="pointer-events-none text-sm text-gray-700">{userLabel}</span>

        <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen((v) => !v)} // hỗ trợ mobile
            aria-haspopup="menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-gray-100 hover:bg-gray-50"
          >
            <UserIcon className="h-5 w-5" />
          </motion.button>

          {/* Dropdown */}
          <motion.div
            initial={false}
            animate={
              open
                ? { opacity: 1, y: 0, pointerEvents: "auto" }
                : { opacity: 0, y: -6, pointerEvents: "none" }
            }
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-48 rounded-xl border bg-white shadow-lg"
            role="menu"
            onMouseEnter={cancelClose}
            onMouseLeave={closeSoon}
            onMouseDown={(e) => e.preventDefault()}
          >
            {/* HomePage */}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <Home className="h-4 w-4" /> HomePage
            </Link>

            {/* SalePage */}
            <Link
              to="/sale"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <ShoppingCart className="h-4 w-4" /> SalePage
            </Link>

            {/* AdminPage */}
            <Link
              to="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <Shield className="h-4 w-4" /> AdminPage
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-gray-50"
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
