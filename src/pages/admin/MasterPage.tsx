// src/pages/Admin/MastersPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  listAuthors,               // lấy full authors (public)
  listPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type SimpleMaster,
  type MasterCreate,
  createAuthor,              // vẫn dùng admin create/update/delete
  updateAuthor,
  deleteAuthor,
} from "../../services/admin/master";

/* -------- utils -------- */
function slugify(input: string): string {
  const noAccent = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (
    noAccent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "n-a"
  );
}
const normalizeText = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

type SectionHandlers = {
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

/* -------- Row editable (dùng chung) -------- */
function EditableRow({
                       item,
                       onUpdate,
                       onDelete,
                       previewSlugWhenEditing = false, // Authors sẽ bật để hiển thị preview slug
                     }: {
  item: SimpleMaster;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  previewSlugWhenEditing?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slugPreview = useMemo(
    () => (previewSlugWhenEditing ? slugify(name) : item.slug),
    [previewSlugWhenEditing, name, item.slug]
  );

  return (
    <li className="px-4 py-3 hover:bg-gray-50/70">
      <div className="grid grid-cols-[80px_minmax(0,1fr)_220px_200px] items-center gap-3 md:grid-cols-[80px_minmax(0,1fr)_260px_220px]">
        <div className="text-sm text-gray-700">{item.id}</div>

        <div className="min-w-0">
          {editing ? (
            <input
              className="w-full rounded-md px-2 py-1 shadow-inner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          ) : (
            <div className="truncate">{item.name}</div>
          )}
        </div>

        <div className="truncate text-gray-600">{editing ? slugPreview : item.slug}</div>

        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <button
                onClick={async () => {
                  const trimmed = name.trim();
                  if (!trimmed) return;
                  setSaving(true);
                  try {
                    await onUpdate(item.id, trimmed);
                    setEditing(false);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="cursor-pointer rounded-md bg-emerald-600/90 px-3 py-1 text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(item.name);
                }}
                className="cursor-pointer rounded-md px-3 py-1 transition hover:bg-gray-50"
                disabled={saving}
              >
                Hủy
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="cursor-pointer rounded-md px-3 py-1 transition hover:bg-gray-50"
              >
                Sửa
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm(`Xoá "${item.name}"?`)) return;
                  setDeleting(true);
                  try {
                    await onDelete(item.id);
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="cursor-pointer rounded-md bg-rose-600/90 px-3 py-1 text-white transition hover:-translate-y-0.5 hover:bg-rose-600 active:translate-y-0 disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/* -------- Section dùng chung (cho Publishers/Suppliers) -------- */
function Section({
                   title,
                   color,
                   items,
                   handlers,
                 }: {
  title: string;
  color: string;
  items: SimpleMaster[];
  handlers: SectionHandlers;
}) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
        {title}
      </h3>

      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || creating) return;
          setError(null);
          setCreating(true);
          try {
            await handlers.onCreate(trimmed);
            setName("");
          } catch {
            setError("Tạo thất bại. Thử lại nhé.");
          } finally {
            setCreating(false);
          }
        }}
      >
        <input
          className="flex-1 rounded-xl px-3 py-2 shadow-inner focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={creating}
        />
        <button
          className="h-10 cursor-pointer rounded-xl bg-indigo-600 px-4 text-white transition hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0 disabled:opacity-60"
          disabled={creating}
        >
          {creating ? "Đang tạo..." : "Tạo"}
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

      <div className="rounded-xl">
        <div className="grid grid-cols-[80px_minmax(0,1fr)_220px_200px] gap-3 px-4 pt-3 pb-2 text-xs text-gray-500 md:grid-cols-[80px_minmax(0,1fr)_260px_220px]">
          <div>ID</div>
          <div>Name</div>
          <div>Slug</div>
          <div className="text-right">Actions</div>
        </div>
        <ul className="divide-y divide-gray-100">
          {items.map((i) => (
            <EditableRow key={i.id} item={i} onUpdate={handlers.onUpdate} onDelete={handlers.onDelete} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -------- Authors: client-side search + sort + paging (25/trang mặc định, auto hiển thị n authors) -------- */
function AuthorsSectionClient({
                                all,
                                onCreate,
                                onUpdate,
                                onDelete,
                              }: {
  all: SimpleMaster[];
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);
  const [sort, setSort] = useState<"name.asc" | "name.desc" | "id.asc" | "id.desc">("name.asc");
  const [page, setPage] = useState(0);
  const size = 25; // luôn mặc định 25/trang

  // filter + sort
  const filtered = useMemo(() => {
    const k = normalizeText(dq.trim());
    let arr = !k
      ? all
      : all.filter(
        (a) => normalizeText(a.name).includes(k) || normalizeText(a.slug).includes(k)
      );
    switch (sort) {
      case "name.asc":
        arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name.desc":
        arr = [...arr].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "id.asc":
        arr = [...arr].sort((a, b) => a.id - b.id);
        break;
      case "id.desc":
        arr = [...arr].sort((a, b) => b.id - a.id);
        break;
    }
    return arr;
  }, [all, dq, sort]);

  // paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, totalPages - 1);
  const content = useMemo(() => {
    const start = safePage * size;
    return filtered.slice(start, start + size);
  }, [filtered, safePage, size]);

  useEffect(() => setPage(0), [dq, sort]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
        Authors
      </h3>

      {/* Create */}
      <form
        className="mb-3 flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("newName") as HTMLInputElement;
          const name = input.value.trim();
          if (!name) return;
          await onCreate(name);
          input.value = "";
        }}
      >
        <input
          name="newName"
          className="flex-1 rounded-xl px-3 py-2 shadow-inner"
          placeholder="Name"
        />
        <button className="h-10 rounded-xl bg-indigo-600 px-4 text-white">Tạo</button>
      </form>

      {/* Search + Sort + Count */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-[360px] rounded-xl px-3 py-2 shadow-inner"
          placeholder="Tìm theo tên/slug…"
        />
        <select
          value={sort}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value as "name.asc" | "name.desc" | "id.asc" | "id.desc";
            setSort(value);
          }}
          className="rounded-xl px-3 py-2 shadow-inner cursor-pointer"
        >
          <option value="name.asc">Tên ↑</option>
          <option value="name.desc">Tên ↓</option>
          <option value="id.asc">ID ↑</option>
          <option value="id.desc">ID ↓</option>
        </select>
        <div className="text-sm text-gray-600">
          <b>{content.length}</b>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[80px_minmax(0,1fr)_220px_200px] gap-3 px-4 pt-3 pb-2 text-xs text-gray-500 md:grid-cols-[80px_minmax(0,1fr)_260px_220px]">
        <div>ID</div>
        <div>Name</div>
        <div>Slug</div>
        <div className="text-right">Actions</div>
      </div>

      {/* List */}
      <ul className="divide-y divide-gray-100">
        {content.map((i) => (
          <EditableRow
            key={i.id}
            item={i}
            onUpdate={onUpdate}
            onDelete={async (id) => {
              await onDelete(id);
              const after = total - 1;
              const lastPageAfter = Math.max(0, Math.ceil(after / size) - 1);
              if (safePage > lastPageAfter) setPage(lastPageAfter);
            }}
            previewSlugWhenEditing={true}
          />
        ))}
      </ul>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Trang {safePage + 1}/{totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md px-3 py-1 ring-1 ring-gray-200 disabled:opacity-50 cursor-pointer"
            onClick={() => setPage(0)}
            disabled={safePage <= 0}
          >
            « Đầu
          </button>
          <button
            className="rounded-md px-3 py-1 ring-1 ring-gray-200 disabled:opacity-50 cursor-pointer"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage <= 0}
          >
            ‹ Trước
          </button>
          <button
            className="rounded-md px-3 py-1 ring-1 ring-gray-200 disabled:opacity-50 cursor-pointer"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
          >
            Sau ›
          </button>
          <button
            className="rounded-md px-3 py-1 ring-1 ring-gray-200 disabled:opacity-50 cursor-pointer"
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1}
          >
            Cuối »
          </button>
        </div>
      </div>
    </div>
  );
}


/* -------- Page -------- */
export default function MastersPage() {
  const [authors, setAuthors] = useState<SimpleMaster[]>([]);
  const [publishers, setPublishers] = useState<SimpleMaster[]>([]);
  const [suppliers, setSuppliers] = useState<SimpleMaster[]>([]);

  const fetchAll = async () => {
    const [a, p, s] = await Promise.all([listAuthors(), listPublishers(), listSuppliers()]);
    setAuthors(a);
    setPublishers(p);
    setSuppliers(s);
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  const buildPayload = (name: string): MasterCreate => ({
    name,
    slug: slugify(name),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Authors / Publishers / Suppliers</h2>

      {/* Authors – client-side paging 25/trang + search + sort */}
      <AuthorsSectionClient
        all={authors}
        onCreate={async (name) => {
          await createAuthor(buildPayload(name));      // admin create (BE có thể bỏ qua slug)
          await fetchAll();
        }}
        onUpdate={async (id, name) => {
          await updateAuthor(id, buildPayload(name));  // admin update (chủ yếu dùng name)
          await fetchAll();
        }}
        onDelete={async (id) => {
          await deleteAuthor(id);
          await fetchAll();
        }}
      />

      {/* Publishers */}
      <Section
        title="Publishers"
        color="bg-teal-500"
        items={publishers}
        handlers={{
          onCreate: async (name) => {
            await createPublisher(buildPayload(name));
            await fetchAll();
          },
          onUpdate: async (id, name) => {
            await updatePublisher(id, buildPayload(name));
            await fetchAll();
          },
          onDelete: async (id) => {
            await deletePublisher(id);
            await fetchAll();
          },
        }}
      />

      {/* Suppliers */}
      <Section
        title="Suppliers"
        color="bg-pink-500"
        items={suppliers}
        handlers={{
          onCreate: async (name) => {
            await createSupplier(buildPayload(name));
            await fetchAll();
          },
          onUpdate: async (id, name) => {
            await updateSupplier(id, buildPayload(name));
            await fetchAll();
          },
          onDelete: async (id) => {
            await deleteSupplier(id);
            await fetchAll();
          },
        }}
      />
    </div>
  );
}
