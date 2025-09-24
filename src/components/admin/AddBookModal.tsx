import type React from "react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { createBook, type BookCreate } from "../../services/admin/books-admin";

type RestResponse<T> = {
  statusCode: number;
  error: string | null;
  message: string | null;
  data: T;
};
type ResOption = { id: number; name: string; slug?: string };
type CategoryTree = { id: number; name: string; slug: string; children: CategoryTree[] };
type Option = { id: number; name: string };

/* ================= Utils ================= */
function unwrap<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    payload !== null &&
    "data" in (payload as Record<string, unknown>)
  ) {
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

const LANGUAGE_OPTIONS = [
  { value: "VI", label: "Tiếng Việt" },
  { value: "EN", label: "Tiếng Anh" },
  { value: "JP", label: "Tiếng Nhật" },
  { value: "KR", label: "Tiếng Hàn" },
  { value: "CN", label: "Tiếng Trung" },
  { value: "OTHER", label: "Khác" },
] as const;
type Language = (typeof LANGUAGE_OPTIONS)[number]["value"];

const AGE_OPTIONS = [
  { value: "ALL", label: "Mọi lứa tuổi" },
  { value: "_6PLUS", label: "6+" },
  { value: "_12PLUS", label: "12+" },
  { value: "_16PLUS", label: "16+" },
  { value: "_18PLUS", label: "18+" },
] as const;
type AgeRating = (typeof AGE_OPTIONS)[number]["value"];

const COVER_OPTIONS = [
  { value: "PAPERBACK", label: "Bìa mềm" },
  { value: "HARDCOVER", label: "Bìa cứng" },
  { value: "OTHER", label: "Khác" },
] as const;
type CoverType = (typeof COVER_OPTIONS)[number]["value"];

type FormImage = { url: string; sortOrder: number };

type FormState = {
  title: string;
  slug: string;
  sku: string;
  isbn13: string;
  description: string;

  publisherId: number | undefined;
  supplierId: number | undefined;
  authorIds: number[];
  categoryIds: number[];

  pageCount: number;
  publicationYear: number;
  language: Language;
  weightGram: number;
  widthCm: number;
  heightCm: number;
  thicknessCm: number;
  coverType: CoverType;
  ageRating: AgeRating;

  status: BookCreate["status"];
  price: number;
  salePrice: number | undefined;
  saleStartAt: string;
  saleEndAt: string;

  images: FormImage[];
  initialStock: number;
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-600">{label}</span>
      {children}
    </label>
  );
}

/**/
export default function AddBookModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    sku: "",
    isbn13: "",
    description: "",

    publisherId: undefined,
    supplierId: undefined,
    authorIds: [],
    categoryIds: [],

    pageCount: 100,
    publicationYear: new Date().getFullYear(),
    language: "VI",
    weightGram: 200,
    widthCm: 15,
    heightCm: 20,
    thicknessCm: 1.5,
    coverType: "PAPERBACK",
    ageRating: "ALL",

    status: "ACTIVE",
    price: 1,
    salePrice: undefined,
    saleStartAt: "",
    saleEndAt: "",

    images: [{ url: "", sortOrder: 0 }],
    initialStock: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [publishers, setPublishers] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [authors, setAuthors] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWarning = (msg: string) => setWarnings((w) => (w.includes(msg) ? w : [...w, msg]));

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
      form.images.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i })),
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

  function isRecord(val: unknown): val is Record<string, unknown> {
    return !!val && typeof val === "object";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          form.salePrice !== undefined &&
          form.salePrice !== null &&
          String(form.salePrice).trim() !== ""
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
    } catch (err: unknown) {
      // cố gắng đọc message nếu có dạng axios error
      let msg = "Tạo sách thất bại";
      if (
        isRecord(err) &&
        isRecord(err.response) &&
        isRecord(err.response.data) &&
        "message" in err.response.data
      ) {
        const maybe = err.response.data.message;
        if (typeof maybe === "string" && maybe.trim()) msg = maybe;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40">
      <div className="w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Thêm sách</h3>
          <button onClick={onClose} className="rounded px-2 py-1 hover:bg-gray-100">
            ✕
          </button>
        </div>

        {warnings.length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            {warnings.map((w) => (
              <div key={w}>• {w}</div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid max-h-[70vh] grid-cols-2 gap-4 overflow-y-auto pr-2"
        >
          {/* Left */}
          <div className="col-span-2 space-y-3 md:col-span-1">
            <FieldGroup label="Tiêu đề">
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Slug">
                <input
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="SKU">
                <input
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Mô tả">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="h-24 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Nhà xuất bản">
                <select
                  value={form.publisherId ?? ""}
                  onChange={(e) => set("publisherId", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    -- Chọn --
                  </option>
                  {publishers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Nhà cung cấp">
                <select
                  value={form.supplierId ?? ""}
                  onChange={(e) => set("supplierId", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    -- Chọn --
                  </option>
                  {suppliers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </FieldGroup>
            </div>

            <FieldGroup label="Tác giả">
              <div className="max-h-32 overflow-auto rounded-lg border p-2">
                {authors.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 py-1 text-sm">
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
              <div className="max-h-32 overflow-auto rounded-lg border p-2">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-1 text-sm">
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
          <div className="col-span-2 space-y-3 md:col-span-1">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Ngôn ngữ">
                <select
                  value={form.language}
                  onChange={(e) => set("language", e.target.value as Language)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Năm XB">
                <input
                  type="number"
                  value={form.publicationYear}
                  onChange={(e) => set("publicationYear", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Nặng (gram)">
                <input
                  type="number"
                  min={0}
                  value={form.weightGram}
                  onChange={(e) => set("weightGram", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Loại bìa">
                <select
                  value={form.coverType}
                  onChange={(e) => set("coverType", e.target.value as CoverType)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {COVER_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
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
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Cao (cm)">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.heightCm}
                  onChange={(e) => set("heightCm", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Dày (cm)">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.thicknessCm}
                  onChange={(e) => set("thicknessCm", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Độ tuổi">
                <select
                  value={form.ageRating}
                  onChange={(e) => set("ageRating", e.target.value as AgeRating)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AGE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Trạng thái">
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as BookCreate["status"])}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Tồn kho ban đầu">
                <input
                  type="number"
                  min={0}
                  value={form.initialStock}
                  onChange={(e) => set("initialStock", Number(e.target.value))}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Giá sale (₫)">
                <input
                  type="number"
                  min={0}
                  value={form.salePrice ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    set("salePrice", Number.isFinite(val) && val > 0 ? val : undefined);
                  }}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Sale từ">
                <input
                  type="datetime-local"
                  value={form.saleStartAt}
                  onChange={(e) => set("saleStartAt", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Sale đến">
                <input
                  type="datetime-local"
                  value={form.saleEndAt}
                  onChange={(e) => set("saleEndAt", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Ảnh (ít nhất 1)">
              <div className="space-y-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2">
                    <input
                      placeholder="URL ảnh"
                      value={img.url}
                      onChange={(e) => {
                        const next = [...form.images];
                        next[idx] = { ...img, url: e.target.value };
                        set("images", next);
                      }}
                      className="col-span-9 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="col-span-2 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="h-10 rounded-lg border px-3 hover:bg-gray-50"
                >
                  + Thêm ảnh
                </button>
              </div>
            </FieldGroup>
          </div>

          {error && <div className="col-span-2 text-sm text-rose-600">{error}</div>}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border px-4 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              disabled={submitting || !canSubmit}
              type="submit"
              className="h-10 rounded-lg bg-indigo-600 px-4 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Đang tạo..." : "Tạo sách"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
