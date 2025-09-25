import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../../context/useAuth";
import {
  userGetById,
  userUpdateMe,
  type ResUserDTO,
  type ReqUserUpdate,
} from "../../services/user";
import CartToast from "../../components/CardToast";

type Gender = "MALE" | "FEMALE" | "OTHER";

const pad2 = (n: number) => String(n).padStart(2, "0");

function splitFullName(fullName?: string | null): { lastName: string; firstName: string } {
  const s = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!s) return { lastName: "", firstName: "" };
  const parts = s.split(" ");
  if (parts.length === 1) return { lastName: "", firstName: parts[0] ?? "" };
  const first = parts[parts.length - 1] ?? "";
  const last = parts.slice(0, -1).join(" ");
  return { lastName: last, firstName: first };
}
function joinFullName(lastName: string, firstName: string) {
  return [lastName.trim(), firstName.trim()].filter(Boolean).join(" ").trim();
}
function isValidYMD(y: string, m: string, d: string) {
  if (!y || !m || !d) return false;
  const yy = +y,
    mm = +m,
    dd = +d;
  if (yy < 1900 || yy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  const dt = new Date(`${yy}-${pad2(mm)}-${pad2(dd)}T00:00:00Z`);
  return dt.getUTCFullYear() === yy && dt.getUTCMonth() + 1 === mm && dt.getUTCDate() === dd;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? "Đã xảy ra lỗi.";
  }
  if (err instanceof Error) return err.message || "Đã xảy ra lỗi.";
  return "Đã xảy ra lỗi.";
}

export default function AccountProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<ResUserDTO | null>(null);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>("");

  // form state
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [d, setD] = useState<string>(""); // day
  const [m, setM] = useState<string>(""); // month
  const [y, setY] = useState<string>(""); // year

  const birthISO = useMemo(() => {
    if (!isValidYMD(y, m, d)) return "";
    return `${y}-${pad2(+m)}-${pad2(+d)}`;
  }, [d, m, y]);

  useEffect(() => {
    (async () => {
      try {
        if (user?.id == null) return;
        const data = await userGetById(Number(user.id));
        setMe(data);

        const name = splitFullName(data.fullName);
        setLastName(name.lastName);
        setFirstName(name.firstName);
        setPhone(data.phone ?? "");
        setGender((data.gender as Gender) ?? "");

        const b = data.birthDate ?? "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(b)) {
          const [yy, mm, dd] = b.split("-");
          setY(yy ?? "");
          setM(mm ?? "");
          setD(dd ?? "");
        } else {
          setY("");
          setM("");
          setD("");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullName = joinFullName(lastName, firstName);

    const payload: ReqUserUpdate = {};
    if (fullName) payload.fullName = fullName;
    if (phone.trim() !== "") payload.phone = phone.trim();
    if (gender) payload.gender = gender;
    if (birthISO) payload.birthDate = birthISO;

    setSaving(true);
    try {
      const updated: ResUserDTO = await userUpdateMe(payload);
      setMe(updated);
      setToastMsg("Lưu thông tin thành công");
      setToastOpen(true);
    } catch (err: unknown) {
      setToastMsg(getErrorMessage(err));
      setToastOpen(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mb-3 h-10 w-full animate-pulse rounded bg-gray-200" />
        <div className="mb-3 h-10 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
      </div>
    );
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
        <h2 className="mb-5 text-xl font-semibold">Hồ sơ cá nhân</h2>

        {/* Họ */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Họ<span className="text-red-500">*</span>
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Ví dụ: Trần"
            required
          />
        </div>

        {/* Tên */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Tên<span className="text-red-500">*</span>
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Ví dụ: Hữu Phước"
            required
          />
        </div>

        {/* Số điện thoại */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Số điện thoại</label>
          <div className="flex gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>

        {/* Email (chỉ hiển thị) */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Email</label>
          <div className="flex gap-3">
            <input
              value={me?.email || ""}
              disabled
              className="flex-1 rounded-lg border bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>
        </div>

        {/* Giới tính */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">
            Giới tính<span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                checked={gender === "MALE"}
                onChange={() => setGender("MALE")}
              />
              Nam
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                checked={gender === "FEMALE"}
                onChange={() => setGender("FEMALE")}
              />
              Nữ
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="gender"
                checked={gender === "OTHER"}
                onChange={() => setGender("OTHER")}
              />
              Khác
            </label>
          </div>
        </div>

        {/* Birthday: dd / mm / yyyy */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium">
            Birthday<span className="text-red-500">*</span>
          </label>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            <input
              placeholder="DD"
              inputMode="numeric"
              maxLength={2}
              value={d}
              onChange={(e) => setD(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <input
              placeholder="MM"
              inputMode="numeric"
              maxLength={2}
              value={m}
              onChange={(e) => setM(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
            <input
              placeholder="YYYY"
              inputMode="numeric"
              maxLength={4}
              value={y}
              onChange={(e) => setY(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-gray-800"
              required
            />
          </div>
          {y || m || d ? (
            <p className="mt-1 text-xs text-gray-500">
              {isValidYMD(y, m, d) ? "" : "Ngày sinh không hợp lệ."}
            </p>
          ) : null}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-48 cursor-pointer rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </motion.form>

      {/* Toast */}
      <CartToast
        open={toastOpen}
        text={toastMsg}
        onClose={() => setToastOpen(false)}
        duration={1400}
      />
    </>
  );
}
