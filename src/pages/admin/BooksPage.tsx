// src/pages/admin/BooksPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { deleteBook } from "../../services/admin/books-admin";
import AddBookModal from "../../components/admin/AddBookModal";
import EditBookModal from "../../components/admin/EditBookModal";
import { resolveThumb, PLACEHOLDER } from "../../types/img";

/* ===== Types ===== */
type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type BookListItem = {
  id: number;
  title: string;
  slug: string;
  thumbnail?: string | null;
  price: number;
  effectivePrice?: number | null;
  salePrice?: number | null;
  sold?: number | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
};

const STATUS_OPTIONS: readonly BookListItem["status"][] = [
  "ACTIVE",
  "INACTIVE",
  "DRAFT",
  "OUT_OF_STOCK",
] as const;
const isStatus = (v: string): v is BookListItem["status"] =>
  (STATUS_OPTIONS as readonly string[]).includes(v);

/* ===== Page ===== */
export default function BooksPage() {
  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | BookListItem["status"]>("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  // data
  const [data, setData] = useState<SpringPage<BookListItem> | null>(null);
  const [loading, setLoading] = useState(false);

  // modals
  const [openCreate, setOpenCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // upload
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  /* ---------- data fetch ---------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const hasQ = q.trim().length > 0;
      const url = hasQ ? "/api/v1/books/search" : "/api/v1/books";
      const params: Record<string, string | number | undefined> = {
        page,
        size,
        sort: "createdAt",
        direction: "DESC",
        status: status || undefined,
        q: hasQ ? q.trim() : undefined,
      };
      const res = await api.get(url, { params });
      const payload = (res?.data?.data ?? res?.data) as SpringPage<BookListItem>;
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, [page, size, q, status]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  /* ---------- delete ---------- */
  const onDelete = async (id: number) => {
    if (!confirm("Xóa sách này?")) return;
    await deleteBook(id);
    void fetchData();
  };

  /* ---------- upload images ---------- */
  async function handleUploadImages(bookId: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(bookId);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("file", f));
      await api.post(`/api/uploads/${bookId}/images`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchData();
    } catch (e) {
      console.error(e);
      alert("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(null);
      const input = fileInputs.current[bookId];
      if (input) input.value = "";
    }
  }

  /* ---------- edit modal + URL sync ---------- */
  const openEdit = (id: number) => {
    setEditingId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("edit", String(id));
    window.history.replaceState({}, "", url);
  };
  const closeEdit = () => {
    setEditingId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url);
  };

  // auto open when landing with ?edit=ID
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const idStr = sp.get("edit");
    if (idStr && /^\d+$/.test(idStr)) {
      setEditingId(Number(idStr));
    }
  }, []);

  /* ---------- ui helpers ---------- */
  const badge = (s: BookListItem["status"]) => {
    const map: Record<BookListItem["status"], string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      INACTIVE: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      DRAFT: "bg-gray-50 text-gray-700 ring-1 ring-gray-200",
      OUT_OF_STOCK: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s]}`}>
        {s}
      </span>
    );
  };

  /* ---------- render ---------- */
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Books</h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/80 p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)] backdrop-blur"
      >
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-gray-600">Tìm kiếm</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tiêu đề, ISBN, slug..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(isStatus(e.target.value) ? e.target.value : "")}
              className="cursor-pointer rounded-xl px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setPage(0);
              void fetchData();
            }}
            className="h-10 cursor-pointer rounded-xl bg-indigo-600 px-4 text-white transition hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="h-10 cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 font-medium text-white shadow-md transition hover:-translate-y-0.5 active:translate-y-0"
          >
            + Thêm sách
          </button>
        </div>
      </motion.div>

      {loading && <div>Đang tải…</div>}

      {!loading && data && (
        <>
          {/* Carded table (no borders) */}
          <div className="rounded-2xl bg-white/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)]">
            <div className="flex items-center justify-between px-4 pb-2 pt-3 text-xs text-gray-500">
              <div>ID</div>
              <div className="flex-1 pl-4">Sách</div>
              <div className="w-40">Giá</div>
              <div className="w-20 text-center">Đã bán</div>
              <div className="w-36">Trạng thái</div>
              <div className="w-40 text-right">Hành động</div>
            </div>

            <ul className="divide-y divide-gray-100">
              {data.content.map((b) => (
                <li key={b.id} className="group px-4 py-3 transition hover:bg-gray-50/70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-sm text-gray-700">{b.id}</div>

                    {/* thumb + upload */}
                    <div className="flex w-[88px] flex-col items-center">
                      {b.thumbnail ? (
                        <img
                          src={resolveThumb(b.thumbnail)}
                          alt={b.title}
                          className="h-12 w-12 rounded-lg object-cover shadow-inner"
                          onError={(e) => {
                            if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                          }}
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-200 text-[10px] text-gray-500">
                          No img
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={(el) => {
                          fileInputs.current[b.id] = el;
                        }}
                        onChange={(e) => handleUploadImages(b.id, e.currentTarget.files)}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputs.current[b.id]?.click()}
                        disabled={uploading === b.id}
                        className={`mt-2 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          uploading === b.id
                            ? "bg-gray-200 text-gray-600"
                            : "cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {uploading === b.id ? "Đang tải..." : "Tải ảnh"}
                      </button>
                    </div>


                    <div className="flex min-w-0 flex-1 items-center gap-3 pl-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.title}</div>
                        <div className="truncate text-xs text-gray-500">{b.slug}</div>
                      </div>
                    </div>

                    <div className="w-40 text-sm">
                      <div className="font-medium">
                        {(b.effectivePrice ?? b.price).toLocaleString()}₫
                      </div>
                      {b.salePrice != null && (
                        <div className="text-xs text-rose-600">
                          Sale: {b.salePrice.toLocaleString()}₫
                        </div>
                      )}
                    </div>

                    <div className="w-20 text-center text-sm">{b.sold ?? 0}</div>

                    <div className="w-36">{badge(b.status)}</div>

                    <div className="w-40 text-right">
                      <button
                        type="button"
                        className="cursor-pointer rounded-md bg-indigo-600/10 px-3 py-1 text-indigo-700 transition hover:bg-indigo-600/20"
                        onClick={() => openEdit(b.id)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="ml-2 cursor-pointer rounded-md bg-rose-600/10 px-3 py-1 text-rose-700 transition hover:bg-rose-600/20"
                        onClick={() => onDelete(b.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-gray-100 px-3 py-1 transition hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page <= 0}
            >
              Prev
            </button>
            <div className="text-sm">
              Page {data.number + 1} / {data.totalPages || 1}
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-xl bg-gray-100 px-3 py-1 transition hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.min((data.totalPages || 1) - 1, page + 1))}
              disabled={page >= (data.totalPages || 1) - 1}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal tạo */}
      {openCreate && (
        <AddBookModal
          onClose={() => setOpenCreate(false)}
          onCreated={() => {
            setOpenCreate(false);
            void fetchData();
          }}
        />
      )}

      {/* Modal sửa */}
      {editingId !== null && (
        <EditBookModal
          bookId={editingId}
          onClose={closeEdit}
          onUpdated={() => {
            closeEdit();
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
