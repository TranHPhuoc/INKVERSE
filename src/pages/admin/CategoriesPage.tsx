import React, { useEffect, useState } from "react";
import {
  listFlatCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type ResCategoryFlat,
  type CategoryCreate,
} from "../../services/admin/categories";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const [data, setData] = useState<ResCategoryFlat[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editParent, setEditParent] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listFlatCategories();
      rows.sort((a, b) => a.name.localeCompare(b.name));
      setData(rows);
    } catch (err) {
      console.error("Không tải được danh sách categories:", err);
      setError("Không tải được danh sách categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const onCreate = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }
    const payload: CategoryCreate = {
      name: name.trim(),
      parentId: parentId ? Number(parentId) : null,
    };
    try {
      setSubmitting(true);
      await createCategory(payload);
      setName("");
      setParentId("");
      await fetchData();
    } catch (err) {
      console.error("Tạo category thất bại:", err);
      setError("Tạo category thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const onStartEdit = (c: ResCategoryFlat) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditParent(c.parentId ?? "");
  };

  const onSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      setSaving(true);
      await updateCategory(editingId, {
        name: editName.trim(),
        parentId: editParent ? Number(editParent) : null,
      });
      setEditingId(null);
      setEditName("");
      setEditParent("");
      await fetchData();
    } catch (err) {
      console.error("Cập nhật category thất bại:", err);
      setError("Cập nhật category thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number, name: string) => {
    if (!window.confirm(`Xoá danh mục "${name}"?`)) return;
    try {
      setDeletingId(id);
      await deleteCategory(id);
      await fetchData();
    } catch (err) {
      console.error("Xoá category thất bại:", err);
      setError("Xoá category thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>

      {/* Form Create */}
      <motion.form
        onSubmit={onCreate}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end gap-3 rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur"
      >
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-sm text-gray-600">Name</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="min-w-[220px]">
          <label className="mb-1 block text-sm text-gray-600">Parent</label>
          <select
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={parentId}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">(none)</option>
            {data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-10 cursor-pointer rounded-lg bg-indigo-600 px-4 text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Đang tạo..." : "Tạo"}
        </button>
      </motion.form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Đang tải...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-600">
              <tr>
                {["ID", "Name", "Slug", "Parent", "Leaf", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50/60">
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <input
                        className="w-full rounded-md border px-2 py-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={saving}
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="px-4 py-3">{c.slug}</td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <select
                        className="w-full rounded-md border px-2 py-1"
                        value={editParent}
                        onChange={(e) =>
                          setEditParent(e.target.value ? Number(e.target.value) : "")
                        }
                        disabled={saving}
                      >
                        <option value="">(none)</option>
                        {data
                          .filter((x) => x.id !== c.id)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                      </select>
                    ) : c.parentId ? (
                      (data.find((x) => x.id === c.parentId)?.name ?? `#${c.parentId}`)
                    ) : (
                      "(root)"
                    )}
                  </td>
                  <td className="px-4 py-3">{c.leaf ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={onSaveEdit}
                          disabled={saving}
                          className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                            setEditParent("");
                          }}
                          className="cursor-pointer rounded-md border px-3 py-1 hover:bg-gray-50"
                          disabled={saving}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onStartEdit(c)}
                          className="cursor-pointer rounded-md border px-3 py-1 hover:bg-gray-50"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => onDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
                          className="cursor-pointer rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {deletingId === c.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!data.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                    Chưa có danh mục.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
