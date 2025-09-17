// src/hooks/useEnsureAddress.ts
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listMyAddresses } from "../services/account-address";

/**
 * Dùng ở các trang cần login + có địa chỉ mặc định (Checkout)
 * - Nếu chưa login: chuyển /dang-nhap?next=<returnTo>
 * - Nếu đã login nhưng chưa có địa chỉ: chuyển /tai-khoan/dia-chi?return=<returnTo>
 * - Nếu OK hết: ready=true, checking=false để trang render
 * LƯU Ý: tránh redirect khi đang đứng ngay trang địa chỉ hoặc login để không loop.
 */
export default function useEnsureAddress(returnTo: string = "/checkout") {
    const nav = useNavigate();
    const loc = useLocation();

    const [checking, setChecking] = useState(true);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let alive = true;

        (async () => {
            setChecking(true);
            setReady(false);

            // đang ở trang địa chỉ / login thì KHÔNG tự redirect để tránh vòng lặp
            const atAddress = loc.pathname.startsWith("/tai-khoan/dia-chi");
            const atLogin = loc.pathname.startsWith("/dang-nhap");

            try {
                const addrs = await listMyAddresses(); // 401 nếu chưa login

                if (!alive) return;

                const hasAny = Array.isArray(addrs) && addrs.length > 0;
                if (!hasAny) {
                    if (!atAddress) {
                        nav(`/tai-khoan/dia-chi?return=${encodeURIComponent(returnTo)}`, { replace: true });
                    }
                    return;
                }

                // Có địa chỉ -> cho phép render
                setReady(true);
            } catch (e: any) {
                if (!alive) return;

                const status = e?.response?.status;
                if (status === 401) {
                    if (!atLogin) {
                        nav(`/dang-nhap?next=${encodeURIComponent(returnTo)}`, { replace: true });
                    }
                    return;
                }

                // Lỗi khác -> coi như thiếu địa chỉ
                if (!atAddress) {
                    nav(`/tai-khoan/dia-chi?return=${encodeURIComponent(returnTo)}`, { replace: true });
                }
                return;
            } finally {
                if (alive) setChecking(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [loc.pathname, loc.search, nav, returnTo]);

    return { checking, ready };
}
