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
          {/* Carded list */}
          <div className="rounded-2xl bg-white/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)]">
            <div className="grid grid-cols-[80px_1fr_1fr_200px_100px_220px] gap-3 px-4 pb-2 pt-3 text-xs text-gray-500">
              <div>ID</div>
              <div>Email</div>
              <div>Username</div>
              <div>Roles</div>
              <div>Enabled</div>
              <div className="text-right">Hành động</div>
            </div>

            <ul className="divide-y divide-gray-100">
              {data.content.length === 0 ? (
                <li className="px-4 py-6 text-center text-gray-500">Chưa có user nào.</li>
              ) : (
                data.content.map((u) => (
                  <li key={u.id} className="px-4 py-3 hover:bg-gray-50/70">
                    <div className="grid grid-cols-[80px_1fr_1fr_200px_100px_220px] items-center gap-3">
                      <div>{u.id}</div>
                      <div className="truncate">{u.email}</div>
                      <div className="truncate">{u.username}</div>
                      <div className="truncate">{u.roles?.join(", ") ?? u.role ?? ""}</div>
                      <div>{u.enabled ? "Yes" : "No"}</div>
                      <div className="text-right">
                        <button
                          className="cursor-pointer rounded-md bg-amber-600/10 px-3 py-1 text-amber-700 transition hover:bg-amber-600/20"
                          onClick={() => onSoft(u.id)}
                        >
                          Soft
                        </button>
                        <button
                          className="ml-2 cursor-pointer rounded-md bg-rose-600/10 px-3 py-1 text-rose-700 transition hover:bg-rose-600/20"
                          onClick={() => onHard(u.id)}
                        >
                          Hard
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="cursor-pointer rounded-xl bg-gray-100 px-3 py-1 transition hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page <= 0}
            >
              Prev
            </button>
            <div className="text-sm">
              Page {Math.min(page + 1, Math.max(1, totalPages))} / {totalPages || 1}
            </div>
            <button
              className="cursor-pointer rounded-xl bg-gray-100 px-3 py-1 transition hover:bg-gray-200 disabled:opacity-50"
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
