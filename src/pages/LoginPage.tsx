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

      // nếu có query next thì ưu tiên
      let target = "/";
      if (next) {
        target = decodeURIComponent(next);
      } else {
        // fallback theo role
        const raw = localStorage.getItem("auth.user");
        const u = raw ? (JSON.parse(raw) as { role?: string; roles?: string[] }) : null;
        const roles = new Set([u?.role, ...((u?.roles ?? []) as string[])].filter(Boolean) as string[]);
        target = roles.has("ROLE_ADMIN") || roles.has("ADMIN") ? "/admin" : "/";
      }

      navigate(target, { replace: true });
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<ApiErrorBody>;
      setErr(axiosErr.response?.data?.message ?? "Đăng nhập thất bại.");
    }
  };


  return (
      <div className="min-h-screen flex flex-col">
        <main className="relative flex-1 flex items-center justify-center px-4 py-10 text-white">
          <div className="absolute inset-0 -z-10">
            <img
                src={bgPoster}
                alt="Books poster background"
                className="w-full h-full object-cover brightness-50"
            />
          </div>

          <div className="w-full max-w-md rounded-2xl bg-black/70 shadow-xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Đăng nhập</h2>

            <form className="space-y-4" onSubmit={onSubmit}>
              <input
                  type="text"
                  placeholder="Tên đăng nhập"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                         opacity-60 focus:opacity-100 focus:outline-none focus:border-b-2
                         focus:border-blue-500 transition text-white"
              />

              <input
                  type="password"
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                         opacity-60 focus:opacity-100 focus:outline-none focus:border-b-2
                         focus:border-blue-500 transition text-white"
              />

              {err && <p className="text-red-400 text-sm md:text-base">{err}</p>}

              <p className="text-end md:text-base">
                <Link to="/quen-mat-khau" className="text-red-400 hover:underline font-medium">
                  Quên mật khẩu
                </Link>
              </p>

              <button
                  type="submit"
                  className="w-full mt-1 md:mt-2 bg-red-500 text-white py-3 md:py-3.5 rounded-lg
                         text-base md:text-lg font-semibold hover:bg-red-600 active:scale-[0.99] transition"
              >
                Đăng nhập
              </button>

              <p className="text-center text-sm md:text-base">
                Chưa có tài khoản{" "}
                <Link to="/dang-ky" className="text-blue-300 hover:underline font-medium">
                  Đăng ký
                </Link>
              </p>
            </form>
          </div>
        </main>

      </div>
  );
}
