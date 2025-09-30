// src/pages/admin/MastersPage.tsx
import { useEffect, useState } from "react";
import {
  listAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
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

type SectionHandlers = {
  onCreate: (name: string) => Promise<void>;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

/* -------- Row editable -------- */
function EditableRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: SimpleMaster;
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <tr className="border-t hover:bg-gray-50/60">
      <td className="px-4 py-2">{item.id}</td>
      <td className="px-4 py-2">
        {editing ? (
          <input
            className="w-full rounded-md border px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        ) : (
          item.name
        )}
      </td>
      <td className="px-4 py-2">{editing ? slugify(name) : item.slug}</td>
      <td className="px-4 py-2">
        {editing ? (
          <div className="flex items-center gap-2">
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
              className="cursor-pointer rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setName(item.name);
              }}
              className="cursor-pointer rounded-md border px-3 py-1 hover:bg-gray-50"
              disabled={saving}
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-md border px-3 py-1 hover:bg-gray-50"
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
              className="cursor-pointer rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700 disabled:opacity-60"
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

/* -------- Section dùng chung -------- */
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
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
        {title}
      </h3>

      <form
        className="mb-4 flex items-end gap-3"
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
          className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={creating}
        />
        <button
          className="h-10 rounded-lg bg-indigo-600 px-4 text-white transition hover:bg-indigo-700 disabled:opacity-60"
          disabled={creating}
        >
          {creating ? "Đang tạo..." : "Tạo"}
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50/80 text-gray-600">
            <tr>
              {["ID", "Name", "Slug", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <EditableRow
                key={i.id}
                item={i}
                onUpdate={handlers.onUpdate}
                onDelete={handlers.onDelete}
              />
            ))}
          </tbody>
        </table>
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

      <Section
        title="Authors"
        color="bg-indigo-500"
        items={authors}
        handlers={{
          onCreate: async (name) => {
            await createAuthor(buildPayload(name));
            await fetchAll();
          },
          onUpdate: async (id, name) => {
            await updateAuthor(id, buildPayload(name));
            await fetchAll();
          },
          onDelete: async (id) => {
            await deleteAuthor(id);
            await fetchAll();
          },
        }}
      />

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
