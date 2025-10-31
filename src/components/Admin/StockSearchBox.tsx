import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { fetchStocks } from "@/services/admin/warehouse"; // đã unwrap sẵn

type Row = {
  bookId: number;
  sku: string;
  title: string;
  stock: number;
  sold: number;
};

type Props = {
  onPick?: (row: Row) => void;
};

export default function StockSearchBox({ onPick }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // đóng panel khi click ra ngoài
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // debounce search
  useEffect(() => {
    if (!q.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const page = await fetchStocks({ q, page: 0, size: 10, sort: "stock,desc" });
        setRows(page.content);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div ref={boxRef} className="relative z-50 w-full">
      <div className="flex items-center rounded-xl border bg-white/90 shadow-sm ring-1 ring-black/5">
        <Search className="mx-3 size-4 opacity-60" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => rows.length && setOpen(true)}
          placeholder="Gõ tên sách hoặc SKU…"
          className="h-11 border-0 shadow-none focus-visible:ring-0"
        />
        {loading && <Spinner className="mr-3 size-4 text-slate-500" />}
      </div>

      {/* PANEL: luôn nổi trên table, không bị cắt */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 max-h-[60vh] overflow-auto rounded-xl border bg-white/95 shadow-2xl backdrop-blur
                     z-[60]"
        >
          <div className="px-4 py-2 text-xs text-slate-500">
            {rows.length} sản phẩm tìm thấy
          </div>
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={`${r.bookId}-${r.sku}`}
                className="cursor-pointer px-4 py-3 hover:bg-slate-50"
                onClick={() => {
                  onPick?.(r);
                  setOpen(false);
                }}
              >
                <div className="font-medium">{r.title}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono">SKU: {r.sku}</span>
                  <span className="mx-2">•</span>
                  <span>Tồn kho: {r.stock}</span>
                </div>
              </li>
            ))}
            {rows.length === 0 && !loading && (
              <li className="px-4 py-6 text-sm text-slate-500">Không có kết quả</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
