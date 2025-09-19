import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
  page: number; // 1-based
  totalPages: number;
  onChange: (p: number) => void;

  siblingCount?: number; // số trang kề 2 bên (mặc định 1)
  boundaryCount?: number; // số trang sát biên (mặc định 1)
  className?: string;

  /** tự cuộn lên đầu list khi đổi trang */
  autoScrollTop?: boolean;

  /** selector hoặc ref tới container cần cuộn */
  scrollTarget?: string | React.RefObject<HTMLElement | null>;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  boundaryCount = 1,
  className,
  autoScrollTop = true,
  scrollTarget,
}: Props) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (p: number) => {
    const next = clamp(p, 1, totalPages);
    if (next === page) return;

    onChange(next);

    if (autoScrollTop) {
      const el: HTMLElement | null =
        typeof scrollTarget === "string"
          ? (document.querySelector(scrollTarget) as HTMLElement | null)
          : (scrollTarget?.current ?? null);

      const top = (el?.getBoundingClientRect().top ?? 0) + window.scrollY - 12;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const items = useMemo<(number | "...")[]>(() => {
    const result: (number | "...")[] = [];

    const add = (v: number | "...") => result.push(v);

    const left = Math.max(1, page - siblingCount);
    const right = Math.min(totalPages, page + siblingCount);

    // left boundary
    for (let i = 1; i <= Math.min(boundaryCount, totalPages); i++) add(i);

    // left ellipsis
    if (left > boundaryCount + 1) add("...");

    // middle
    for (
      let i = Math.max(left, boundaryCount + 1);
      i <= Math.min(right, totalPages - boundaryCount);
      i++
    ) {
      add(i);
    }

    // right ellipsis
    if (right < totalPages - boundaryCount) add("...");

    // right boundary
    for (let i = Math.max(totalPages - boundaryCount + 1, 1); i <= totalPages; i++) add(i);

    // unique + giữ thứ tự (phòng khi totalPages nhỏ)
    return result.filter((v, i, a) => a.indexOf(v) === i);
  }, [page, totalPages, siblingCount, boundaryCount]);

  const Btn = ({
    disabled,
    onClick,
    children,
    "aria-label": ariaLabel,
  }: {
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded border bg-white px-3 disabled:opacity-50"
    >
      {children}
    </button>
  );

  return (
    <div className={`mt-6 flex items-center justify-center gap-1 ${className ?? ""}`}>
      <Btn disabled={page === 1} onClick={() => go(1)} aria-label="Trang đầu">
        <ChevronsLeft className="h-4 w-4" />
      </Btn>
      <Btn disabled={page === 1} onClick={() => go(page - 1)} aria-label="Trang trước">
        <ChevronLeft className="h-4 w-4" />
      </Btn>

      {items.map((it, idx) =>
        it === "..." ? (
          <span key={`e-${idx}`} className="px-2 text-gray-500">
            …
          </span>
        ) : (
          <button
            key={it}
            type="button"
            onClick={() => go(it)}
            aria-current={it === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded border px-3 ${
              it === page ? "bg-black text-white" : "bg-white hover:bg-gray-50"
            }`}
          >
            {it}
          </button>
        ),
      )}

      <Btn disabled={page === totalPages} onClick={() => go(page + 1)} aria-label="Trang sau">
        <ChevronRight className="h-4 w-4" />
      </Btn>
      <Btn disabled={page === totalPages} onClick={() => go(totalPages)} aria-label="Trang cuối">
        <ChevronsRight className="h-4 w-4" />
      </Btn>
    </div>
  );
}
