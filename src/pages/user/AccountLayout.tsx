import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const ease: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function SideItem({ to, label }: { to: string; label: string }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(`/tai-khoan/${to}`);

  return (
    <div className="relative">
      {active && (
        <motion.span
          layoutId="account-tab-pill"
          className="pointer-events-none absolute inset-0 z-0 rounded-lg"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,0,122,0.06) 0%, rgba(99,102,241,0.06) 100%)",
          }}
          transition={{ duration: 0.28, ease }}
        />
      )}

      <NavLink
        to={to}
        className={`relative z-10 flex h-10 items-center rounded-lg px-4 text-sm leading-[1.2] font-medium transition-colors duration-200 select-none ${
          active ? "text-gray-900" : "text-gray-700 hover:text-gray-900"
        }`}
      >
        {label}
      </NavLink>
    </div>
  );
}

export default function AccountLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* Khung chung: sidebar + content cùng một card bo góc */}
      <div className="overflow-hidden rounded-2xl border bg-white/90 shadow-sm">
        <div className="grid gap-0 md:grid-cols-[260px_1fr]">
          {/* Sidebar: sticky (dính), căn padding đồng nhất để chữ không lệch */}
          <aside className="relative border-b md:border-r md:border-b-0">
            <div className="self-start md:sticky md:top-[80px]">
              <div className="mb-1 px-4 text-sm font-semibold text-black">QUẢN LÝ TÀI KHOẢN</div>
              <nav className="relative space-y-1 px-2">
                <SideItem to="dia-chi" label="Địa chỉ" />
              </nav>
            </div>
          </aside>

          {/* Content: chuyển cảnh nhẹ nhàng giữa 2 tab */}
          <section className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}
