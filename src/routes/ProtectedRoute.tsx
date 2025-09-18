import { useEffect, useState, type ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { getMe, type MeInfo } from "../services/me";

type Props = {
    children: ReactNode;
    /** Danh sách role được phép. Bỏ trống => chỉ cần đăng nhập */
    roles?: string[];
};

export default function ProtectedRoute({ children, roles = [] }: Props) {
    const [ok, setOk] = useState<boolean | null>(null);
    const loc = useLocation();

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const me: MeInfo = await getMe();
                // Nếu gọi thành công => đã đăng nhập
                if (!alive) return;
                if (roles.length === 0) {
                    setOk(true); // chỉ cần login
                    return;
                }
                const userRoles = new Set<string>();
                if (me.role) userRoles.add(me.role);
                if (me.roles) me.roles.forEach((r) => r && userRoles.add(r));
                setOk(roles.some((r) => userRoles.has(r)));
            } catch {
                if (alive) setOk(false); // chưa login hoặc token invalid
            }
        })();
        return () => { alive = false; };
    }, [roles]);

    if (ok === null) return <div className="p-6">Đang kiểm tra quyền…</div>;

    if (!ok) {
        const next = encodeURIComponent(loc.pathname + loc.search);
        return <Navigate to={`/dang-nhap?next=${next}`} replace />;
    }

    return <>{children}</>;
}
