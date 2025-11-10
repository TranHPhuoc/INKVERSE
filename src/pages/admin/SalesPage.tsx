// src/pages/admin/SalesPage.tsx
import React, { type ReactElement, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, RefreshCw, Search, Mail, Phone, User2, } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import { fetchSales, createSale, deleteSale, type SaleUser, type SpringPage } from "@/services/admin/sale";

type ApiErrorData = { message?: string };
function getErrorMessage(err: unknown, fallback = "Đã xảy ra lỗi"): string {
  if (isAxiosError<ApiErrorData>(err)) return err.response?.data?.message ?? err.message ?? fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export default function SalesPage(): ReactElement {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<SpringPage<SaleUser> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ email: "", fullname: "", phone: "" });

  const list = page?.content ?? [];

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(t) ||
        (u.email || "").toLowerCase().includes(t) ||
        (u.phone || "").toLowerCase().includes(t)
    );
  }, [list, q]);

  const load = async (pi = pageIndex, ps = pageSize) => {
    setLoading(true);
    try {
      const data = await fetchSales({ page: pi, size: ps });
      setPage(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải danh sách"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, pageSize]);

  const onCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.fullname.trim()) {
      toast.error("Email và Họ tên là bắt buộc");
      return;
    }
    const loadingId = toast.loading("Đang tạo…");
    try {
      const res = await createSale(form);
      toast.success(`Tạo thành công!\nTài khoản: ${res.username}\nMật khẩu: ${res.password}`, { duration: 5000 });
      setOpenCreate(false);
      setForm({ email: "", fullname: "", phone: "" });
      await load(0, pageSize);
      setPageIndex(0);
    } catch (err) {
      toast.error(getErrorMessage(err, "Tạo thất bại"));
    } finally {
      toast.dismiss(loadingId);
    }
  };

  const onDelete = async (u: SaleUser) => {
    const name = u.fullName || u.email || `ID ${u.id}`;
    if (!confirm(`Xóa nhân viên sale "${name}"?`)) return;
    const loadingId = toast.loading("Đang xóa…");
    try {
      await deleteSale(u.id);
      toast.success("Đã xóa");
      await load(pageIndex, pageSize);
    } catch (err) {
      toast.error(getErrorMessage(err, "Xóa thất bại"));
    } finally {
      toast.dismiss(loadingId);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Sales</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50" title="Tải lại">
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-500">
            <Plus size={16} />
            <span>Tạo Sale</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-indigo-200 focus:ring-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Full Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Created At</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
          </thead>
          <tbody>
          {loading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                Loading…
              </td>
            </tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                Không có nhân viên sale
              </td>
            </tr>
          )}
          {!loading &&
            filtered.map((u, idx) => (
              <tr key={u.id} className="border-t last:border-b">
                <td className="px-4 py-3 text-slate-500">{(page?.number ?? 0) * (page?.size ?? 0) + idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User2 size={16} className="opacity-70" />
                    <span className="font-medium">{u.fullName || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="opacity-70" />
                    <span className="text-slate-700">{u.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="opacity-70" />
                    <span>{u.phone || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {u.createdAt ? dayjs(u.createdAt).format("DD/MM/YYYY HH:mm") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onDelete(u)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100" title="Xóa (soft-delete)">
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {page && typeof page.totalPages === "number" && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <div className="text-slate-600">
              Trang <b>{(page.number ?? 0) + 1}</b>/<b>{page.totalPages || 1}</b> • Tổng {page.totalElements ?? 0}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setPageSize(n);
                  setPageIndex(0);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/trang
                  </option>
                ))}
              </select>
              <button
                disabled={(page.number ?? 0) <= 0}
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={(page.number ?? 0) >= (page.totalPages ?? 1) - 1}
                onClick={() => setPageIndex((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal tạo sale */}
      {openCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Created account Sale</h3>
            <form onSubmit={onCreate} className="grid gap-3">
              <label className="grid gap-1">
                <span className="text-sm text-slate-600">Email</span>
                <input
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-slate-600">Full Name</span>
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
                  value={form.fullname}
                  onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
                  required
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm text-slate-600">Phone</span>
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-indigo-200 focus:ring-2"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </label>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
                  Create
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
