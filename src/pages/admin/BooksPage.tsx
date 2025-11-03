// src/pages/Admin/BooksPage.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { deleteBook } from "../../services/admin/books-admin";
import AddBookModal from "../../components/Admin/AddBookModal";
import EditBookModal from "../../components/Admin/EditBookModal";
import { resolveThumb, PLACEHOLDER } from "../../types/img";

/* =================== Types =================== */
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

/* =================== Layout constants =================== */
const GRID_COLS =
  "grid grid-cols-[56px_minmax(0,1fr)_210px_90px_140px_140px] items-center gap-3";
const THUMB_W = 88;

/* =================== Page =================== */
export default function BooksPage() {
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

  // upload (per-row)
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  /* ---------- fetch list ---------- */
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
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const idStr = sp.get("edit");
    if (idStr && /^\d+$/.test(idStr)) setEditingId(Number(idStr));
  }, []);

  /* ---------- helpers ---------- */
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

  function PriceCell({ b }: { b: BookListItem }) {
    const price = Number(b.price ?? 0);
    const effective = Number(b.effectivePrice ?? (b.salePrice ?? price));
    const hasSale = b.salePrice != null && Number(b.salePrice) < price;
    const salePct =
      hasSale && price > 0 ? Math.round(((price - Number(b.salePrice)) / price) * 100) : 0;

    return (
      <div className="w-full text-right text-sm">
        <div className={hasSale ? "font-semibold text-rose-600" : "font-medium"}>
          {effective.toLocaleString()}₫
        </div>
        <div className="flex items-center justify-end gap-2">
          {hasSale && (
            <>
              <span className="text-[11px] text-gray-500 line-through">
                {price.toLocaleString()}₫
              </span>
              <span className="rounded-full bg-rose-50 px-1.5 py-[1px] text-[10px] font-medium text-rose-600">
                −{salePct}%
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  /* =================== render =================== */
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Books</h2>

      {/* Filters */}
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
          {/* Header */}
          <div className="rounded-2xl bg-white/90 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)]">
            <div className={`${GRID_COLS} px-4 pb-2 pt-3 text-[11px] font-medium tracking-wide text-gray-500`}>
              <div className="tabular-nums pl-[2px]">ID</div>

              {/* Sách */}
              <div className="pl-2">
                <div className="flex items-center gap-3">
                  <div style={{ width: THUMB_W }} className="shrink-0" />
                  <span>Sách</span>
                </div>
              </div>

              <div className="text-right">Giá</div>
              <div className="text-center">Đã bán</div>
              <div>Trạng thái</div>
              <div className="text-right">Hành động</div>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-gray-100">
              {data.content.map((b) => (
                <li key={b.id} className={`${GRID_COLS} px-4 py-3 transition hover:bg-gray-50/70`}>
                  {/* ID */}
                  <div className="tabular-nums pl-[2px] text-sm text-gray-700">{b.id}</div>

                  {/* Sách */}
                  <div className="flex min-w-0 items-center gap-3 pl-2">
                    {/* thumb + upload */}
                    <div style={{ width: THUMB_W }} className="shrink-0">
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
                        className={`mt-2 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                          uploading === b.id
                            ? "bg-gray-200 text-gray-600"
                            : "cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {uploading === b.id ? "Đang tải..." : "Tải ảnh"}
                      </button>
                    </div>

                    {/* title + slug */}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{b.title}</div>
                      <div className="truncate text-xs text-gray-500">{b.slug}</div>
                    </div>
                  </div>

                  {/* Giá */}
                  <div className="w-full">
                    <PriceCell b={b} />
                  </div>

                  {/* Đã bán */}
                  <div className="text-center text-sm">{b.sold ?? 0}</div>

                  {/* Trạng thái */}
                  <div className="text-sm">{badge(b.status)}</div>

                  {/* Actions */}
                  <div className="text-right">
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
