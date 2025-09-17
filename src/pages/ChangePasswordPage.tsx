import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAxiosErrMsg } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
    const nav = useNavigate();
    const { changePassword } = useAuth();
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [ok, setOk] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null); setOk(false);
        try {
            await changePassword({ oldPassword: oldPw, newPassword: newPw, confirmPassword: confirmPw });
            setOk(true);
            setTimeout(() => nav("/dang-nhap"), 800);
        } catch (error) {
            setErr(getAxiosErrMsg(error, "Đổi mật khẩu thất bại."));
        }
    };

    const confirmMismatch = confirmPw && newPw && newPw !== confirmPw;

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Đổi mật khẩu</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input className="w-full border rounded px-3 py-2" type="password"
                       placeholder="Mật khẩu hiện tại"
                       value={oldPw} onChange={(e)=>setOldPw(e.target.value)} required />
                <input className="w-full border rounded px-3 py-2" type="password"
                       placeholder="Mật khẩu mới (6–64 ký tự)"
                       value={newPw} minLength={6} maxLength={64}
                       onChange={(e)=>setNewPw(e.target.value)} required />
                <input className="w-full border rounded px-3 py-2" type="password"
                       placeholder="Xác nhận mật khẩu mới"
                       value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)} required />
                {confirmMismatch && <p className="text-orange-600 text-sm">Mật khẩu xác nhận chưa khớp.</p>}
                <button className="w-full rounded px-3 py-2 bg-black text-white">Cập nhật</button>
                {ok && <p className="text-green-600 text-sm">Đổi mật khẩu thành công. Vui lòng đăng nhập lại.</p>}
                {err && <p className="text-red-600 text-sm">{err}</p>}
            </form>
        </div>
    );
}
