import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthAPI, getAxiosErrMsg } from "../services/auth";

type LocationState = { email?: string; otp?: string };

export default function ForgotVerifyPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const { email = "", otp = "" } = (loc.state || {}) as LocationState;

    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        if (!email || !otp) nav("/quen-mat-khau", { replace: true });
    }, [email, otp, nav]);

    const confirmMismatch = useMemo(
        () => newPw && confirmPw && newPw !== confirmPw,
        [newPw, confirmPw]
    );

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !otp) return;
        setErr(null);
        setOk(false);
        try {
            await AuthAPI.forgotPasswordVerify({
                email,
                otp,
                newPassword: newPw,
                confirmPassword: confirmPw,
            });
            setOk(true);
            setTimeout(() => nav("/dang-nhap", { replace: true }), 700);
        } catch (error) {
            setErr(getAxiosErrMsg(error, "Đặt lại mật khẩu thất bại."));
        }
    };

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-4 text-xl font-semibold">Đặt lại mật khẩu</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    className="w-full cursor-not-allowed rounded border bg-gray-100 px-3 py-2"
                    value={email}
                    disabled
                />
                <input
                    className="w-full rounded border px-3 py-2"
                    type="password"
                    placeholder="Mật khẩu mới (6–64 ký tự)"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    minLength={6}
                    maxLength={64}
                    required
                />
                <input
                    className="w-full rounded border px-3 py-2"
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    minLength={6}
                    maxLength={64}
                    required
                />
                {confirmMismatch && (
                    <p className="text-sm text-orange-600">Mật khẩu xác nhận chưa khớp.</p>
                )}
                <button className="w-full rounded bg-black px-3 py-2 text-white">Xác nhận</button>
                {ok && <p className="text-sm text-green-600">Thành công. Đang chuyển về trang đăng nhập…</p>}
                {err && <p className="text-sm text-red-600">{err}</p>}
            </form>
        </div>
    );
}
