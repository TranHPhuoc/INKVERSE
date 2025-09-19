import { useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cancelMyOrder } from "../services/order";
import type { ResOrderDetail } from "../types/order";

type Props = {
  orderCode: string;
  onDone?: (updated?: ResOrderDetail) => void;
  triggerClassName?: string;
  disabled?: boolean;
};

const DEFAULT_REASONS = [
  "Đặt nhầm sản phẩm",
  "Muốn thay đổi phương thức thanh toán",
  "Thời gian giao hàng dự kiến quá lâu",
  "Tìm được nơi có giá tốt hơn",
  "Thay đổi nhu cầu / không còn cần nữa",
  "Thay đổi địa chỉ/không có người nhận",
] as const;

function getErrMessage(err: unknown, fallback = "Huỷ đơn thất bại"): string {
  if (err && typeof err === "object") {
    const e = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return e.response?.data?.message ?? e.message ?? fallback;
  }
  return fallback;
}

export default function CancelOrderDialog({
  orderCode,
  onDone,
  triggerClassName = "",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reasonText = useMemo(() => {
    const base = picked.join("; ");
    const extra = other.trim();
    return [base, extra].filter(Boolean).join("; ");
  }, [picked, other]);

  const toggle = (r: string) =>
    setPicked((old) => (old.includes(r) ? old.filter((x) => x !== r) : [...old, r]));

  async function submit() {
    setErr(null);
    if (!reasonText) {
      setErr("Vui lòng chọn ít nhất 1 lý do hoặc nhập nội dung.");
      return;
    }
    try {
      setLoading(true);
      const updated = await cancelMyOrder(orderCode, reasonText);
      setOpen(false);
      setPicked([]);
      setOther("");
      onDone?.(updated);
    } catch (e: unknown) {
      setErr(getErrMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50" +
          triggerClassName
        }
        title="Huỷ đơn hàng"
      >
        Huỷ đơn hàng
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !loading && setOpen(false)}
          />
          {/* modal */}
          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Huỷ đơn #{orderCode}</h3>
              <button
                onClick={() => !loading && setOpen(false)}
                className="cursor-pointer rounded-lg p-1 hover:bg-gray-100"
                title="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-gray-600">
              Vì sao bạn muốn huỷ đơn? (chọn một hoặc nhiều)
            </p>

            <div className="grid grid-cols-1 gap-2">
              {DEFAULT_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={picked.includes(r)}
                    onChange={() => toggle(r)}
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}

              <div className="mt-2">
                <div className="mb-1 text-sm text-gray-600">Khác (ghi rõ):</div>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Nhập lý do khác..."
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                />
              </div>
            </div>

            {err && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-xl border px-3.5 py-2.5 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-600 bg-rose-600 px-3.5 py-2.5 text-white hover:brightness-95 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
