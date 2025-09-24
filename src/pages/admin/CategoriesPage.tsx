// src/pages/admin/CategoriesPage.tsx
import React, { useEffect, useState } from "react";
import {
  listFlatCategories,
  createCategory,
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
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listFlatCategories();
      // Có thể sort nhẹ theo tên để dễ nhìn
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
      // slug có thể để BE tự sinh, nếu muốn có thể thêm:
      // slug: toSlug(name.trim())
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>

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
          className="h-10 rounded-lg bg-indigo-600 px-4 text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </motion.form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="p-4 text-sm text-gray-600">Đang tải...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-600">
              <tr>
                {["ID", "Name", "Slug", "Parent", "Leaf"].map((h) => (
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
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.slug}</td>
                  <td className="px-4 py-3">
                    {c.parentId
                      ? (data.find((x) => x.id === c.parentId)?.name ?? `#${c.parentId}`)
                      : "(root)"}
                  </td>
                  <td className="px-4 py-3">{c.leaf ? "Yes" : "No"}</td>
                </tr>
              ))}
              {!data.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
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
