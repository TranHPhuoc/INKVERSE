import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { fetchStocks } from "@/services/admin/warehouse";

type Row = {
  bookId: number;
  sku: string;
  title: string;
  stock: number;
  sold: number;
};

type Props = {
  value?: string;                     // show giá trị hiện tại (SKU hoặc ID dạng string)
  onChange?: (v: string) => void;     // gõ tay hoặc auto-fill sau khi pick
  onPick?: (row: Row) => void;        // callback khi chọn 1 kết quả
  placeholder?: string;
  className?: string;
};

export default function BatchSearchBox({
                                         value,
                                         onChange,
                                         onPick,
                                         placeholder = "Gõ tên sách hoặc SKU…",
                                         className = "",
                                       }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);

  // q là state hiển thị trong input (controlled theo value từ ngoài)
  const [q, setQ] = useState<string>(value ?? "");

  useEffect(() => setQ(value ?? ""), [value]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxH: number }>({
    left: 0, top: 0, width: 0, maxH: 360,
  });

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // debounce search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setRows([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const page = await fetchStocks({ q: term, page: 0, size: 10, sort: "stock,desc" });
        setRows(page.content);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // đo & set vị trí panel
  const updatePos = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const available = Math.max(120, window.innerHeight - (r.bottom + 12));
    setPos({
      left: Math.round(r.left),
      top: Math.round(r.bottom + 8),
      width: Math.round(r.width),
      maxH: Math.min(available, 480),
    });
  };

  useLayoutEffect(() => { if (open) updatePos(); }, [open, rows.length]);
  useEffect(() => {
    if (!open) return;
    const onWin = () => updatePos();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className={`relative w-full ${className}`}>
      <div className="flex items-center rounded-xl border bg-white/90 shadow-sm ring-1 ring-black/5">
        <Search className="mx-3 size-4 opacity-60" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onChange?.(e.target.value);
          }}
          onFocus={() => rows.length && setOpen(true)}
          placeholder={placeholder}
          className="h-11 border-0 shadow-none focus-visible:ring-0"
        />
        {loading && <Spinner className="mr-3 size-4 text-slate-500" />}
      </div>

      {open && createPortal(
        <div
          style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxH, zIndex: 9999 }}
          className="overflow-auto rounded-xl border bg-white/95 shadow-2xl backdrop-blur"
        >
          <div className="px-4 py-2 text-xs text-slate-500">{rows.length} sản phẩm tìm thấy</div>
          <ul className="divide-y">
            {rows.map((r) => (
              <li
                key={`${r.bookId}-${r.sku}`}
                className="cursor-pointer px-4 py-3 hover:bg-slate-50"
                onMouseDown={(e)=>{
                  e.preventDefault();
                  setQ(r.sku);
                  onChange?.(r.sku);
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
        </div>,
        document.body
      )}
    </div>
  );
}
