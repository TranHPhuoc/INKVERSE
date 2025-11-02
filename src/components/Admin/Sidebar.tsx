import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Tags,
  SquarePlus,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Package,        // stocks
  PackagePlus,    // new batch
  History,        // batch history
} from "lucide-react";

type Item = {
  to: string;
  label: string;
  icon: React.ElementType;
  children?: { to: string; label: string; icon?: React.ElementType }[];
};

const items: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/masters", label: "Master Data", icon: SquarePlus },
  {
    to: "/admin/warehouse",
    label: "Warehouse",
    icon: Boxes,
    children: [
      { to: "/admin/warehouse/stocks",       label: "Stocks",        icon: Package },
      { to: "/admin/warehouse/batches/new",  label: "New Batch",     icon: PackagePlus },
      { to: "/admin/warehouse/batches",      label: "Batch History", icon: History },
    ],
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const defaultGroups = useMemo(
    () => ({
      "/admin/warehouse": false,
    }),
    []
  );
  const [openGroup, setOpenGroup] = useState<Record<string, boolean>>(defaultGroups);

  const { pathname } = useLocation();

  useEffect(() => {
    items.forEach((it) => {
      if (it.children && pathname.startsWith(it.to + "/")) {
        setOpenGroup((m) => ({ ...m, [it.to]: true }));
      }
    });
  }, [pathname]);

  const isParentActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside
      className={`sticky top-0 h-full shrink-0 text-white transition-all duration-500 ${
        open ? "w-64" : "w-20"
      } bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-800 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.3)]`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {open && <h1 className="text-lg font-bold tracking-wide text-indigo-100 drop-shadow-sm">INKVERSE</h1>}
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
        {items.map(({ to, label, icon: Icon, children }) => {
          const parentActive = isParentActive(to);
          const isGroup = Array.isArray(children) && children.length > 0;

          if (!isGroup) {
            return (
              <NavLink key={to} to={to} end={to === "/admin"}>
                {({ isActive }) => (
                  <div
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-600/30 text-indigo-50 ring-1 ring-indigo-400/40"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
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
            );
          }

          const expanded = (openGroup[to] ?? parentActive) && open;

          return (
            <div key={to}>
              <button
                type="button"
                onClick={() =>
                  setOpenGroup((m) => ({ ...m, [to]: !(m[to] ?? false) }))
                }
                className={`w-full cursor-pointer group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  parentActive
                    ? "bg-indigo-600/30 text-indigo-50 ring-1 ring-indigo-400/40"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title={label}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                    parentActive
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700/60 text-indigo-300 group-hover:bg-slate-600/70 group-hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                </div>
                {open && <span className="truncate">{label}</span>}
              </button>

              <div
                className="mt-1 pl-12 pr-1"
                style={{
                  overflow: "hidden",
                  transition: "max-height 260ms ease, opacity 200ms ease",
                  maxHeight: expanded ? 500 : 0,
                  opacity: expanded ? 1 : 0,
                }}
              >
                {expanded && (
                  <ul className="grid gap-2">
                    {children.map((c) => {
                      const CIcon = c.icon ?? Boxes;
                      return (
                        <li key={c.to} className="list-none">
                          <NavLink to={c.to} end>
                            {({ isActive }) => (
                              <div
                                className={[
                                  "relative flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition-colors",
                                  "isolation-isolate",
                                  isActive
                                    ? "bg-indigo-500/30 text-indigo-50 ring-1 ring-white/10"
                                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                                ].join(" ")}
                              >
                                <CIcon size={16} className={isActive ? "opacity-100" : "opacity-80"} />
                                <span className="truncate">{c.label}</span>
                              </div>
                            )}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="absolute bottom-3 w-full px-4">
        {open && <div className="text-[11px] text-slate-400/80 text-center">© 2025 Inkverse Admin</div>}
      </div>
    </aside>
  );
}
