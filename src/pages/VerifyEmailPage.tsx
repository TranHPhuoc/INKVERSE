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
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-2">Xác thực email</h1>
                <p className="text-center text-sm text-gray-600 mb-4">
                    Mã OTP đã được gửi đến <span className="font-medium">{regData.email}</span>.
                </p>

                {!!err && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2 mb-3">
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
                        className="w-full border-b px-3 py-3 text-base
              focus:outline-none focus:ring-0 focus:border-b-2 focus:border-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={verifying || tries >= 5}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold
              hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {verifying ? "Đang xác thực..." : "Xác thực"}
                    </button>
                </form>

                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={resend}
                        disabled={cooldown > 0}
                        className="text-blue-600 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {cooldown > 0 ? `Gửi lại OTP (${cooldown}s)` : "Gửi lại OTP"}
                    </button>

                    <Link to="/dang-ky" className="text-gray-600 hover:underline">
                        Sửa email
                    </Link>
                </div>

                <p className="mt-3 text-xs text-gray-500 text-center">
                    Sau 5 lần nhập sai, bạn phải “Gửi lại OTP” để thử tiếp.
                </p>
            </div>
        </div>
    );
}
