// src/pages/admin/BatchHistoryPage.tsx
import type { ReactElement } from "react";
import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchBatchHistory,
  fetchBatchDetail,
  type BatchType,
  type Page,
  type ResBatch,
  type ResBatchHistoryRow,
} from "@/services/admin/warehouse";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, ListFilter } from "lucide-react";
import { PageHeader, TypeBadge, EmptyState } from "@/components/Admin/ui";
import { formatInt, formatAmount, formatDT } from "@/components/Admin/ui";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "react-hot-toast";

/* ---------- Helpers ---------- */
function toIsoOrUndefined(local: string): string | undefined {
  if (!local) return undefined;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

const TYPE_ALL = "all";
const ctl = "h-11 w-full text-sm leading-[1.25rem]";

/* ---------- Component ---------- */
export default function BatchHistoryPage(): ReactElement {
  const [type, setType] = useState<BatchType | "">("");
  const [code, setCode] = useState("");
  const [q, setQ] = useState("");
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");
  const [includeItems, setIncludeItems] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery<Page<ResBatchHistoryRow>>({
    queryKey: ["batchHistory", { type, code, q, fromLocal, toLocal, includeItems, page }] as const,
    queryFn: () => {
      const params: Parameters<typeof fetchBatchHistory>[0] = { page, size: 20 };
      if (includeItems) params.includeItems = true;
      if (type) params.type = type;
      if (code) params.code = code;
      if (q) params.q = q;
      const fromISO = toIsoOrUndefined(fromLocal);
      if (fromISO) params.dateFrom = fromISO;
      const toISO = toIsoOrUndefined(toLocal);
      if (toISO) params.dateTo = toISO;
      return fetchBatchHistory(params);
    },
    placeholderData: (prev) => prev as Page<ResBatchHistoryRow> | undefined,
  });

  const rows = data?.content ?? [];

  /* ---------- Detail dialog ---------- */
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ResBatch | null>(null);
  const loadingToastId = useRef<string | null>(null);

  function showDetailLoading(): string {
    if (loadingToastId.current) toast.remove(loadingToastId.current);
    const id = toast.custom(
      () => (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border bg-white/90 px-4 py-3 shadow-lg">
          <Spinner className="size-5 text-blue-600" />
          <div className="text-sm text-slate-700">Đang tải chi tiết…</div>
        </div>
      ),
      { duration: Infinity }
    );
    loadingToastId.current = id;
    return id;
  }
  function hideDetailLoading(immediate = true) {
    if (!loadingToastId.current) return;
    const id = loadingToastId.current;
    loadingToastId.current = null;
    if (immediate) {
      toast.remove(id);
    } else {
      toast.dismiss(id);
    }
  }

  async function openDetail(id: number): Promise<void> {
    setDetail(null);
    setOpen(true);
    const toastId = showDetailLoading();
    try {
      const d = await fetchBatchDetail(id);
      setDetail(d);
      toast.remove(toastId);
      if (loadingToastId.current === toastId) loadingToastId.current = null;
    } catch {
      hideDetailLoading();
      toast.error("Không tải được chi tiết. Thử lại nhé!");
    }
  }

  useEffect(() => setPage(0), [type, code, q, fromLocal, toLocal, includeItems]);

  /* ---------- Render ---------- */
  return (
    <div className="space-y-4">
      <PageHeader
        title="Warehouse / Batch History"
        right={
          isFetching || isLoading ? (
            <span className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Loading…
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )
        }
      />

      {/* Filters */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-2 pt-1">
            <label className="flex items-center gap-2 text-sm font-medium">
              <ListFilter className="h-4 w-4" />
              Type
            </label>
            <Select
              value={type || TYPE_ALL}
              onValueChange={(v) => setType(v === TYPE_ALL ? "" : (v as BatchType))}
            >
              <SelectTrigger className={`${ctl} mt-1.5 py-0`}>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width] min-w-[12rem]">
                <SelectItem value={TYPE_ALL}>All</SelectItem>
                <SelectItem value="INBOUND">INBOUND</SelectItem>
                <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Code (span-2) */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Code</label>
            <Input
              className={`${ctl} mt-1.5`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="IVN-20251029-000123"
            />
          </div>

          {/* Keyword (span-3) */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Keyword</label>
            <Input
              className={`${ctl} mt-1.5`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Reason/Note contains…"
            />
          </div>

          {/* From (span-2) */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">From</label>
            <Input
              type="datetime-local"
              className={`${ctl} mt-1.5 [appearance:textfield] [&::-webkit-datetime-edit]:leading-[1.25rem]`}
              value={fromLocal}
              onChange={(e) => setFromLocal(e.target.value)}
            />
          </div>

          {/* To (span-2) */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium">To</label>
            <Input
              type="datetime-local"
              className={`${ctl} mt-1.5 [appearance:textfield] [&::-webkit-datetime-edit]:leading-[1.25rem]`}
              value={toLocal}
              onChange={(e) => setToLocal(e.target.value)}
            />
          </div>

          {/* Include + Apply (span-1) – căn đáy để thẳng hàng hàng nút */}
          <div className="md:col-span-2 flex items-end gap-2">
            <div className="flex h-11 items-center gap-2 rounded-md border px-3">
              <Checkbox
                checked={includeItems}
                onCheckedChange={(v) => setIncludeItems(Boolean(v))}
              />
              <span className="text-sm">Include items</span>
            </div>
            <Button variant="outline" className="h-11" onClick={() => refetch()}>
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white/90 backdrop-blur border-b text-left">
            <tr className="[&>th]:py-3 [&>th]:px-3">
              <th>Code</th>
              <th>Type</th>
              <th>Reason</th>
              <th>Performed By</th>
              <th>Performed At</th>
              <th className="text-right">Items</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Amount</th>
              <th />
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
            {rows.map((r) => (
              <tr key={r.id} className="border-b [&>td]:py-2.5 [&>td]:px-3">
                <td className="font-mono">{r.code}</td>
                <td><TypeBadge type={r.type} /></td>
                <td>{r.reason ?? "-"}</td>
                <td>{r.performedByName}</td>
                <td>{formatDT(r.performedAt)}</td>
                <td className="text-right">{formatInt(r.totalItems)}</td>
                <td className="text-right">{formatInt(r.totalQty)}</td>
                <td className="text-right">{formatAmount(r.totalAmount)}</td>
                <td className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openDetail(r.id)}>
                    Detail
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          {!isLoading && rows.length === 0 && <EmptyState>No data</EmptyState>}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="outline" disabled={(data?.number ?? 0) <= 0} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <div className="text-sm">Page {(data?.number ?? 0) + 1} / {data?.totalPages ?? 1}</div>
          <Button
            variant="outline"
            disabled={(data?.number ?? 0) >= (data?.totalPages ?? 1) - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl rounded-2xl shadow-xl">
          <DialogHeader className="border-b pb-2 mb-3">
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Batch Detail
            </DialogTitle>
          </DialogHeader>

          {detail ? (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-700">
                <div>
                  <span className="font-medium text-slate-900">Code:</span>{" "}
                  <span className="font-mono">{detail.code}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900">Type:</span> {detail.type}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Reason:</span>{" "}
                  {detail.reason || "-"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Note:</span>{" "}
                  {detail.note || "-"}
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-slate-900">Performed By:</span>{" "}
                  {detail.performedBy.name}{" "}
                  <span className="text-slate-500">(ID: {detail.performedBy.userId})</span>
                </div>
                <div>
                  <span className="font-medium text-slate-900">Performed At:</span>{" "}
                  {formatDT(detail.performedAt)}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Totals:</span>{" "}
                  {formatInt(detail.totals.items)} items,{" "}
                  {formatInt(detail.totals.qty)} quantity,{" "}
                  {formatAmount(detail.totals.amount)}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-[80px]">Book ID</th>
                    <th className="px-3 py-2 text-left font-medium w-[120px]">SKU</th>
                    <th className="px-3 py-2 text-left font-medium w-[680px]">Title</th>
                    <th className="px-3 py-2 text-right font-medium w-[80px]">Quantity</th>
                    <th className="px-3 py-2 text-right font-medium w-[120px]">Unit Cost</th>
                    <th className="px-3 py-2 text-right font-medium w-[120px]">Line Total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {detail.lines.map((l, i) => (
                    <tr
                      key={`${l.bookId}-${i}`}
                      className="border-b hover:bg-slate-50 transition"
                    >
                      <td className="px-3 py-2 font-mono">{l.bookId}</td>
                      <td className="px-3 py-2 font-mono">{l.sku}</td>
                      <td className="px-3 py-2 max-w-[680px] truncate">{l.title}</td>
                      <td className="px-3 py-2 text-center">{formatInt(l.qty)}</td>
                      <td className="px-3 py-2 text-right">
                        {formatAmount(l.unitCost)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatAmount(l.lineTotal)}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState>No data</EmptyState>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
