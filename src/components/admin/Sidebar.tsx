import { NavLink } from "react-router-dom";
import { useState } from "react";
import { LayoutDashboard, BookOpen, Users, Tags, SquarePlus } from "lucide-react";

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
      className={`sticky top-0 h-screen shrink-0 bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white transition-all duration-300 ${open ? "w-64" : "w-16"}`}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-white/15 px-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex rounded p-2 hover:bg-white/10"
          title={open ? "Thu gọn" : "Mở rộng"}
        >
          <div className="space-y-1">
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
            <span className="block h-0.5 w-5 bg-white" />
          </div>
        </button>
        {open && <div className="font-bold tracking-wide">Admin</div>}
      </div>

      {/* Nav */}
      <nav className="py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/admin"}
            className={({ isActive }) =>
              `mx-2 my-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isActive ? "bg-white text-indigo-700 shadow-md" : "hover:bg-white/10"
              }`
            }
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${open ? "bg-white/10" : "bg-white/20"}`}
            >
              <Icon size={18} />
            </span>
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
