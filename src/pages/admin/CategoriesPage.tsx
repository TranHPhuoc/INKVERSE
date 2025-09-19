import { useEffect, useState } from "react";
import {
  listFlatCategories,
  createCategory,
  type ResCategoryFlat,
  type ReqCategoryCreate,
} from "../../services/admin/categories";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const [data, setData] = useState<ResCategoryFlat[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFlatCategories();
      setData(res);
    } catch (e: any) {
      setError("Không tải được danh sách categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Vui lòng nhập tên");

    const payload: ReqCategoryCreate = {
      name: name.trim(),
      parentId: parentId ? Number(parentId) : null,
    };

    try {
      await createCategory(payload);
      setName("");
      setParentId("");
      fetchData();
    } catch (e: any) {
      setError("Tạo category thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Categories</h2>

      <motion.form
        onSubmit={onCreate}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-3 rounded-xl border bg-white/80 p-4 shadow-sm backdrop-blur"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-gray-600">Name</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="w-64">
          <label className="mb-1 block text-sm text-gray-600">Parent</label>
          <select
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            value={parentId}
            onChange={(e) => setParentId(e.target.value as any)}
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
          className="h-10 rounded-lg bg-indigo-600 px-4 text-white transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          Create
        </button>
      </motion.form>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
