// src/components/Admin/AuthorSearch.tsx
import React, { useEffect, useMemo, useState } from "react";

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

export type AuthorOption = { id: number; name: string };

type Props = {
  all: AuthorOption[];
  value: number[];
  onChange: (ids: number[]) => void;
  heightClass?: string; // vd: "max-h-48"
};

function AuthorSearchMulti({ all, value, onChange, heightClass = "max-h-48" }: Props) {
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 300);

  const filtered = useMemo(() => {
    const k = normalizeText(dq.trim());
    if (!k) return all;
    return all.filter((a) => normalizeText(a.name).includes(k));
  }, [all, dq]);

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);


  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tác giả …"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className={`${heightClass} overflow-auto rounded-lg border p-2`}>
        {filtered.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
            <input type="checkbox" checked={value.includes(a.id)} onChange={() => toggle(a.id)} />
            <span className="truncate">{a.name}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="py-2 text-center text-sm text-gray-500">Không có kết quả</div>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value
            .map((id) => all.find((x) => x.id === id))
            .filter(Boolean)
            .map((a) => (
              <span
                key={a!.id}
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              >
                {a!.name}
                <button
                  type="button"
                  onClick={() => toggle(a!.id)}
                  className="leading-none text-gray-500 hover:text-rose-600"
                  title="Bỏ chọn"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

export default AuthorSearchMulti;
