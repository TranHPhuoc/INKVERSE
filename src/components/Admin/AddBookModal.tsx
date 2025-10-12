import type React from "react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { createBook, type BookCreate } from "../../services/admin/books-admin";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

/* ---------------- Types from API wrappers ---------------- */
type RestResponse<T> = {
  statusCode: number;
  error: string | null;
  message: string | null;
  data: T;
};
type ResOption = { id: number; name: string; slug?: string };
type Option = { id: number; name: string };

/* ---------------- Utils ---------------- */
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
function toInstant(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
function isRecord(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === "object";
}
// Axios-like error safe picker
type AxiosLikeError = { response?: { data?: { message?: unknown } } };
function pickAxiosMessage(err: unknown): string | null {
  if (!isRecord(err)) return null;
  const maybe = err as AxiosLikeError;
  const msg = maybe.response?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg : null;
}

/* ---------------- Validation helpers ---------------- */
function slugify(input: string): string {
  const noAccent = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const s = noAccent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return s || "n-a";
}
function isDigits13(s: string): boolean {
  return /^\d{13}$/.test(s);
}
function isValidIsbn13(s: string): boolean {
  if (!isDigits13(s)) return false;
  const digits = s.split("").map((c) => Number(c));
  const checksum = digits.slice(0, 12).reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (checksum % 10)) % 10;
  return checkDigit === digits[12];
}

/* ---------------- Static options ---------------- */
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

/* ---------------- Rich Text helpers ---------------- */
const RTE_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
} as const;
const RTE_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "align",
  "link",
] as const;

// mô tả rỗng/ chỉ tag rỗng
function isTrivialHtml(html: string): boolean {
  const s = html
    .replace(/<p><br><\/p>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return s.length === 0;
}

/* ---------------- Form types ---------------- */
type FormState = {
  title: string;
  slug: string;
  sku: string;
  isbn13: string;
  description: string; // HTML từ ReactQuill

  publisherId: number | undefined;
  supplierId: number | undefined;
  authorIds: number[];
  categoryIds: number[];

  pageCount: number | undefined;
  publicationYear: number | undefined;
  language: Language;
  weightGram: number | undefined;
  widthCm: number | undefined;
  heightCm: number | undefined;
  thicknessCm: number | undefined;
  coverType: CoverType;
  ageRating: AgeRating;

  status: BookCreate["status"];
  price: number | undefined;
  salePrice: number | undefined;
  saleStartAt: string;
  saleEndAt: string;

  initialStock: number | undefined;
};

/* ---------------- UI helpers ---------------- */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-600">{label}</span>
      {children}
    </label>
  );
}

