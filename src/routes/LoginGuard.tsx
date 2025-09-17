import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

function resolveTarget(roles: Set<string>, nextRaw: string | null) {
    const next = nextRaw && decodeURIComponent(nextRaw);
    const isAdmin = roles.has("ROLE_ADMIN") || roles.has("ADMIN");

    if (isAdmin) {
        if (next && next.startsWith("/admin")) return next;
        return "/admin";
    }
    if (next && !next.startsWith("/admin")) return next;
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
        // ignore
    }

    return <>{children}</>;
}
