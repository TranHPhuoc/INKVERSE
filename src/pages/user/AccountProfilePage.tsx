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
  const [d, setD] = useState<string>("");
  const [m, setM] = useState<string>("");
  const [y, setY] = useState<string>("");

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
      <div className="rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-black/5">
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
        className="rounded-2xl bg-white/90 p-6 shadow-md ring-1 ring-black/5 backdrop-blur"
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-semibold text-gray-800">Hồ sơ cá nhân</h2>

        {/* Họ */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Họ<span className="text-red-500">*</span>
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
            placeholder="Ví dụ: Trần"
            required
          />
        </div>

        {/* Tên */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Tên<span className="text-red-500">*</span>
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
            placeholder="Ví dụ: Hữu Phước"
            required
          />
        </div>

        {/* Số điện thoại */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">Số điện thoại</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
            placeholder="Nhập số điện thoại"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">Email</label>
          <input
            value={me?.email || ""}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
          />
        </div>

        {/* Giới tính */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Giới tính<span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-6">
            {(["MALE", "FEMALE", "OTHER"] as Gender[]).map((g) => (
              <label key={g} className="inline-flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === g}
                  onChange={() => setGender(g)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                {g === "MALE" ? "Nam" : g === "FEMALE" ? "Nữ" : "Khác"}
              </label>
            ))}
          </div>
        </div>

        {/* Birthday */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-600">
            Ngày sinh<span className="text-red-500">*</span>
          </label>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            <input
              placeholder="DD"
              inputMode="numeric"
              maxLength={2}
              value={d}
              onChange={(e) => setD(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
              required
            />
            <input
              placeholder="MM"
              inputMode="numeric"
              maxLength={2}
              value={m}
              onChange={(e) => setM(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
              required
            />
            <input
              placeholder="YYYY"
              inputMode="numeric"
              maxLength={4}
              value={y}
              onChange={(e) => setY(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500"
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
          <motion.button
            type="submit"
            disabled={saving}
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
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </motion.button>
        </div>
      </motion.form>

      <CartToast
        open={toastOpen}
        text={toastMsg}
        onClose={() => setToastOpen(false)}
        duration={1400}
      />
    </>
  );
}
