import type { ReactElement, ChangeEvent } from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  createBatch,
  type ReqCreateBatch,
  type ReqCreateBatchLine,
  type BatchType,
} from "@/services/admin/warehouse";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { PageHeader } from "@/components/Admin/ui";
import { toast } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import BatchSearchBox from "@/components/Admin/BatchSearchBox";

/* ---------- types ---------- */
type LineDraft = { bookId?: number; sku?: string; qty?: number; unitCost?: number };
const emptyLine = (): LineDraft => ({});

/* ---------- normalize ---------- */
function normalizeLines(type: BatchType, lines: LineDraft[]): ReqCreateBatchLine[] {
  return lines
    .map((l): ReqCreateBatchLine => {
      const out: ReqCreateBatchLine = { qty: Number(l.qty ?? 0) };
      if (typeof l.bookId === "number" && Number.isFinite(l.bookId)) out.bookId = l.bookId;
      if (typeof l.sku === "string" && l.sku.trim()) out.sku = l.sku.trim();
      if (typeof l.unitCost === "number" && Number.isFinite(l.unitCost)) out.unitCost = l.unitCost;
      return out;
    })
    .filter((l) => {
      const hasKey = l.bookId !== undefined || (l.sku ?? "") !== "";
      const qtyOk = Number.isFinite(l.qty) && (l.qty ?? 0) > 0;
      const costOk = type === "INBOUND" ? l.unitCost !== undefined && (l.unitCost ?? 0) > 0 : true;
      return hasKey && qtyOk && costOk;
    });
}

/* ---------- page ---------- */
export default function NewBatchPage(): ReactElement {
  const [type, setType] = useState<BatchType>("INBOUND");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  function updateLine<K extends keyof LineDraft>(idx: number, key: K, value: LineDraft[K]) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const next: LineDraft = { ...l };
        const empty = value === undefined || (typeof value === "string" && value.trim() === "");
        if (empty) delete next[key];
        else (next as Record<K, LineDraft[K]>)[key] = value;
        return next;
      })
    );
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: ReqCreateBatch) => createBatch(payload),
    onSuccess: (res) => {
      toast.custom(
        () => (
          <div className="pointer-events-auto flex w-[320px] items-start gap-3 rounded-2xl border border-emerald-200/60 bg-white/80 p-4 shadow-lg backdrop-blur">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-700">Successful</div>
              <div className="mt-0.5 text-[13px] text-slate-600">
                Batch <span className="font-mono">{res.code}</span> đã được tạo.
              </div>
            </div>
          </div>
        ),
        { duration: 2200 }
      );
      setReason(""); setNote(""); setLines([emptyLine()]);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Tạo batch thất bại";
      toast.custom(
        () => (
          <div className="pointer-events-auto flex w-[320px] items-start gap-3 rounded-2xl border border-rose-200/60 bg-white/90 p-4 shadow-lg backdrop-blur">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-rose-100">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-rose-700">Failed</div>
              <div className="mt-0.5 text-[13px] text-slate-600">{msg}</div>
            </div>
          </div>
        ),
        { duration: 2800 }
      );
    },
  });

  const submit = () => {
    const finalLines = normalizeLines(type, lines);
    if (finalLines.length === 0) return toast.error("Vui lòng nhập đầy đủ thông tin.");
    if (type === "INBOUND" && finalLines.some((l) => l.unitCost === undefined)) {
      return toast.error("INBOUND bắt buộc khai báo Unit Cost cho mọi dòng.");
    }
    mutate({
      type,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      lines: finalLines,
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Warehouse / New Batch" />

      {/* header */}
      <div className="space-y-4 rounded-2xl border bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as BatchType)}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">INBOUND</SelectItem>
                <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Purchase, sell, damage…" />
          </div>

          <div>
            <label className="text-sm font-medium">Note</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          </div>
        </div>
      </div>

      {/* lines */}
      <div className="relative z-[1] overflow-visible rounded-2xl border bg-white/70 shadow-sm backdrop-blur">
        <div className="relative z-[1] overflow-x-auto overflow-visible">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50/70">
            <tr className="text-left [&>th]:px-3 [&>th]:py-2.5">
              <th className="w-[420px]">Book ID / SKU</th>
              <th className="w-32">Quantity</th>
              <th className="w-40">Unit Cost{type === "INBOUND" ? "" : " (optional)"}</th>
              <th />
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/40">
            {lines.map((line, idx) => {
              return (
                <tr key={idx} className="border-b [&>td]:px-3 [&>td]:py-2.5">
                  <td className="relative z-[2] w-[520px]">
                    <BatchSearchBox
                      value={line.sku ?? (typeof line.bookId == "number" ? String(line.bookId) : "")}
                      onChange={(text) => {
                        const t = text.trim();
                        if (/^\d+$/.test(t)) {
                          updateLine(idx, "bookId", t === "" ? undefined : Number(t));
                          updateLine(idx, "sku", undefined);
                        } else {
                          updateLine(idx, "sku", t === "" ? undefined : t);
                          updateLine(idx, "bookId", undefined);
                        }
                      }}
                      onPick={(row) => {
                        updateLine(idx, "bookId", row.bookId);
                        updateLine(idx, "sku", row.sku);
                      }}
                      placeholder="ID: 123 hoặc TSHK-CCCD-01"
                    />
                  </td>

                  <td>
                    <Input
                      type="number"
                      value={line.qty ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        updateLine(idx, "qty", v === "" ? undefined : Number(v));
                      }}
                      placeholder="10, 20,…"
                      required
                    />
                  </td>

                  <td>
                    <Input
                      type="number"
                      value={line.unitCost ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        updateLine(idx, "unitCost", v === "" ? undefined : Number(v));
                      }}
                      placeholder={type === "INBOUND" ? "required" : "optional"}
                    />
                  </td>

                  <td className="w-20 text-right">
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeLine(idx)} title="Remove line">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="outline" type="button" onClick={addLine} className="order-1">
            <Plus className="mr-2 h-4 w-4" /> Add line
          </Button>
          <Button type="button" onClick={submit} disabled={isPending} className="order-2">
            {isPending ? "Processing…" : "Create batch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
