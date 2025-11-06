import type React from "react";
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  getBookDetailById,
  updateBook,
  type BookDetail,
  type BookCreate,
} from "../../services/admin/books-admin";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import AuthorSearch from "./AuthorSearch";

/* ---------------- Types from API wrappers ---------------- */
type RestResponse<T> = {
  statusCode: number;
  error: string | null;
  message: string | null;
  data: T;
};
type ResOption = { id: number; name: string; slug?: string };
type Option = { id: number; name: string };

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
function fromIsoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}
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
function isRecord(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === "object";
}
type AxiosLikeError = { response?: { data?: { message?: unknown } } };
function pickAxiosMessage(err: unknown): string | null {
  if (!isRecord(err)) return null;
  const maybe = err as AxiosLikeError;
  const msg = maybe.response?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg : null;
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

function isTrivialHtml(html: string): boolean {
  const s = html
    .replace(/<p><br><\/p>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return s.length === 0;
}

/* ---------------- Form types ---------------- */
type FormImage = { url: string; sortOrder: number };

type FormState = {
  title: string;
  slug: string;
  sku: string;
  isbn13: string;
  description: string; // HTML

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

  images: FormImage[];
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
export default function EditBookModal({
  bookId,
  onClose,
  onUpdated,
}: {
  bookId: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

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

    images: [],
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
    void (async () => {
      setWarnings([]);
      try {
        const [pubRes, supRes, authRes, leafRes] = await Promise.all([
          api.get("/api/v1/admin/publishers"),
          api.get("/api/v1/admin/suppliers"),
          api.get("/api/v1/admin/authors"),
          api.get("/api/v1/categories/flat/leaf"),
        ]);
        setPublishers(toOptions(unwrap<ResOption[]>(pubRes.data)));
        setSuppliers(toOptions(unwrap<ResOption[]>(supRes.data)));
        setAuthors(toOptions(unwrap<ResOption[]>(authRes.data)));
        setCategories(toOptions(unwrap<ResOption[]>(leafRes.data)));
      } catch {
        setWarnings((w) => [...w, "Không tải được options (NXB/NCC/Tác giả/Danh mục)."]);
      }

      try {
        const detail = await getBookDetailById(bookId);
        hydrate(detail);
        setLoaded(true);
      } catch (e) {
        console.error(e);
        setError("Không tải được thông tin sách.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  function hydrate(b: BookDetail) {
    setForm({
      title: b.title ?? "",
      slug: b.slug ?? "",
      sku: b.sku ?? "",
      isbn13: b.isbn13 ?? "",
      description: b.description ?? "",

      publisherId: b.publisher?.id,
      supplierId: b.supplier?.id,
      authorIds: b.authors?.map((a) => a.id) ?? [],
      categoryIds: b.categories?.map((c) => c.id) ?? [],

      pageCount: b.pageCount ?? undefined,
      publicationYear: b.publicationYear ?? new Date().getFullYear(),
      language: (b.language as Language) ?? "VI",
      weightGram: b.weightGram ?? undefined,
      widthCm: b.widthCm ?? undefined,
      heightCm: b.heightCm ?? undefined,
      thicknessCm: b.thicknessCm ?? undefined,
      coverType: (b.coverType as CoverType) ?? "PAPERBACK",
      ageRating: (b.ageRating as AgeRating) ?? "ALL",

      status: (b.status as BookCreate["status"]) ?? "ACTIVE",
      price: b.price ?? undefined,
      salePrice: b.salePrice ?? undefined,
      saleStartAt: fromIsoToLocalInput(b.saleStartAt),
      saleEndAt: fromIsoToLocalInput(b.saleEndAt),

      images: (b.images || []).map((i) => ({ url: i.url, sortOrder: i.sortOrder })),
    });
  }

  const canSubmit = useMemo(() => {
    const hasAtLeastOneImage = form.images.some((it) => it.url.trim().length > 0);
    const okDesc = !isTrivialHtml(form.description);
    return (
      !!form.title.trim() &&
      !!form.publisherId &&
      !!form.supplierId &&
      form.authorIds.length > 0 &&
      form.categoryIds.length > 0 &&
      form.pageCount != null &&
      Number(form.pageCount) >= 0 &&
      form.price != null &&
      Number(form.price) > 0 &&
      !!form.language &&
      !!form.coverType &&
      !!form.ageRating &&
      hasAtLeastOneImage &&
      (!form.isbn13 || isDigits13(form.isbn13)) &&
      okDesc
    );
  }, [form]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError(
        "Vui lòng kiểm tra các trường bắt buộc (ISBN nếu nhập phải đủ 13 số, mô tả không rỗng).",
      );
      return;
    }

    try {
      setSubmitting(true);

      const finalSlug = (form.slug?.trim() || slugify(form.title)).slice(0, 200);

      const payload: {
        title: string;
        slug: string;
        sku: string | null;
        isbn13: string | null;
        description: string | null;
        publisherId: number;
        supplierId: number;
        authorIds: number[];
        categoryIds: number[];
        pageCount: number;
        publicationYear: number;
        language: "VI" | "EN" | "JP" | "KR" | "CN" | "OTHER";
        weightGram: number;
        widthCm: number;
        heightCm: number;
        thicknessCm: number;
        coverType: "PAPERBACK" | "HARDCOVER" | "OTHER";
        ageRating: "ALL" | "_6PLUS" | "_12PLUS" | "_16PLUS" | "_18PLUS";
        status: "DRAFT" | "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
        price: number;
        salePrice: number | null;
        saleStartAt: string | null;
        saleEndAt: string | null;
        images: { url: string; sortOrder: number }[]
      } = {
        title: form.title.trim(),
        slug: finalSlug,
        sku: form.sku?.trim() || null,
        isbn13: form.isbn13?.trim() || null,
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

        images: form.images
          .filter((it) => it.url.trim().length > 0)
          .map((it, i) => ({
            url: it.url.trim(),
            sortOrder: Number(it.sortOrder ?? i),
          })),
      };

      await updateBook(bookId, payload);
      onUpdated();
    } catch (err: unknown) {
      const raw = pickAxiosMessage(err);
      if (raw && /duplicate slug or isbn-13/i.test(raw)) {
        setError("Slug hoặc ISBN-13 đã tồn tại. Hãy đổi slug/ISBN-13 rồi thử lại.");
      } else {
        setError(raw ?? "Cập nhật sách thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) {
    return (
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40">
        <div className="rounded-2xl border bg-white px-6 py-4 shadow-xl">Đang tải…</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40">
      <div className="w-full max-w-4xl rounded-2xl border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sửa sách #{bookId}</h3>
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
          <div className="col-span-2 space-y-3 md:col-span-1 ml-1">
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
              <div className="mt-1 text-xs text-gray-500">Phải đủ 13 chữ số.</div>
            </FieldGroup>

            <FieldGroup label="Mô tả (rich text)">
              <div className="rounded-lg border">
                <ReactQuill
                  value={form.description}
                  onChange={(html) => set("description", html)}
                  modules={RTE_MODULES}
                  formats={RTE_FORMATS as unknown as string[]}
                  theme="snow"
                  placeholder="Nhập/điều chỉnh mô tả sản phẩm…"
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
              <AuthorSearch
                all={authors}
                value={form.authorIds}
                onChange={(ids: number[]) => set("authorIds", ids)}
                heightClass="max-h-60"
              />
            </FieldGroup>


            <FieldGroup label="Danh mục">
              <div className="max-h-32 overflow-auto rounded-lg border p-2">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(c.id)}
                      onChange={() =>
                        set(
                          "categoryIds",
                          form.categoryIds.includes(c.id)
                            ? form.categoryIds.filter((x) => x !== c.id)
                            : [...form.categoryIds, c.id],
                        )
                      }
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
                  min={0}
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
                      onClick={() =>
                        set(
                          "images",
                          form.images
                            .filter((_, i) => i !== idx)
                            .map((it, i2) => ({ ...it, sortOrder: i2 })),
                        )
                      }
                      className="col-span-1 h-10 rounded-lg border hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    set("images", [...form.images, { url: "", sortOrder: form.images.length }])
                  }
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
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
