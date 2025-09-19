import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import type { ApiErrorBody } from "../types/http";
import bgPoster from "../assets/backgroundbooks.png";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next"); // đọc ?next

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login({ username, password });

      let target = "/";
      if (next) {
        target = decodeURIComponent(next);
      } else {
        const raw = localStorage.getItem("auth.user");
        const u = raw ? (JSON.parse(raw) as { role?: string; roles?: string[] }) : null;
        const roles = new Set(
          [u?.role, ...((u?.roles ?? []) as string[])].filter(Boolean) as string[],
        );
        if (roles.has("ROLE_ADMIN") || roles.has("ADMIN")) {
          target = "/admin";
        } else if (roles.has("ROLE_SALE") || roles.has("SALE")) {
          target = "/sale/orders";
        } else {
          target = "/";
        }
      }

      navigate(target, { replace: true });
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<ApiErrorBody>;
      setErr(axiosErr.response?.data?.message ?? "Đăng nhập thất bại.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative flex flex-1 items-center justify-center px-4 py-10 text-white">
        <div className="absolute inset-0 -z-10">
          <img
            src={bgPoster}
            alt="Books poster background"
            className="h-full w-full object-cover brightness-50"
          />
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 shadow-xl md:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">Đăng nhập</h2>

          <form className="space-y-4" onSubmit={onSubmit}>
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
              className="mt-1 w-full rounded-lg bg-red-500 py-3 text-base font-semibold text-white transition hover:bg-red-600 active:scale-[0.99] md:mt-2 md:py-3.5 md:text-lg"
            >
              Đăng nhập
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
