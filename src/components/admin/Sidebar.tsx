// src/components/admin/Sidebar.tsx
import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Tags,
  SquarePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Item = { to: string; label: string; icon: React.ElementType };

const items: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/masters", label: "Master Data", icon: SquarePlus },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`sticky top-0 h-full  shrink-0 text-white transition-all duration-500 ${
        open ? "w-64" : "w-20"
      } bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-800 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.3)]`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {open && (
          <h1 className="text-lg font-bold tracking-wide text-indigo-100 drop-shadow-sm">
            INKVERSE
          </h1>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-indigo-200 hover:bg-white/10 hover:text-white transition"
          title={open ? "Thu gọn" : "Mở rộng"}
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-3 space-y-1 px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/admin"}>
            {({ isActive }) => (
              <div
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600/30 text-indigo-50 shadow-inner ring-1 ring-indigo-400/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700/60 text-indigo-300 group-hover:bg-slate-600/70 group-hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                </div>
                {open && <span className="truncate">{label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer (optional) */}
      <div className="absolute bottom-3 w-full px-4">
        {open && (
          <div className="text-[11px] text-slate-400/80 text-center">
            © 2025 Inkverse Admin
          </div>
        )}
      </div>
    </aside>
  );
}
