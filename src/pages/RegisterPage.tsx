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
      <div className="min-h-screen flex flex-col">
        <main className="relative flex-1 flex items-center justify-center px-4 py-10 text-white">
          <div className="absolute inset-0 -z-10">
            <img
                src={bgPoster}
                alt="Books poster background"
                className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="w-full max-w-md rounded-2xl bg-black/70 shadow-xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Tạo Tài Khoản
            </h2>

            <form className="space-y-4" onSubmit={onSubmit}>
              {!!err && (
                  <div className="text-red-200 text-sm bg-red-500/20 border border-red-400/40 rounded-md p-2">
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
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                opacity-60 focus:opacity-100 focus:text-gray-900 focus:font-medium
                focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500 transition focus:text-white"
              />

              <input
                  name="password"
                  type="password"
                  placeholder="Mật khẩu"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={onChange}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                opacity-60 focus:opacity-100 focus:text-gray-900 focus:font-medium
                focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500 transition focus:text-white"              />

              <input
                  name="username"
                  type="text"
                  placeholder="Tên người dùng"
                  autoComplete="username"
                  value={form.username}
                  onChange={onChange}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                opacity-60 focus:opacity-100 focus:text-gray-900 focus:font-medium
                focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500 transition focus:text-white"              />

              <input
                  name="fullName"
                  type="text"
                  placeholder="Họ và Tên"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={onChange}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                opacity-60 focus:opacity-100 focus:text-gray-900 focus:font-medium
                focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500 transition focus:text-white"              />

              <input
                  name="phone"
                  type="tel"
                  placeholder="Số điện thoại"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={onChange}
                  className="w-full border-b px-3 py-2 md:px-4 md:py-3 text-sm md:text-base
                opacity-60 focus:opacity-100 focus:text-gray-900 focus:font-medium
                focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500 transition focus:text-white"              />

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 bg-red-600 hover:bg-red-700 active:scale-[0.99] py-3 rounded-lg text-white font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang gửi OTP..." : "Đăng ký"}
              </button>

              <button
                  type="button"
                  className="w-full border border-white/20 rounded-lg py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 active:scale-[0.99] transition"
              >
                <FcGoogle size={22} />
                <span className="text-sm md:text-base font-medium">
                Đăng ký với Google
              </span>
              </button>

              <p className="text-center text-sm md:text-base text-white/80">
                Đã có tài khoản?{" "}
                <Link to="/dang-nhap" className="text-blue-400 hover:underline font-medium">
                  Đăng nhập
                </Link>
              </p>
            </form>
          </div>
        </main>

      </div>
  );
}
