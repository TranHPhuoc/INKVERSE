import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { listMyAddresses } from "../services/account-address";
import type { AxiosError } from "axios";

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

      const atAddress = loc.pathname.startsWith("/tai-khoan/dia-chi");
      const atLogin = loc.pathname.startsWith("/dang-nhap");

      try {
        const addrs = await listMyAddresses();

        if (!alive) return;

        const hasAny = Array.isArray(addrs) && addrs.length > 0;
        if (!hasAny) {
          if (!atAddress) {
            nav(`/tai-khoan/dia-chi?return=${encodeURIComponent(returnTo)}`, { replace: true });
          }
          return;
        }

        setReady(true);
      } catch (err) {
        if (!alive) return;

        const e = err as AxiosError; // 👈 cast thay cho any
        const status = e.response?.status;

        if (status === 401) {
          if (!atLogin) {
            nav(`/dang-nhap?next=${encodeURIComponent(returnTo)}`, { replace: true });
          }
          return;
        }

        if (!atAddress) {
          nav(`/tai-khoan/dia-chi?return=${encodeURIComponent(returnTo)}`, { replace: true });
        }
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
