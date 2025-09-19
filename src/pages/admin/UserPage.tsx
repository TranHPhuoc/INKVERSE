import { useEffect, useState } from "react";
import {
  listUsers,
  softDeleteUser,
  hardDeleteUser,
  type Page,
  type ResUser,
} from "../../services/admin/users";

export default function UserPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<ResUser> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const pageData = await listUsers({ page, size: 10, sort: "id,desc" });
      setData(pageData);
    } catch {
      setErr("Không tải được danh sách user.");
      setData({ content: [], number: 0, size: 10, totalElements: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSoft = async (id: number) => {
    if (!confirm("Soft delete user này?")) return;
    await softDeleteUser(id);
    fetchData();
  };

  const onHard = async (id: number) => {
    if (!confirm("Hard delete user này?")) return;
    await hardDeleteUser(id);
    fetchData();
  };

  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Users</h2>

      {loading && <div>Đang tải…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {!loading && data && (
        <>
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-600">
                <tr>
                  {["ID", "Email", "Username", "Roles", "Enabled", "Hành động"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={6}>
                      Chưa có user nào.
                    </td>
                  </tr>
                ) : (
                  data.content.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50/60">
                      <td className="px-4 py-3">{u.id}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.username}</td>
                      <td className="px-4 py-3">{u.roles?.join(", ") ?? u.role ?? ""}</td>
                      <td className="px-4 py-3">{u.enabled ? "Yes" : "No"}</td>
                      <td className="space-x-2 px-4 py-3">
                        <button
                          className="rounded-md bg-amber-50 px-3 py-1 text-amber-700 hover:bg-amber-100"
                          onClick={() => onSoft(u.id)}
                        >
                          Soft
                        </button>
                        <button
                          className="rounded-md bg-rose-50 px-3 py-1 text-rose-700 hover:bg-rose-100"
                          onClick={() => onHard(u.id)}
                        >
                          Hard
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="rounded rounded-lg border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page <= 0}
            >
              Prev
            </button>
            <div className="text-sm">
              Page {Math.min(page + 1, Math.max(1, totalPages))} / {totalPages || 1}
            </div>
            <button
              className="rounded-lg border bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.min((totalPages || 1) - 1, page + 1))}
              disabled={page >= (totalPages || 1) - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
