import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { createBook, type BookCreate } from "../../services/admin/books-admin";

type RestResponse<T> = { statusCode: number; error: string | null; message: string | null; data: T };
type ResOption = { id: number; name: string; slug?: string };
type CategoryTree = { id: number; name: string; slug: string; children: CategoryTree[] };
type Option = { id: number; name: string };

/* ================= Utils ================= */
function unwrap<T>(payload: unknown): T {
    if (payload && typeof payload === "object" && payload !== null && "data" in (payload as any)) {
        return (payload as RestResponse<T>).data;
    }
    return payload as T;
}
function toOptions(list: ResOption[]): Option[] {
    return (list || [])
        .map((x) => ({ id: Number(x.id), name: String(x.name) }))
        .filter((x) => Number.isFinite(x.id) && !!x.name);
}
function flattenLeafCategories(tree: CategoryTree[]): Option[] {
    const out: Option[] = [];
    const dfs = (n: CategoryTree) => {
        if (!n.children || n.children.length === 0) out.push({ id: n.id, name: n.name });
        else n.children.forEach(dfs);
    };
    (tree || []).forEach(dfs);
    return out.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}
function toInstant(dateStr: string): string | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ================= Constants (khớp enum BE) ================= */
const LANGUAGE_OPTIONS = [
    { value: "VI", label: "Tiếng Việt" },
    { value: "EN", label: "Tiếng Anh" },
    { value: "JP", label: "Tiếng Nhật" },
    { value: "KR", label: "Tiếng Hàn" },
    { value: "CN", label: "Tiếng Trung" },
    { value: "OTHER", label: "Khác" },
] as const;

const AGE_OPTIONS = [
    { value: "ALL", label: "Mọi lứa tuổi" },
    { value: "_6PLUS", label: "6+" },
    { value: "_12PLUS", label: "12+" },
    { value: "_16PLUS", label: "16+" },
    { value: "_18PLUS", label: "18+" },
] as const;

const COVER_OPTIONS = [
    { value: "PAPERBACK", label: "Bìa mềm" },
    { value: "HARDCOVER", label: "Bìa cứng" },
    { value: "OTHER", label: "Khác" },
] as const;

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-sm mb-1 text-gray-600">{label}</span>
            {children}
        </label>
    );
}

