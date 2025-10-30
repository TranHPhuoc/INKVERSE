import type { ReactElement } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStocks, type Page, type ResStockRowDTO } from "@/services/admin/warehouse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, formatInt } from "@/components/Admin/ui";
import { Search } from "lucide-react";

type SortStr = "stock,asc" | "stock,desc" | "sold,asc" | "sold,desc";

export default function StocksPage(): ReactElement {
  const [q, setQ] = useState<string>("");
  const [page] = useState<number>(0);
  const [sort, setSort] = useState<SortStr>("stock,asc");

  const { data, isLoading } = useQuery<Page<ResStockRowDTO>>({
    queryKey: ["stocks", { q, page, sort }],
    queryFn: () => fetchStocks({ q, page, sort }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.content ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Warehouse / Stocks" />

      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search SKU or Title…"
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const [f, dir] = sort.split(",");
              const next = dir === "asc" ? "desc" : "asc";
              setSort(`${f},${next}` as SortStr);
            }}
          >
            Sort: {sort}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white/90 backdrop-blur border-b text-left">
            <tr className="[&>th]:py-3 [&>th]:px-3">
              <th>Book ID</th>
              <th>SKU</th>
              <th>Title</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Sold</th>
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
            {rows.map((r) => (
              <tr key={r.bookId} className="border-b hover:bg-slate-50/70 [&>td]:py-2.5 [&>td]:px-3">
                <td className="font-mono">{r.bookId}</td>
                <td className="font-mono">{r.sku}</td>
                <td className="max-w-[520px] truncate">{r.title}</td>
                <td className="text-right">{formatInt(r.stock)}</td>
                <td className="text-right">{formatInt(r.sold)}</td>
              </tr>
            ))}
            </tbody>
          </table>
          {!isLoading && rows.length === 0 && <div className="py-10 text-center text-muted-foreground">No data</div>}
        </div>
      </div>
    </div>
  );
}
