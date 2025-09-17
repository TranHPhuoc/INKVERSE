import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI, getAxiosErrMsg } from "../services/auth";

// Popup nhập OTP
function OtpModal({
                      open, onClose, onSubmit,
                  }: { open: boolean; onClose: () => void; onSubmit: (otp: string) => void }) {
    const [otp, setOtp] = useState("");
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
                <h2 className="mb-3 text-lg font-semibold">Nhập mã OTP</h2>
                <input
                    className="mb-4 w-full rounded border px-3 py-2"
                    placeholder="Nhập OTP từ email"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                    <button className="rounded px-3 py-2" onClick={() => { setOtp(""); onClose(); }}>
                        Hủy
                    </button>
                    <button
                        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                        disabled={!otp}
                        onClick={() => onSubmit(otp)}
                    >
                        Tiếp tục
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ForgotStartPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const [err, setErr] = useState<string | null>(null);
    const [otpOpen, setOtpOpen] = useState(false);

    const onSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cooldown > 0) return;
        setErr(null);
        try {
            await AuthAPI.forgotPasswordStart({ email });
            // cooldown gửi lại
            setCooldown(60);
            const t = setInterval(() => {
                setCooldown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
            }, 1000);
            // mở popup OTP
            setOtpOpen(true);
        } catch (error) {
            setErr(getAxiosErrMsg(error, "Không gửi được OTP."));
        }
    };

    const handleOtpSubmit = (otp: string) => {
        setOtpOpen(false);
        nav("/dat-lai-mat-khau", { state: { email, otp } });
    };

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-4 text-xl font-semibold">Quên mật khẩu</h1>
            <form onSubmit={onSend} className="space-y-3">
                <input
                    className="w-full rounded border px-3 py-2"
                    type="email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button
                    className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                    disabled={!email || cooldown > 0}
                >
                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi OTP"}
                </button>
                {err && <p className="text-sm text-red-600">{err}</p>}
            </form>

            <OtpModal open={otpOpen} onClose={() => setOtpOpen(false)} onSubmit={handleOtpSubmit} />
        </div>
    );
}
