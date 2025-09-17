import { useEffect, useState, type ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { getMe, type MeInfo } from "../services/me";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const [ok, setOk] = useState<boolean | null>(null);
    const loc = useLocation();

    useEffect(() => {
        (async () => {
            try {
                const me: MeInfo = await getMe();
                const roles: string[] = [];
                if (me.role) roles.push(me.role);
                if (me.roles) roles.push(...me.roles);
                setOk(roles.includes("ROLE_ADMIN") || roles.includes("ADMIN"));
            } catch {
                setOk(false);
            }
        })();
    }, []);
    if (ok === null) return <div className="p-6">Đang kiểm tra quyền…</div>;
    if (!ok) {
        const next = encodeURIComponent(loc.pathname + loc.search);
        return <Navigate to={`/dang-nhap?next=${next}`} replace />;
    }

    return <>{children}</>;
}
