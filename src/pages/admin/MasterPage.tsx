import { useEffect, useState } from "react";
import {
  listAuthors,
  createAuthor,
  listPublishers,
  createPublisher,
  listSuppliers,
  createSupplier,
  type SimpleMaster,
  type MasterCreate,
} from "../../services/admin/master";

/* -------- utils -------- */
function slugify(input: string): string {
  // bỏ dấu tiếng Việt + ký tự đặc biệt, về a-z0-9 và '-'
  const noAccent = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (
    noAccent
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "n-a"
  );
}

/* -------- Section (dùng chung) -------- */
function Section({
  title,
  color,
  items,
  onCreate,
}: {
  title: string;
  color: string;
  items: SimpleMaster[];
  // chỉ nhập name; slug FE tự sinh
  onCreate: (name: string) => Promise<void>;
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
            await onCreate(trimmed);
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
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50/80 text-gray-600">
            <tr>
              {["ID", "Name", "Slug"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t hover:bg-gray-50/60">
                <td className="px-4 py-2">{i.id}</td>
                <td className="px-4 py-2">{i.name}</td>
                <td className="px-4 py-2">{i.slug}</td>
              </tr>
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
        onCreate={async (name) => {
          await createAuthor(buildPayload(name));
          await fetchAll();
        }}
      />

      <Section
        title="Publishers"
        color="bg-teal-500"
        items={publishers}
        onCreate={async (name) => {
          await createPublisher(buildPayload(name));
          await fetchAll();
        }}
      />

      <Section
        title="Suppliers"
        color="bg-pink-500"
        items={suppliers}
        onCreate={async (name) => {
          await createSupplier(buildPayload(name));
          await fetchAll();
        }}
      />
    </div>
  );
}
