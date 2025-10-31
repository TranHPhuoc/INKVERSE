// src/pages/admin/StocksPage.tsx
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchStocks,
  type Page,
  type ResStockRowDTO,
} from "@/services/admin/warehouse";
import { Button } from "@/components/ui/button";
import { PageHeader, formatInt } from "@/components/Admin/ui";
import StockSearchBox from "@/components/Admin/StockSearchBox";

type SortStr = "stock,asc" | "stock,desc" | "sold,asc" | "sold,desc";

// mặc định 20/sp trang
const PAGE_SIZE = 20;

export default function StocksPage(): ReactElement {
  const [q] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [sort, setSort] = useState<SortStr>("stock,asc");

  const query = useQuery<Page<ResStockRowDTO>>({
    queryKey: ["stocks", { q, page, size: PAGE_SIZE, sort }] as const,
    queryFn: () => fetchStocks({ q, page, size: PAGE_SIZE, sort }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const data = query.data;
  const isLoading = query.isLoading;
  const isFetching = query.isFetching;
  const refetch = query.refetch;

  const rows = data?.content ?? [];
  const pageNumber = data?.number ?? 0; // 0-based
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  // khi đổi sort → quay về trang 1
  useEffect(() => {
    setPage(0);
  }, [sort]);

  // helper scroll mượt lên đầu
  const scrollToTopSmooth = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="space-y-4 isolate">
      <PageHeader
        title="Warehouse / Stocks"
        right={
          <div className="text-sm text-muted-foreground">
            {isFetching || isLoading
              ? "Loading…"
              : `${formatInt(totalElements)} items`}
          </div>
        }
      />

      {/* Search + controls */}
      <div className="relative z-50 overflow-visible isolate rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative z-50 w-full md:flex-1">
            <StockSearchBox onPick={(row) => console.log("Picked", row)} />
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const [field, dir] = sort.split(",");
              const next = dir === "asc" ? "desc" : "asc";
              setSort(`${field},${next}` as SortStr);
              scrollToTopSmooth();
            }}
          >
            Sort: {sort}
          </Button>

          {/* Hiển thị số item/trang */}
          <div className="rounded-full border px-3 h-9 flex items-center text-sm text-slate-700 bg-white/60">
            {PAGE_SIZE} / page
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative z-0 rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 border-b bg-white/90 text-left backdrop-blur">
            <tr className="[&>th]:px-3 [&>th]:py-3">
              <th>Book ID</th>
              <th>SKU</th>
              <th>Title</th>
              <th className="text-right">
                <button
                  className="underline-offset-4 hover:underline"
                  onClick={() => {
                    setSort((s) =>
                      s.startsWith("stock")
                        ? (`stock,${s.endsWith("asc") ? "desc" : "asc"}` as SortStr)
                        : "stock,asc"
                    );
                    scrollToTopSmooth();
                  }}
                >
                  Stock
                </button>
              </th>
              <th className="text-right">
                <button
                  className="underline-offset-4 hover:underline"
                  onClick={() => {
                    setSort((s) =>
                      s.startsWith("sold")
                        ? (`sold,${s.endsWith("asc") ? "desc" : "asc"}` as SortStr)
                        : "sold,asc"
                    );
                    scrollToTopSmooth();
                  }}
                >
                  Sold
                </button>
              </th>
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
            {rows.map((r) => (
              <tr
                key={`${r.bookId}-${r.sku}`}
                className="border-b hover:bg-slate-50/70 [&>td]:px-3 [&>td]:py-2.5"
              >
                <td className="font-mono">{r.bookId}</td>
                <td className="font-mono">{r.sku}</td>
                <td className="max-w-[720px] truncate">{r.title}</td>
                <td className="text-right">{formatInt(r.stock)}</td>
                <td className="text-right">{formatInt(r.sold)}</td>
              </tr>
            ))}
            </tbody>
          </table>

          {!isLoading && rows.length === 0 && (
            <div className="py-10 text-center text-muted-foreground">No data</div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="text-sm text-slate-600">
            Page <span className="font-medium">{pageNumber + 1}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                scrollToTopSmooth();
              }}
              disabled={pageNumber <= 0 || isFetching}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPage((p) => Math.min((totalPages || 1) - 1, p + 1));
                scrollToTopSmooth();
              }}
              disabled={pageNumber >= totalPages - 1 || isFetching}
            >
              Next
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                refetch();
                scrollToTopSmooth();
              }}
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
