import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthAPI } from "../services/auth.ts";
import type { AxiosError } from "axios";

type ApiEnvelope<T> = {
  statusCode: number;
  error: string | null;
  message: string;
  data: T;
};

type ApiErrorBody = { message?: string };

type RegState = {
  email: string;
  password: string;
  username?: string;
  fullName?: string;
  phone?: string;
};

function getApiMessage(e: unknown, fallback: string): string {
  const err = e as AxiosError<ApiEnvelope<ApiErrorBody> | ApiErrorBody>;
  const data = err.response?.data as unknown;

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    (data as { data: { message?: string } }).data?.message
  ) {
    return (data as { data: { message?: string } }).data!.message!;
  }
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof (data as { message?: string }).message === "string"
  ) {
    return (data as { message?: string }).message!;
  }

  return err?.message ?? fallback;
}
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const regData = (location.state || {}) as RegState;

  const valid = useMemo(() => !!regData?.email && !!regData?.password, [regData]);
  useEffect(() => {
    if (!valid) navigate("/dang-ky");
  }, [valid, navigate]);

  const [otp, setOtp] = useState("");
  const [tries, setTries] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!otp) {
      setErr("Vui lòng nhập mã OTP.");
      return;
    }
    if (tries >= 5) {
      setErr("Bạn đã nhập sai quá 5 lần. Hãy bấm Gửi lại OTP.");
      return;
    }
    try {
      setVerifying(true);
      await AuthAPI.verifyEmail({
        ...regData,
        otp,
      });
      navigate("/dang-nhap");
    } catch (error: unknown) {
      setTries((t) => t + 1);
      const msg = getApiMessage(error, "Mã OTP không đúng hoặc đã hết hạn.");
      setErr(`${msg} (Sai ${tries + 1}/5)`);
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setErr(null);
    try {
      await AuthAPI.resendOtp(regData.email);
      setCooldown(60);
      setTries(0);
    } catch (error: unknown) {
      const msg = getApiMessage(error, "Không gửi lại được OTP.");
      setErr(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold">Xác thực email</h1>
        <p className="mb-4 text-center text-sm text-gray-600">
          Mã OTP đã được gửi đến <span className="font-medium">{regData.email}</span>.
        </p>

        {!!err && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            {err}
          </div>
        )}

        <form onSubmit={onVerify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.trim())}
            className="w-full border-b px-3 py-3 text-base focus:border-b-2 focus:border-blue-500 focus:ring-0 focus:outline-none"
          />

          <button
            type="submit"
            disabled={verifying || tries >= 5}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? "Đang xác thực..." : "Xác thực"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={resend}
            disabled={cooldown > 0}
            className="text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0 ? `Gửi lại OTP (${cooldown}s)` : "Gửi lại OTP"}
          </button>

          <Link to="/dang-ky" className="text-gray-600 hover:underline">
            Sửa email
          </Link>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Sau 5 lần nhập sai, bạn phải “Gửi lại OTP” để thử tiếp.
        </p>
      </div>
    </div>
  );
}