/* ---------------- MAIN ---------------- */
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

    pageCount: undefined,
    publicationYear: new Date().getFullYear(),
    language: "VI",
    weightGram: undefined,
    widthCm: undefined,
    heightCm: undefined,
    thicknessCm: undefined,
    coverType: "PAPERBACK",
    ageRating: "ALL",

    status: "ACTIVE",
    price: undefined,
    salePrice: undefined,
    saleStartAt: "",
    saleEndAt: "",

    initialStock: undefined,
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
  const setNum =
    <K extends keyof FormState>(k: K) =>
    (raw: string) => {
      const v = raw.trim();
      setForm((s) => ({ ...s, [k]: v === "" ? undefined : Number(v) }) as FormState);
    };

  useEffect(() => {
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWarning = (msg: string) => setWarnings((w) => (w.includes(msg) ? w : [...w, msg]));

  async function loadOptions(): Promise<void> {
    setWarnings([]);

    try {
      const res = await api.get("/api/v1/admin/publishers");
      setPublishers(toOptions(unwrap<ResOption[]>(res.data)));
    } catch {
      addWarning("Không tải được NXB (/api/v1/Admin/publishers).");
    }

    try {
      const res = await api.get("/api/v1/admin/suppliers");
      setSuppliers(toOptions(unwrap<ResOption[]>(res.data)));
    } catch {
      addWarning("Không tải được NCC (/api/v1/Admin/suppliers).");
    }

    try {
      const res = await api.get("/api/v1/admin/authors");
      setAuthors(toOptions(unwrap<ResOption[]>(res.data)));
    } catch {
      addWarning("Không tải được Tác giả (/api/v1/Admin/authors).");
    }

    try {
      const res = await api.get("/api/v1/categories/flat/leaf");
      const list = unwrap<ResOption[]>(res.data);
      setCategories(toOptions(list));
    } catch {
      addWarning("Không tải được Danh mục (/api/v1/categories/flat/leaf).");
    }
  }

  function toggleId(list: number[], id: number) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  const isbnError: string | null = useMemo(() => {
    const raw = form.isbn13.trim();
    if (!raw) return "ISBN-13 là bắt buộc";
    if (!isDigits13(raw)) return "ISBN-13 phải gồm đúng 13 chữ số";
    if (!isValidIsbn13(raw)) return "ISBN-13 không hợp lệ (sai checksum)";
    return null;
  }, [form.isbn13]);

  const canSubmit = useMemo(() => {
    const okDesc = !isTrivialHtml(form.description);
    return (
      !!form.title.trim() &&
      !!form.isbn13.trim() &&
      !!form.publisherId &&
      !!form.supplierId &&
      form.authorIds.length > 0 &&
      form.categoryIds.length > 0 &&
      form.pageCount != null &&
      Number(form.pageCount) > 0 &&
      form.price != null &&
      Number(form.price) > 0 &&
      !!form.language &&
      !!form.coverType &&
      !!form.ageRating &&
      okDesc
    );
  }, [form]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError(isbnError ?? "Điền đủ trường bắt buộc (bao gồm mô tả).");
      return;
    }

    try {
      setSubmitting(true);

      const finalSlug = (form.slug?.trim() || slugify(form.title)).slice(0, 200);

      const payload: BookCreate = {
        title: form.title.trim(),
        slug: finalSlug,
        sku: form.sku?.trim() || null,
        isbn13: form.isbn13.trim(),
        description: form.description || null,

        publisherId: form.publisherId!,
        supplierId: form.supplierId!,
        authorIds: form.authorIds,
        categoryIds: form.categoryIds,

        pageCount: Number(form.pageCount ?? 0),
        publicationYear: Number(form.publicationYear ?? new Date().getFullYear()),
        language: form.language,
        weightGram: Number(form.weightGram ?? 0),
        widthCm: Number(form.widthCm ?? 0),
        heightCm: Number(form.heightCm ?? 0),
        thicknessCm: Number(form.thicknessCm ?? 0),
        coverType: form.coverType,
        ageRating: form.ageRating,

        status: form.status,
        price: Number(form.price ?? 0),
        salePrice:
          form.salePrice != null && String(form.salePrice).trim() !== ""
            ? Number(form.salePrice)
            : null,
        saleStartAt: toInstant(form.saleStartAt),
        saleEndAt: toInstant(form.saleEndAt),

        images: [],
        initialStock: Number(form.initialStock ?? 0),
      };

      await createBook(payload);
      onCreated();
    } catch (err: unknown) {
      const raw = pickAxiosMessage(err);
      if (raw && /duplicate slug or isbn-13/i.test(raw)) {
        setError("Slug hoặc ISBN-13 đã tồn tại. Hãy đổi slug/ISBN-13 rồi thử lại.");
      } else {
        setError(raw ?? "Tạo sách thất bại");
      }
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
                  placeholder="vd: toan-hoc-lop-1"
                />
              </FieldGroup>
              <FieldGroup label="SKU (optional)">
                <input
                  value={form.sku}
                  onChange={(e) => set("sku", e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="ISBN-13">
              <input
                value={form.isbn13}
                onChange={(e) => set("isbn13", e.target.value.replace(/\D+/g, ""))}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={13}
                placeholder="Ví dụ: 9786042101234"
                inputMode="numeric"
              />
              <div className="mt-1 text-xs text-gray-500">Nhập đủ 13 chữ số.</div>
            </FieldGroup>

            <FieldGroup label="Mô tả (rich text)">
              <div className="rounded-lg border">
                <ReactQuill
                  value={form.description}
                  onChange={(html) => set("description", html)}
                  modules={RTE_MODULES}
                  formats={RTE_FORMATS as unknown as string[]}
                  theme="snow"
                  placeholder="Nhập mô tả: có thể in đậm, bullet, link..."
                />
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Nhà xuất bản">
                <select
                  value={form.publisherId ?? ""}
                  onChange={(e) => set("publisherId", Number(e.target.value || 0))}
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
                  onChange={(e) => set("supplierId", Number(e.target.value || 0))}
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

            <FieldGroup label="Danh mục">
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
                  value={form.publicationYear ?? ""}
                  onChange={(e) => setNum("publicationYear")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Số trang">
                <input
                  type="number"
                  min={1}
                  value={form.pageCount ?? ""}
                  onChange={(e) => setNum("pageCount")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Nặng (gram)">
                <input
                  type="number"
                  min={0}
                  value={form.weightGram ?? ""}
                  onChange={(e) => setNum("weightGram")(e.target.value)}
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
              <FieldGroup label="Cao (cm)">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.heightCm ?? ""}
                  onChange={(e) => setNum("heightCm")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Rộng (cm)">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.widthCm ?? ""}
                  onChange={(e) => setNum("widthCm")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Dày (cm)">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.thicknessCm ?? ""}
                  onChange={(e) => setNum("thicknessCm")(e.target.value)}
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
                  value={form.price ?? ""}
                  onChange={(e) => setNum("price")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
              <FieldGroup label="Tồn kho ban đầu">
                <input
                  type="number"
                  min={0}
                  value={form.initialStock ?? ""}
                  onChange={(e) => setNum("initialStock")(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Giá sale (₫)">
                <input
                  type="number"
                  min={0}
                  value={form.salePrice ?? ""}
                  onChange={(e) => setNum("salePrice")(e.target.value)}
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
