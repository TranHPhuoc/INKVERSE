// src/components/Admin/StockSearchBox.tsx
import { Search } from "lucide-react";
import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;   // gọi refetch() + setPage(0) ở parent
  className?: string;
  placeholder?: string;
  loading?: boolean;
};

export default function StockSearchBox({
                                         value,
                                         onChange,
                                         onSubmit,
                                         className,
                                         placeholder,
                                         loading,
                                       }: Props) {
  const submit = useCallback(() => onSubmit(), [onSubmit]);

  return (
    <div
      className={`rounded-2xl bg-white/80 p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,.2)] backdrop-blur ${className ?? ""}`}
    >
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-gray-600">Tìm kiếm</label>
          <div className="flex items-center rounded-xl bg-white shadow-inner ring-1 ring-black/5">
            <Search className="mx-3 size-4 opacity-60" />
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={placeholder ?? "Gõ tên sách hoặc SKU…"}
              className="h-11 w-full rounded-xl border-0 bg-transparent px-2 outline-none focus:ring-0"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="h-11 cursor-pointer rounded-xl bg-indigo-600 px-4 text-white transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 active:translate-y-0"
        >
          {loading ? "Đang tìm…" : "Tìm"}
        </button>
      </div>
    </div>
  );
}
