// src/routes/ProtectedRoute.tsx
import { useEffect, useState, type ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { getMe, type MeInfo } from "../services/me";

type Props = {
  children: ReactNode;
  roles?: string[];
};

function hasAnyRole(me: MeInfo | null, required: string[]) {
  if (!me) return false;
  if (required.length === 0) return true;
  const set = new Set<string>();
  if (me.role) set.add(me.role);
  (me.roles ?? []).forEach((r) => r && set.add(r));
  return required.some((r) => set.has(r));
}

export default function ProtectedRoute({ children, roles = [] }: Props) {
  const [me, setMe] = useState<MeInfo | null>(() => {
    try {
      const raw = localStorage.getItem("auth.me");
      return raw ? (JSON.parse(raw) as MeInfo) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");
  const loc = useLocation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await getMe();
        if (cancelled) return;
        setMe(user);
        localStorage.setItem("auth.me", JSON.stringify(user));
        if (hasAnyRole(user, roles)) setStatus("ok");
        else setStatus("denied");
      } catch {
        if (cancelled) return;
        // Nếu cache có quyền thì vẫn cho vào
        if (hasAnyRole(me, roles)) setStatus("ok");
        else setStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles]);

  if (status === "denied") {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/dang-nhap?next=${next}`} replace />;
  }

  // Render layout luôn, chỉ overlay phần main nếu đang check
  return (
    <div className="relative">
      {children}

      {status === "checking" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="animate-pulse text-gray-600">
            Đang xác thực quyền truy cập...
          </div>
        </div>
      )}
    </div>
  );
}
