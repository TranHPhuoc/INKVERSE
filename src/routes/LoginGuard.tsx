import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

function resolveTarget(roles: Set<string>, nextRaw: string | null) {
  const next = nextRaw && decodeURIComponent(nextRaw);
  const isAdmin = roles.has("ROLE_ADMIN") || roles.has("ADMIN");
  const isSale = roles.has("ROLE_SALE") || roles.has("SALE");

  // ADMIN ưu tiên /Admin (và chỉ cho next vào /Admin)
  if (isAdmin) {
    if (next && next.startsWith("/Admin")) return next;
    return "/Admin";
  }

  // SALE: chặn /Admin; còn lại cho đi theo next, mặc định /Sale/orders
  if (isSale) {
    if (next && !next.startsWith("/Admin")) {
      return next;
    }
    return "/Sale/orders";
  }

  // User thường: chỉ cho next không thuộc /Admin hoặc /Sale
  if (next && !next.startsWith("/Admin") && !next.startsWith("/Sale")) return next;
  return "/";
}

export default function LoginGuard({ children }: Props) {
  const loc = useLocation();

  try {
    const raw = localStorage.getItem("auth.user");
    if (raw) {
      const u = JSON.parse(raw) as { role?: string; roles?: string[] };
      const roles = new Set([u.role, ...(u.roles ?? [])].filter(Boolean) as string[]);
      const params = new URLSearchParams(loc.search);
      const next = params.get("next");
      const target = resolveTarget(roles, next);
      return <Navigate to={target} replace />;
    }
  } catch {
    //
  }

  return <>{children}</>;
}
