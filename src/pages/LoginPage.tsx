import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { ApiErrorBody } from "../types/http";
import bgPoster from "../assets/backgroundbooks.png";
import { useAuth } from "../context/useAuth";
import { FcGoogle } from "react-icons/fc";

/* ───────── helpers ───────── */
type RolesLike = { role?: string; roles?: string[] };
function getRoles(): Set<string> {
  try {
    const raw = localStorage.getItem("auth.user");
    const u = raw ? (JSON.parse(raw) as RolesLike) : null;
    const list = [u?.role, ...((u?.roles ?? []) as string[])].filter(Boolean) as string[];
    return new Set(list);
  } catch {
    return new Set();
  }
}

function isAllowedInternalPath(p: string | null | undefined): string | null {
  if (!p) return null;
  try {
    const url = new URL(p, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return p.startsWith("/") ? p : null;
  }
}

function pickHomeByRole(roles: Set<string>): string {
  const has = (r: string) => roles.has(r) || roles.has(r.replace("ROLE_", ""));
  if (has("ROLE_ADMIN")) return "/Admin";
  if (has("ROLE_SALE")) return "/Sale/orders";
  return "/";
}

function canAccess(path: string, roles: Set<string>): boolean {
  const isAdminArea = path.startsWith("/Admin");
  const isSaleArea = path.startsWith("/Sale");
  const has = (r: string) => roles.has(r) || roles.has(r.replace("ROLE_", ""));
  if (isAdminArea) return has("ROLE_ADMIN");
  if (isSaleArea) return has("ROLE_SALE");
  return true;
}

/* ───────── component ───────── */
export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const rawNext = useMemo(
    () => new URLSearchParams(location.search).get("next"),
    [location.search],
  );
  const safeNext = useMemo(() => isAllowedInternalPath(rawNext), [rawNext]);

  useEffect(() => {
    const roles = getRoles();
    if (roles.size > 0) {
      const target = safeNext && canAccess(safeNext, roles) ? safeNext : pickHomeByRole(roles);
      navigate(target, { replace: true });
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    setLoading(true);
    try {
      await login({ username, password });

      const roles = getRoles();

      const target = safeNext && canAccess(safeNext, roles) ? safeNext : pickHomeByRole(roles);

      navigate(target, { replace: true });
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<ApiErrorBody>;
      setErr(axiosErr.response?.data?.message ?? "Đăng nhập thất bại.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 items-center justify-center px-4 py-10 text-white">
        {/* background */}
        <div className="absolute inset-0 z-0">
          <img
            src={bgPoster}
            alt="Books poster background"
            className="h-full w-full object-cover brightness-50"
            loading="eager"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* card */}
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 shadow-xl md:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">Đăng nhập</h2>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <input
              type="text"
              placeholder="Tên đăng nhập"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-b px-3 py-2 text-sm text-white opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:opacity-100 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b px-3 py-2 text-sm text-white opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:opacity-100 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            {err && <p className="text-sm text-red-400 md:text-base">{err}</p>}

            <p className="text-end md:text-base">
              <Link to="/quen-mat-khau" className="font-medium text-red-400 hover:underline">
                Quên mật khẩu
              </Link>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full cursor-pointer rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 md:mt-2 md:py-3.5 md:text-lg"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 py-3 transition hover:bg-white/10 active:scale-[0.99]"
            >
              <FcGoogle size={22} />
              <span className="text-sm font-medium md:text-base">Đăng nhập với Google</span>
            </button>

            <p className="text-center text-sm md:text-base">
              Chưa có tài khoản{" "}
              <Link to="/dang-ky" className="font-medium text-blue-300 hover:underline">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
