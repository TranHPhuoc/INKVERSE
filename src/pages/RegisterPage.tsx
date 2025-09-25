import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthAPI } from "../services/auth.ts";
import bgPoster from "../assets/backgroundbooks.png";
import { FcGoogle } from "react-icons/fc";
import type { ApiErrorBody } from "../types/http";
import { isAxiosError } from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    fullName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    if (!form.email || !form.password) {
      setErr("Email và mật khẩu là bắt buộc.");
      return;
    }

    setLoading(true);
    try {
      await AuthAPI.registerStart(form);
      setLoading(false);
      navigate("/verify-email", { state: form });
    } catch (error: unknown) {
      setLoading(false);
      if (isAxiosError<ApiErrorBody>(error)) {
        const status = error.response?.status;
        const msg = error.response?.data?.message;
        if (status === 409 || status === 400) {
          setErr(msg ?? "Email hoặc username đã tồn tại.");
        } else {
          setErr(msg ?? "Đăng ký thất bại. Vui lòng thử lại.");
        }
      } else {
        setErr("Đăng ký thất bại. Vui lòng thử lại.");
      }
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
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-6 shadow-xl md:p-8">
          <h2 className="mb-6 text-center text-2xl font-bold md:text-3xl">Tạo Tài Khoản</h2>

          <form className="space-y-4" onSubmit={onSubmit}>
            {!!err && (
              <div className="rounded-md border border-red-400/40 bg-red-500/20 p-2 text-sm text-red-200">
                {err}
              </div>
            )}

            <input
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={form.email}
              onChange={onChange}
              className="w-full border-b px-3 py-2 text-sm opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:font-medium focus:text-gray-900 focus:text-white focus:opacity-100 focus:ring-0 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <input
              name="password"
              type="password"
              placeholder="Mật khẩu"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={onChange}
              className="w-full border-b px-3 py-2 text-sm opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:font-medium focus:text-gray-900 focus:text-white focus:opacity-100 focus:ring-0 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <input
              name="username"
              type="text"
              placeholder="Tên người dùng"
              autoComplete="username"
              value={form.username}
              onChange={onChange}
              className="w-full border-b px-3 py-2 text-sm opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:font-medium focus:text-gray-900 focus:text-white focus:opacity-100 focus:ring-0 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <input
              name="fullName"
              type="text"
              placeholder="Họ và Tên"
              autoComplete="name"
              value={form.fullName}
              onChange={onChange}
              className="w-full border-b px-3 py-2 text-sm opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:font-medium focus:text-gray-900 focus:text-white focus:opacity-100 focus:ring-0 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <input
              name="phone"
              type="tel"
              placeholder="Số điện thoại"
              autoComplete="tel"
              value={form.phone}
              onChange={onChange}
              className="w-full border-b px-3 py-2 text-sm opacity-60 transition focus:border-b-2 focus:border-blue-500 focus:font-medium focus:text-gray-900 focus:text-white focus:opacity-100 focus:ring-0 focus:outline-none md:px-4 md:py-3 md:text-base"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full cursor-pointer rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Đang gửi OTP..." : "Đăng ký"}
            </button>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 py-3 transition hover:bg-white/10 active:scale-[0.99]"
            >
              <FcGoogle size={22} />
              <span className="text-sm font-medium md:text-base">Đăng ký với Google</span>
            </button>

            <p className="text-center text-sm text-white/80 md:text-base">
              Đã có tài khoản?{" "}
              <Link to="/dang-nhap" className="font-medium text-blue-400 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
