import { useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";
import { AuthAPI } from "../../services/auth";

export default function Topbar() {
    const loc = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

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

    const userLabel = useMemo(() => {
        try {
            const raw = localStorage.getItem("auth.user");
            if (!raw) return "Admin";
            const u = JSON.parse(raw) as { email?: string; username?: string };
            return u.username || u.email || "Admin";
        } catch {
            return "Admin";
        }
    }, []);

    const handleLogout = async () => {
        try { await AuthAPI.logout(); } catch {}
        localStorage.clear();
        navigate("/dang-nhap", { replace: true });
    };

    return (
        <header className="h-14 sticky top-0 z-10 flex items-center bg-white/70 backdrop-blur border-b">
            <div className="flex-1 px-4">
                <nav className="text-sm text-gray-500">
                    <Link to="/admin" className="hover:underline">admin</Link>
                    {crumbs.slice(1).map((c, i) => (
                        <span key={c.to}>
              <span className="mx-2">/</span>
                            {i === crumbs.length - 2
                                ? <span className="text-gray-900 font-medium">{c.label}</span>
                                : <Link to={c.to} className="hover:underline">{c.label}</Link>}
            </span>
                    ))}
                </nav>
            </div>

            {/* Account */}
            <div
                className="relative px-4"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
            >
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={() => setOpen(v => !v)}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50"
                >
                    <span className="text-sm text-gray-700">{userLabel}</span>
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-gray-100">
            <UserIcon className="h-4 w-4" />
          </span>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-3 z-50">
                    {open && (
                        <div
                            className="relative w-44 rounded-xl bg-white shadow-xl ring-1 ring-gray-200
                         before:content-[''] before:absolute before:-top-2 before:right-0
                         before:h-2 before:w-full before:bg-white"
                            role="menu"
                        >
                            <button
                                onClick={handleLogout}
                                className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-rose-600 cursor-pointer"
                                role="menuitem"
                            >
                                <LogOut className="h-4 w-4" /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
