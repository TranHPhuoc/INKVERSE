import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { changePassword } from "../../services/user";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import CartToast from "../../components/CardToast";

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
        // hiện toast thành công
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
        className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur"
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="mb-5 text-xl font-semibold">Đổi mật khẩu</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Mật khẩu hiện tại<span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Mật khẩu hiện tại"
            required
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Mật khẩu mới<span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Mật khẩu mới"
            required
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">
            Nhập lại mật khẩu mới<span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Nhập lại mật khẩu mới"
            required
          />
        </div>

        {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="mx-auto block w-48 cursor-pointer rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
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
