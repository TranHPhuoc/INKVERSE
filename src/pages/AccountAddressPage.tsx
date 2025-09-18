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
} from "../services/account-address";
import {motion} from "framer-motion";

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
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (pending) return;

        try {
            setPending(true);
            setErr(null);

            if (editId != null) {
                // UPDATE
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
            value: (form[key] ?? "") as string | number | readonly string[],
            onChange: (ev: React.ChangeEvent<HTMLInputElement>) =>
                setForm((s) => ({ ...s, [key]: ev.target.value } as AddressCreate)),
        };
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Đang tải địa chỉ…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-indigo-50 py-10">
            <div className="max-w-5xl mx-auto px-4 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-700 grid place-items-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5m0 2c-4.67 0-8 2.33-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.67-3.33-5-8-5"/></svg>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Địa chỉ của tôi</h1>
                </div>

                {err && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 text-rose-700 px-4 py-3 text-sm shadow-sm">
                        {err}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={onSubmit} className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5 p-5 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-1.5">
                            <span className="text-xs font-medium text-gray-600">Họ và tên</span>
                            <input
                                className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                                required {...bind("fullName")}
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-xs font-medium text-gray-600">Số điện thoại</span>
                            <input
                                className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                                required {...bind("phone")}
                            />
                        </label>
                    </div>

                    <label className="space-y-1.5 block">
                        <span className="text-xs font-medium text-gray-600">Tỉnh/Thành, Quận/Huyện, Phường/Xã</span>
                        <div className="grid md:grid-cols-3 gap-4">
                            <input placeholder="Phường/Xã"
                                   className="rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                                   required {...bind("ward")} />
                            <input placeholder="Quận/Huyện"
                                   className="rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                                   required {...bind("district")} />
                            <input placeholder="Tỉnh/Thành"
                                   className="rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                                   required {...bind("province")} />
                        </div>
                    </label>

                    <label className="space-y-1.5 block">
                        <span className="text-xs font-medium text-gray-600">Địa chỉ (Số nhà, đường…)</span>
                        <input
                            className="w-full rounded-xl border px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/50"
                            required {...bind("line1")}
                        />
                    </label>

                    <label className="inline-flex items-center gap-3 select-none">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={!!form.makeDefault}
                            onChange={(e) => setForm((s) => ({ ...s, makeDefault: e.target.checked }))}
                        />
                        <span className="text-sm text-gray-700 cursor-pointer">Đặt làm địa chỉ mặc định</span>
                    </label>

                    <div className="flex justify-between">
                        {editId != null ? (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="h-11 px-4 rounded-xl border bg-white hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
                            >
                                Hủy
                            </button>
                        ) : <span />}

                        <motion.button
                            type="submit"
                            disabled={pending}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-medium shadow-sm hover:opacity-95 disabled:opacity-60 cursor-pointer"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M19 21H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1h3l1-2h8l1 2h3a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2M6 9v10h12V9z"/></svg>
                            {pending ? "Đang lưu..." : editId != null ? "Cập nhật địa chỉ" : "Thêm địa chỉ"}
                        </motion.button>
                    </div>
                    <button>

                    </button>
                </form>

                {/* Danh sách */}
                <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm ring-1 ring-black/5 overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50/60">
                        <h2 className="text-sm font-medium text-gray-700">Danh sách địa chỉ</h2>
                    </div>

                    <div className="divide-y">
                        {list.length === 0 && (
                            <div className="px-5 py-8 text-center text-gray-500">Chưa có địa chỉ nào</div>
                        )}

                        {list.map((a) => (
                            <div key={a.id} className="px-5 py-4 grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_120px_210px] gap-3 md:items-center">
                                <div className="font-medium text-gray-900">{a.fullName}</div>
                                <div className="text-sm text-gray-600">{a.phone}</div>
                                <div className="text-sm text-gray-700">{a.line1}, {a.ward}, {a.district}, {a.province}</div>

                                <div>
                                    {a.isDefault ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1">
                      ✓ Mặc định
                    </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1">
                      Khác
                    </span>
                                    )}
                                </div>

                                <div className="flex gap-2 justify-start md:justify-end">
                                    {!a.isDefault && (
                                        <motion.button
                                            onClick={async () => { await setDefaultAddress(a.id); await refresh(); }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="h-9 px-4 min-w-[110px] rounded-lg border bg-white hover:bg-gray-50
             text-gray-700 text-sm cursor-pointer whitespace-nowrap"
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
                                        className="h-9 px-3 rounded-lg border bg-white hover:bg-gray-50 text-gray-700 text-sm cursor-pointer"
                                    >
                                        Sửa
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={async () => { await deleteMyAddress(a.id); await refresh(); }}
                                        className="h-9 px-3 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-sm cursor-pointer"
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
