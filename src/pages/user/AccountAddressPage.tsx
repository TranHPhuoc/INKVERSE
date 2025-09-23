import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listMyAddresses,
  createMyAddress,
  deleteMyAddress,
  setDefaultAddress,
  updateMyAddress,
  type Address,
  type AddressCreate,
} from "../../services/account-address.ts";
import { motion } from "framer-motion";
import useVnLocations from "../../hooks/useVNLocation";
import type { Province, District, Ward } from "../../hooks/useVNLocation";

/* ==================== helpers ==================== */
function normalizeVN(s?: string): string {
  if (!s) return "";
  return s.trim().toLowerCase();
}

function findByName<T extends { name: string }>(arr: readonly T[], name?: string): T | undefined {
  if (!name) return undefined;
  const target = normalizeVN(name);
  return (
    arr.find((x) => normalizeVN(x.name) === target) ??
    arr.find((x) => normalizeVN(x.name).includes(target))
  );
}

/* ==================== component ==================== */
export default function AccountAddressPage() {
  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<AddressCreate>({
    fullName: "",
    phone: "",
    line1: "",
    ward: "",
    district: "",
    province: "",
    makeDefault: true,
  });

  /* ----- location hook ----- */
  const { provinces, districts, wards, loadDistricts, loadWards } = useVnLocations();
  const [provinceCode, setProvinceCode] = useState<number | "">("");
  const [districtCode, setDistrictCode] = useState<number | "">("");
  const [wardCode, setWardCode] = useState<number | "">("");

  // load districts when province changes
  useEffect(() => {
    if (provinceCode !== "") void loadDistricts(Number(provinceCode));
    // chỉ phụ thuộc provinceCode để tránh loop
  }, [provinceCode]);

  // load wards when district changes
  useEffect(() => {
    if (districtCode !== "") void loadWards(Number(districtCode));
  }, [districtCode]);

  // sync display names into form
  useEffect(() => {
    const p = provinces.find((x) => x.code === provinceCode);
    const d = districts.find((x) => x.code === districtCode);
    const w = wards.find((x) => x.code === wardCode);
    setForm((s) => ({
      ...s,
      province: p?.name || "",
      district: d?.name || "",
      ward: w?.name || "",
    }));
  }, [provinceCode, districtCode, wardCode, provinces, districts, wards]);

  useEffect(() => {
    if (!provinceCode && provinces.length && form.province) {
      const p = findByName<Province>(provinces, form.province);
      if (p) setProvinceCode(p.code);
    }
  }, [provinces, form.province]);

  useEffect(() => {
    if (!districtCode && districts.length && form.district) {
      const d = findByName<District>(districts, form.district);
      if (d) setDistrictCode(d.code);
    }
  }, [districts, form.district]);

  useEffect(() => {
    if (!wardCode && wards.length && form.ward) {
      const w = findByName<Ward>(wards, form.ward);
      if (w) setWardCode(w.code);
    }
  }, [wards, form.ward]);

  const [search] = useSearchParams();
  const nav = useNavigate();

  const returnTo = (() => {
    const raw = search.get("return");
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

  async function refresh(): Promise<void> {
    try {
      setErr(null);
      const data = await listMyAddresses();
      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Không tải được địa chỉ");
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  /* ----- form logic ----- */
  function resetForm() {
    setEditId(null);
    setForm({
      fullName: "",
      phone: "",
      line1: "",
      ward: "",
      district: "",
      province: "",
      makeDefault: true,
    });
    setProvinceCode("");
    setDistrictCode("");
    setWardCode("");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (pending) return;

    try {
      setPending(true);
      setErr(null);

      if (editId != null) {
        await updateMyAddress(editId, form);
      } else {
        await createMyAddress(form);
      }

      await refresh();
      resetForm();

      if (returnTo) nav(returnTo, { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Lưu địa chỉ thất bại");
    } finally {
      setPending(false);
    }
  }

  function bind<K extends keyof AddressCreate>(key: K) {
    return {
      value: (form[key] ?? "") as string,
      onChange: (ev: React.ChangeEvent<HTMLInputElement>) =>
        setForm((s) => ({ ...s, [key]: ev.target.value }) as AddressCreate),
    };
  }

  /* ----- UI ----- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        Đang tải địa chỉ…
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600/10 text-indigo-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
              <path
                fill="currentColor"
                d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 9a1 1 0 0 1-1-1c0-3.866 4.477-7 8-7s8 3.134 8 7a1 1 0 0 1-1 1z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Địa chỉ của tôi</h1>
        </div>

        {/* error */}
        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {err}
          </div>
        )}

        {/* form */}
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border bg-white/80 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-gray-600">Họ và tên</span>
              <input
                className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70"
                required
                {...bind("fullName")}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-gray-600">Số điện thoại</span>
              <input
                className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70"
                required
                {...bind("phone")}
              />
            </label>
          </div>

          {/* selects */}
          <label className="block space-y-1.5">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Province */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-gray-600">Tỉnh/Thành phố</span>
                <select
                  className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70"
                  value={provinceCode}
                  onChange={(e) => {
                    const code = e.target.value ? Number(e.target.value) : "";
                    setProvinceCode(code);
                    setDistrictCode("");
                    setWardCode("");
                  }}
                  required
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* District */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-gray-600">Quận/Huyện</span>
                <select
                  className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70 disabled:opacity-60"
                  value={districtCode}
                  onChange={(e) => {
                    const code = e.target.value ? Number(e.target.value) : "";
                    setDistrictCode(code);
                    setWardCode("");
                  }}
                  disabled={!provinceCode}
                  required
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Ward */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-gray-600">Phường/Xã</span>
                <select
                  className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70 disabled:opacity-60"
                  value={wardCode}
                  onChange={(e) => setWardCode(e.target.value ? Number(e.target.value) : "")}
                  disabled={!districtCode}
                  required
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </label>

          {/* line1 */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-gray-600">Địa chỉ (Số nhà, đường…)</span>
            <input
              className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/70"
              required
              {...bind("line1")}
            />
          </label>

          {/* default */}
          <label className="inline-flex items-center gap-3 select-none">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={!!form.makeDefault}
              onChange={(e) => setForm((s) => ({ ...s, makeDefault: e.target.checked }))}
            />
            <span className="cursor-pointer text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
          </label>

          {/* buttons */}
          <div className="flex justify-between">
            {editId != null ? (
              <button
                type="button"
                onClick={resetForm}
                className="h-11 cursor-pointer rounded-xl border bg-white px-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
            ) : (
              <span />
            )}

            <motion.button
              type="submit"
              disabled={pending}
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
              {pending ? "Đang lưu..." : editId != null ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
            </motion.button>
          </div>
        </form>

        {/* list */}
        <div className="overflow-hidden rounded-2xl border bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <div className="border-b bg-gray-50/60 px-5 py-3">
            <h2 className="text-sm font-medium text-gray-700">Danh sách địa chỉ</h2>
          </div>

          <div className="divide-y">
            {list.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-500">Chưa có địa chỉ nào</div>
            )}

            {list.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1fr_140px_1fr_120px_210px] md:items-center"
              >
                <div className="font-medium text-gray-900">{a.fullName}</div>
                <div className="text-sm text-gray-600">{a.phone}</div>
                <div className="text-sm text-gray-700">
                  {a.line1}, {a.ward}, {a.district}, {a.province}
                </div>

                <div>
                  {a.isDefault ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      ✓ Mặc định
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      Khác
                    </span>
                  )}
                </div>

                <div className="flex justify-start gap-2 md:justify-end">
                  {!a.isDefault && (
                    <motion.button
                      onClick={async () => {
                        await setDefaultAddress(a.id);
                        await refresh();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-9 min-w-[110px] cursor-pointer rounded-lg border bg-white px-4 text-sm whitespace-nowrap text-gray-700 hover:bg-gray-50"
                    >
                      Đặt mặc định
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => {
                      setEditId(a.id);
                      setForm({
                        fullName: a.fullName,
                        phone: a.phone,
                        line1: a.line1,
                        ward: a.ward,
                        district: a.district,
                        province: a.province,
                        makeDefault: a.isDefault ?? false,
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 cursor-pointer rounded-lg border bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sửa
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      await deleteMyAddress(a.id);
                      await refresh();
                    }}
                    className="h-9 cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-3 text-sm text-rose-700 hover:bg-rose-100"
                  >
                    Xóa
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
