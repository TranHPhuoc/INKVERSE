// src/pages/admin/BooksPage.tsx
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { deleteBook } from "../../services/admin/books-admin";
import AddBookModal from "../../components/admin/AddBookModal";
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

export default function BooksPage() {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState<"" | BookListItem["status"]>("");
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [data, setData] = useState<SpringPage<BookListItem> | null>(null);
    const [loading, setLoading] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    // upload state
    const [uploading, setUploading] = useState<number | null>(null);
    const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

    async function fetchData() {
        setLoading(true);
        try {
            const hasQ = q.trim().length > 0;
            const url = hasQ ? "/api/v1/books/search" : "/api/v1/books";
            const params: Record<string, string | number> = {
                page,
                size,
                sort: "createdAt",
                direction: "DESC",
            };
            if (status) params.status = status;
            if (hasQ) params.q = q.trim();

            const res = await api.get(url, { params });
            const payload = (res?.data?.data ?? res?.data) as SpringPage<BookListItem>;
            setData(payload);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, status]);

    const onDelete = async (id: number) => {
        if (!confirm("Xóa sách này?")) return;
        await deleteBook(id);
        void fetchData();
    };

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

    const badge = (s: BookListItem["status"]) => {
        const map: Record<BookListItem["status"], string> = {
            ACTIVE: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
            INACTIVE: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
            DRAFT: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
            OUT_OF_STOCK: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
        };
        return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s]}`}>{s}</span>;
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Books</h2>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur border rounded-xl p-4 shadow-sm"
            >
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-sm mb-1 text-gray-600">Tìm kiếm</label>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Tiêu đề, ISBN, slug..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Trạng thái</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                        >
                            <option value="">Tất cả</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            setPage(0);
                            void fetchData();
                        }}
                        className="h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                    >
                        Tìm
                    </button>
                    <button
                        onClick={() => setOpenCreate(true)}
                        className="h-10 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-medium cursor-pointer"
                    >
                        + Thêm sách
                    </button>
                </div>
            </motion.div>

            {loading && <div>Đang tải…</div>}

            {!loading && data && (
                <>
                    <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50/80 text-gray-600">
                            <tr>
                                {["ID", "Ảnh", "Tiêu đề", "Giá", "Đã bán", "Trạng thái", "Hành động"].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 font-medium">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {data.content.map((b) => (
                                <tr key={b.id} className="border-t hover:bg-gray-50/60">
                                    <td className="px-4 py-3">{b.id}</td>

                                    {/* Ảnh + nút Tải ảnh */}
                                    <td className="px-4 py-3">
                                        {b.thumbnail ? (
                                            <img
                                                src={resolveThumb(b.thumbnail)}
                                                alt={b.title}
                                                className="h-12 w-12 object-cover rounded-md ring-1 ring-gray-200"
                                                onError={(e) => {
                                                    const el = e.currentTarget as HTMLImageElement;
                                                    if (el.src !== PLACEHOLDER) el.src = PLACEHOLDER;
                                                }}
                                            />
                                        ) : (
                                            <div className="h-12 w-12 bg-gray-200 rounded-md grid place-items-center text-[10px] text-gray-500">
                                                No img
                                            </div>
                                        )}

                                        <div className="mt-2">
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
                                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition 
                            ${
                                                    uploading === b.id
                                                        ? "bg-gray-200 text-gray-600"
                                                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                }`}
                                            >
                                                {uploading === b.id ? "Đang tải..." : "Tải ảnh"}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="font-medium">{b.title}</div>
                                        <div className="text-xs text-gray-500">{b.slug}</div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {(b.effectivePrice ?? b.price).toLocaleString()}₫
                                        </div>
                                        {b.salePrice != null && (
                                            <div className="text-xs text-rose-600">
                                                Sale: {b.salePrice.toLocaleString()}₫
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">{b.sold ?? 0}</td>
                                    <td className="px-4 py-3">{badge(b.status)}</td>

                                    <td className="px-4 py-3 space-x-2">
                                        <a
                                            className="px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                            href={`/admin/books?edit=${b.id}`}
                                        >
                                            Sửa
                                        </a>
                                        <button
                                            className="px-3 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"
                                            onClick={() => onDelete(b.id)}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center gap-2 justify-end mt-4">
                        <button
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page <= 0}
                        >
                            Prev
                        </button>
                        <div className="text-sm">
                            Page {data.number + 1} / {data.totalPages || 1}
                        </div>
                        <button
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                            onClick={() =>
                                setPage(Math.min((data.totalPages || 1) - 1, page + 1))
                            }
                            disabled={page >= (data.totalPages || 1) - 1}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {openCreate && (
                <AddBookModal
                    onClose={() => setOpenCreate(false)}
                    onCreated={() => {
                        setOpenCreate(false);
                        void fetchData();
                    }}
                />
            )}
        </div>
    );
}
