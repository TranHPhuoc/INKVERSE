import { useEffect, useState } from "react";
import {
  listAuthors,
  createAuthor,
  listPublishers,
  createPublisher,
  listSuppliers,
  createSupplier,
  type SimpleMaster,
} from "../../services/admin/master";

function Section({
  title,
  color,
  items,
  onCreate,
}: {
  title: string;
  color: string;
  items: SimpleMaster[];
  onCreate: (p: SimpleMaster) => Promise<any>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

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
          await onCreate({ name, slug });
          setName("");
          setSlug("");
        }}
      >
        <input
          className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="flex-1 rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <button className="h-10 rounded-lg bg-indigo-600 px-4 text-white transition hover:bg-indigo-700">
          Create
        </button>
      </form>
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
              <tr key={`${i.id}-${i.slug}`} className="border-t hover:bg-gray-50/60">
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
    fetchAll();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Authors / Publishers / Suppliers</h2>
      <Section
        title="Authors"
        color="bg-indigo-500"
        items={authors}
        onCreate={async (p) => {
          await createAuthor(p);
          fetchAll();
        }}
      />
      <Section
        title="Publishers"
        color="bg-teal-500"
        items={publishers}
        onCreate={async (p) => {
          await createPublisher(p);
          fetchAll();
        }}
      />
      <Section
        title="Suppliers"
        color="bg-pink-500"
        items={suppliers}
        onCreate={async (p) => {
          await createSupplier(p);
          fetchAll();
        }}
      />
    </div>
  );
}
