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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
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

// BookID / SKU
function parseIdOrSku(raw: string): Pick<LineDraft, "bookId" | "sku"> {
  const s = raw.trim();
  if (!s) return {};
  if (/^\d+$/.test(s)) return { bookId: Number(s) };
  return { sku: s.toUpperCase() };
}

function normalizeLines(type: BatchType, lines: LineDraft[]): ReqCreateBatchLine[] {
  return lines
    .map((l): ReqCreateBatchLine => {
      const out: ReqCreateBatchLine = { qty: Number(l.qty ?? 0) };

      if (typeof l.bookId === "number" && Number.isFinite(l.bookId)) {
        out.bookId = l.bookId;
      }
      if (typeof l.sku === "string" && l.sku.trim() !== "") {
        out.sku = l.sku.trim();
      }
      if (typeof l.unitCost === "number" && Number.isFinite(l.unitCost)) {
        out.unitCost = l.unitCost;
      }
      return out;
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
  const removeLine = (idx: number): void =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

// Thay thế hàm updateLineNext hiện tại
  function updateLineNext<K extends keyof LineDraft>(
    idx: number,
    key: K,
    value: LineDraft[K]
  ): void {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;

        // Bản sao kiểu an toàn
        const next: LineDraft = { ...l };

        // Nếu giá trị rỗng (undefined hoặc string rỗng) → xóa key
        const isEmpty =
          value === undefined || (typeof value === "string" && value.trim() === "");

        if (isEmpty) {
          // key là keyof LineDraft nên delete hợp lệ
          delete next[key];
        } else {
          // Gán có kiểu: giới hạn chỉ key K với giá trị LineDraft[K]
          (next as Record<K, LineDraft[K]>)[key] = value;
        }
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
      toast.error("Vui lòng nhập ít nhất 1 dòng hợp lệ (bookId/sku, quantity > 0).");
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
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INBOUND">INBOUND</SelectItem>
                <SelectItem value="OUTBOUND">OUTBOUND</SelectItem>
                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Purchase, sell, damage…"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Note</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/70 border-b">
            <tr className="[&>th]:py-2.5 [&>th]:px-3 text-left">
              <th className="w-[420px]">Book ID / SKU</th>
              <th className="w-32">Quantity</th>
              <th className="w-40">Unit Cost{type === "INBOUND" ? "" : " (optional)"}</th>
              <th />
            </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/40">
            {lines.map((line, idx) => {
              const idOrSku = line.bookId !== undefined ? String(line.bookId) : (line.sku ?? "");
              return (
                <tr key={idx} className="[&>td]:py-2.5 [&>td]:px-3 border-b">
                  <td>
                    <Input
                      value={idOrSku}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const raw = e.target.value;
                        setLines((prev) =>
                          prev.map((l, i) => {
                            if (i !== idx) return l;
                            const next: LineDraft & Record<string, unknown> = { ...l };
                            delete next.bookId;
                            delete next.sku;
                            if (raw.trim() !== "") {
                              const parsed = parseIdOrSku(raw);
                              if (parsed.bookId !== undefined) next.bookId = parsed.bookId;
                              if (parsed.sku !== undefined) next.sku = parsed.sku;
                            }
                            return next;
                          })
                        );
                      }}
                      placeholder="VD: 123 or TSHK-CCCD-01"
                    />
                  </td>

                  <td>
                    <Input
                      type="number"
                      value={line.qty ?? ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        updateLineNext(idx, "qty", v === "" ? undefined : Number(v));
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
                        updateLineNext(idx, "unitCost", v === "" ? undefined : Number(v));
                      }}
                      placeholder={type === "INBOUND" ? " " : "optional"}
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
              );
            })}
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
