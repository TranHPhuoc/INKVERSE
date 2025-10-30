// src/pages/admin/NewBatchPage.tsx
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

/* ---------------- Types & helpers ---------------- */
type LineDraft = {
  bookId?: number;
  sku?: string;
  qty?: number;
  unitCost?: number;
};

const emptyLine = (): LineDraft => ({});

function normalizeLines(type: BatchType, lines: LineDraft[]): ReqCreateBatchLine[] {
  return lines
    .map((l): ReqCreateBatchLine => {
      const base: ReqCreateBatchLine = { qty: Number(l.qty ?? 0) };

      // bookId
      if (l.bookId !== undefined && Number.isFinite(l.bookId)) base.bookId = Number(l.bookId);

      // sku
      const sku = (l.sku ?? "").trim();
      if (sku) base.sku = sku;

      // unitCost
      if (l.unitCost !== undefined && Number.isFinite(l.unitCost)) {
        base.unitCost = Number(l.unitCost);
      }

      return base;
    })
    .filter((l) => {
      const hasKey = l.bookId !== undefined || (l.sku ?? "") !== "";
      const qtyOk = Number.isFinite(l.qty) && (l.qty ?? 0) > 0;
      const costOk = type === "INBOUND" ? l.unitCost !== undefined && (l.unitCost ?? 0) > 0 : true;
      return hasKey && qtyOk && costOk;
    });
}

/* ---------------- Component ---------------- */
export default function NewBatchPage(): ReactElement {
  const [type, setType] = useState<BatchType>("INBOUND");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);

  const addLine = (): void => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number): void => setLines((prev) => prev.filter((_, i) => i !== idx));

  function updateLine<K extends keyof LineDraft>(idx: number, key: K, value: LineDraft[K]): void {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
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
      setReason("");
      setNote("");
      setLines([emptyLine()]);
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

  const submit = (): void => {
    const finalLines = normalizeLines(type, lines);

    if (finalLines.length === 0) {
      toast.error("Vui lòng nhập ít nhất 1 dòng hợp lệ (bookId/sku, qty > 0).");
      return;
    }
    if (type === "INBOUND" && finalLines.some((l) => l.unitCost === undefined)) {
      toast.error("INBOUND bắt buộc khai báo Unit Cost cho mọi dòng.");
      return;
    }

    const payload: ReqCreateBatch = {
      type,
      ...(reason.trim() ? { reason: reason.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      lines: finalLines,
    };

    mutate(payload);
  };

  /* ---------------- Render ---------------- */
  return (
    <div className="space-y-4">
      <PageHeader title="Warehouse / New Batch" />

      {/* Form header */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm space-y-4">
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

      {/* Lines */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/70 border-b">
            <tr className="[&>th]:py-2.5 [&>th]:px-3 text-left">
              <th>Book ID</th>
              <th>SKU</th>
              <th>Qty *</th>
              <th>Unit Cost{type === "INBOUND" ? " *" : ""}</th>
              <th />
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/40">
            {lines.map((line, idx) => (
              <tr key={idx} className="[&>td]:py-2.5 [&>td]:px-3 border-b">
                <td className="w-40">
                  <Input
                    inputMode="numeric"
                    value={line.bookId ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateLine(idx, "bookId", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    placeholder="e.g. 123"
                  />
                </td>
                <td className="w-56">
                  <Input
                    value={line.sku ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateLine(idx, "sku", e.target.value.trim() === "" ? undefined : e.target.value)
                    }
                    placeholder="e.g. BK-001-A"
                  />
                </td>
                <td className="w-32">
                  <Input
                    type="number"
                    value={line.qty ?? ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const v = e.target.value;
                      updateLine(idx, "qty", v === "" ? undefined : Number(v));
                    }}
                    placeholder="e.g. 10"
                    required
                  />
                </td>
                <td className="w-40">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => removeLine(idx)}
                    title="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 p-3">
          <Button variant="outline" type="button" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" />
            Add line
          </Button>

          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? "Processing…" : "Create batch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
