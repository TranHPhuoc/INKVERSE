import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { changePassword } from "../../services/user";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import CartToast from "../../components/CardToast";
import { Eye, EyeOff } from "lucide-react";

const TOAST_MS = 1400;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? "Có lỗi xảy ra.";
  }
  if (err instanceof Error) return err.message || "Có lỗi xảy ra.";
  return "Có lỗi xảy ra.";
}

export default function AccountChangePasswordPage() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [err, setErr] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // toggle show/hide password
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");

  const nav = useNavigate();
  const auth = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (newPw.length < 6) {
      setErr("Mật khẩu mới phải từ 6 ký tự.");
      return;
    }
    if (newPw !== confirmPw) {
      setErr("Xác nhận mật khẩu không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePassword({
        oldPassword: oldPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      });

      if (res.statusCode === 200) {
        setToastMsg("Đổi mật khẩu thành công");
        setToastOpen(true);

        window.setTimeout(() => {
          auth?.logout?.();
          nav("/dang-nhap", { replace: true });
        }, TOAST_MS);
      } else {
        const msg =
          (typeof res.error === "string" && res.error) || res.message || "Đổi mật khẩu thất bại.";
        setErr(msg);
      }
    } catch (err: unknown) {
      setErr(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.form
        onSubmit={onSubmit}
        className="rounded-2xl bg-white/90 p-6 shadow-md ring-1 ring-black/5 backdrop-blur"
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-semibold text-gray-800">Đổi mật khẩu</h2>

        {/* Old password */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Mật khẩu hiện tại<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
              placeholder="Mật khẩu hiện tại"
              required
            />
            <button
              type="button"
              onClick={() => setShowOld((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showOld ? (
                <EyeOff className="h-5 w-5 cursor-pointer" />
              ) : (
                <Eye className="h-5 w-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Mật khẩu mới<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
              placeholder="Mật khẩu mới"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNew ? (
                <EyeOff className="h-5 w-5 cursor-pointer" />
              ) : (
                <Eye className="h-5 w-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Nhập lại mật khẩu mới<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
              placeholder="Nhập lại mật khẩu mới"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? (
                <EyeOff className="h-5 w-5 cursor-pointer" />
              ) : (
                <Eye className="h-5 w-5 cursor-pointer" />
              )}
            </button>
          </div>
        </div>

        {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 px-5 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="currentColor"
                d="M19 21H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1h3l1-2h8l1 2h3a1 1 0 0 0 1 1v12a2 2 0 0 1-2 2M6 9v10h12V9z"
              />
            </svg>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </motion.button>
        </div>
      </motion.form>

      <CartToast
        open={toastOpen}
        text={toastMsg}
        onClose={() => setToastOpen(false)}
        duration={TOAST_MS}
      />
    </>
  );
}