/**/
export default function AddBookModal({onClose, onCreated,}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [form, setForm] = useState({
        title: "",
        slug: "",
        sku: "",
        isbn13: "",
        description: "",

        publisherId: undefined as number | undefined,
        supplierId: undefined as number | undefined,
        authorIds: [] as number[],
        categoryIds: [] as number[],

        pageCount: 100,
        publicationYear: new Date().getFullYear(),
        language: "VI" as (typeof LANGUAGE_OPTIONS)[number]["value"],
        weightGram: 200,
        widthCm: 15,
        heightCm: 20,
        thicknessCm: 1.5,
        coverType: "PAPERBACK" as (typeof COVER_OPTIONS)[number]["value"],
        ageRating: "ALL" as (typeof AGE_OPTIONS)[number]["value"],

        status: "ACTIVE" as BookCreate["status"],
        price: 1,
        salePrice: undefined as number | undefined,
        saleStartAt: "" as string,
        saleEndAt: "" as string,

        images: [{ url: "", sortOrder: 0 }] as { url: string; sortOrder: number }[],
        initialStock: 0,
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [publishers, setPublishers] = useState<Option[]>([]);
    const [suppliers, setSuppliers] = useState<Option[]>([]);
    const [authors, setAuthors] = useState<Option[]>([]);
    const [categories, setCategories] = useState<Option[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
        setForm((s) => ({ ...s, [k]: v }));

    useEffect(() => {
        void loadOptions();
    }, []);

    const addWarning = (msg: string) =>
        setWarnings((w) => (w.includes(msg) ? w : [...w, msg]));

    async function loadOptions() {
        setWarnings([]);

        try {
            const res = await api.get("/api/v1/admin/publishers");
            setPublishers(toOptions(unwrap<ResOption[]>(res.data)));
        } catch {
            addWarning("Không tải được NXB (/api/v1/admin/publishers).");
        }

        try {
            const res = await api.get("/api/v1/admin/suppliers");
            setSuppliers(toOptions(unwrap<ResOption[]>(res.data)));
        } catch {
            addWarning("Không tải được NCC (/api/v1/admin/suppliers).");
        }

        try {
            const res = await api.get("/api/v1/admin/authors");
            setAuthors(toOptions(unwrap<ResOption[]>(res.data)));
        } catch {
            addWarning("Không tải được Tác giả (/api/v1/admin/authors).");
        }

        try {
            const res = await api.get("/api/v1/admin/categories");
            const tree = unwrap<CategoryTree[]>(res.data);
            setCategories(flattenLeafCategories(tree));
        } catch {
            addWarning("Không tải được Danh mục (/api/v1/admin/categories).");
        }
    }

    function toggleId(list: number[], id: number) {
        return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    }

    function addImage() {
        set("images", [...form.images, { url: "", sortOrder: form.images.length }]);
    }
    function removeImage(idx: number) {
        set(
            "images",
            form.images.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }))
        );
    }

    const canSubmit = useMemo(() => {
        const hasAtLeastOneImage = form.images.some((it) => it.url.trim().length > 0);
        return (
            !!form.title.trim() &&
            !!form.publisherId &&
            !!form.supplierId &&
            form.authorIds.length > 0 &&
            form.categoryIds.length > 0 &&
            Number(form.pageCount) > 0 &&
            Number(form.price) > 0 &&
            !!form.language &&
            !!form.coverType &&
            !!form.ageRating &&
            hasAtLeastOneImage
        );
    }, [form]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!canSubmit) {
            setError("Điền đủ trường bắt buộc + ít nhất 1 ảnh.");
            return;
        }

        try {
            setSubmitting(true);
            const payload: BookCreate = {
                title: form.title.trim(),
                slug: form.slug?.trim() || "",
                sku: form.sku?.trim() || null,
                isbn13: form.isbn13?.trim() || null,
                description: form.description || null,

                publisherId: form.publisherId!,
                supplierId: form.supplierId!,
                authorIds: form.authorIds,
                categoryIds: form.categoryIds,

                pageCount: Number(form.pageCount),
                publicationYear: Number(form.publicationYear),
                language: form.language,
                weightGram: Number(form.weightGram),
                widthCm: Number(form.widthCm),
                heightCm: Number(form.heightCm),
                thicknessCm: Number(form.thicknessCm),
                coverType: form.coverType,
                ageRating: form.ageRating,

                status: form.status,
                price: Number(form.price),
                salePrice:
                    form.salePrice != null && form.salePrice !== ("" as unknown as number)
                        ? Number(form.salePrice)
                        : null,
                saleStartAt: toInstant(form.saleStartAt),
                saleEndAt: toInstant(form.saleEndAt),

                images: form.images
                    .filter((it) => it.url.trim().length > 0)
                    .map((it, i) => ({ url: it.url.trim(), sortOrder: Number(it.sortOrder ?? i) })),
                initialStock: Number(form.initialStock),
            };

            await createBook(payload);
            onCreated();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Tạo sách thất bại");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Thêm sách</h3>
                    <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
                </div>

                {warnings.length > 0 && (
                    <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        {warnings.map((w) => <div key={w}>• {w}</div>)}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Left */}
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <FieldGroup label="Tiêu đề">
                            <input
                                value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Slug">
                                <input
                                    value={form.slug}
                                    onChange={(e) => set("slug", e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="SKU">
                                <input
                                    value={form.sku}
                                    onChange={(e) => set("sku", e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Mô tả">
              <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
              />
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Nhà xuất bản">
                                <select
                                    value={form.publisherId ?? ""}
                                    onChange={(e) => set("publisherId", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>-- Chọn --</option>
                                    {publishers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Nhà cung cấp">
                                <select
                                    value={form.supplierId ?? ""}
                                    onChange={(e) => set("supplierId", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>-- Chọn --</option>
                                    {suppliers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Tác giả">
                            <div className="border rounded-lg p-2 max-h-32 overflow-auto">
                                {authors.map((a) => (
                                    <label key={a.id} className="flex items-center gap-2 text-sm py-1">
                                        <input
                                            type="checkbox"
                                            checked={form.authorIds.includes(a.id)}
                                            onChange={() => set("authorIds", toggleId(form.authorIds, a.id))}
                                        />
                                        <span>{a.name}</span>
                                    </label>
                                ))}
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Danh mục (chỉ lá)">
                            <div className="border rounded-lg p-2 max-h-32 overflow-auto">
                                {categories.map((c) => (
                                    <label key={c.id} className="flex items-center gap-2 text-sm py-1">
                                        <input
                                            type="checkbox"
                                            checked={form.categoryIds.includes(c.id)}
                                            onChange={() => set("categoryIds", toggleId(form.categoryIds, c.id))}
                                        />
                                        <span>{c.name}</span>
                                    </label>
                                ))}
                            </div>
                        </FieldGroup>
                    </div>

                    {/* Right */}
                    <div className="col-span-2 md:col-span-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Ngôn ngữ">
                                <select
                                    value={form.language}
                                    onChange={(e) => set("language", e.target.value as any)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {LANGUAGE_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Năm XB">
                                <input
                                    type="number"
                                    value={form.publicationYear}
                                    onChange={(e) => set("publicationYear", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <FieldGroup label="Số trang">
                                <input
                                    type="number"
                                    min={1}
                                    value={form.pageCount}
                                    onChange={(e) => set("pageCount", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Nặng (gram)">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.weightGram}
                                    onChange={(e) => set("weightGram", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Loại bìa">
                                <select
                                    value={form.coverType}
                                    onChange={(e) => set("coverType", e.target.value as any)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {COVER_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </FieldGroup>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <FieldGroup label="Rộng (cm)">
                                <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={form.widthCm}
                                    onChange={(e) => set("widthCm", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Cao (cm)">
                                <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={form.heightCm}
                                    onChange={(e) => set("heightCm", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Dày (cm)">
                                <input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    value={form.thicknessCm}
                                    onChange={(e) => set("thicknessCm", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Độ tuổi">
                                <select
                                    value={form.ageRating}
                                    onChange={(e) => set("ageRating", e.target.value as any)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {AGE_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Trạng thái">
                                <select
                                    value={form.status}
                                    onChange={(e) => set("status", e.target.value as BookCreate["status"])}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                    <option value="DRAFT">DRAFT</option>
                                    <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                                </select>
                            </FieldGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Giá (₫)">
                                <input
                                    type="number"
                                    min={1}
                                    value={form.price}
                                    onChange={(e) => set("price", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Tồn kho ban đầu">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.initialStock}
                                    onChange={(e) => set("initialStock", Number(e.target.value))}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <FieldGroup label="Giá sale (₫)">
                                <input
                                    type="number"
                                    min={0}
                                    value={form.salePrice ?? 0}
                                    onChange={(e) => set("salePrice", Number(e.target.value) || undefined)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Sale từ">
                                <input
                                    type="datetime-local"
                                    value={form.saleStartAt}
                                    onChange={(e) => set("saleStartAt", e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                            <FieldGroup label="Sale đến">
                                <input
                                    type="datetime-local"
                                    value={form.saleEndAt}
                                    onChange={(e) => set("saleEndAt", e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Ảnh (ít nhất 1)">
                            <div className="space-y-2">
                                {form.images.map((img, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                        <input
                                            placeholder="URL ảnh"
                                            value={img.url}
                                            onChange={(e) => {
                                                const next = [...form.images];
                                                next[idx] = { ...img, url: e.target.value };
                                                set("images", next);
                                            }}
                                            className="col-span-9 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={img.sortOrder}
                                            onChange={(e) => {
                                                const next = [...form.images];
                                                next[idx] = { ...img, sortOrder: Number(e.target.value) };
                                                set("images", next);
                                            }}
                                            className="col-span-2 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="col-span-1 h-10 rounded-lg border hover:bg-gray-50"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addImage}
                                    className="h-10 px-3 rounded-lg border hover:bg-gray-50"
                                >
                                    + Thêm ảnh
                                </button>
                            </div>
                        </FieldGroup>
                    </div>

                    {error && <div className="col-span-2 text-sm text-rose-600">{error}</div>}

                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                        <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg border hover:bg-gray-50">
                            Hủy
                        </button>
                        <button
                            disabled={submitting || !canSubmit}
                            type="submit"
                            className="h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {submitting ? "Đang tạo..." : "Tạo sách"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
