import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

type Props = {
    page: number;          // 1-based
    totalPages: number;
    onChange: (p: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
    if (!totalPages || totalPages <= 1) return null;

    const go = (p: number) => onChange(Math.max(1, Math.min(totalPages, p)));

    const pages: number[] = [];
    const delta = 2; // số nút 2 bên current
    let start = Math.max(1, page - delta);
    let end = Math.min(totalPages, page + delta);
    if (end - start < delta * 2) {
        if (start === 1) end = Math.min(totalPages, start + delta * 2);
        else if (end === totalPages) start = Math.max(1, end - delta * 2);
    }
    for (let i = start; i <= end; i++) pages.push(i);

    return (
        <div className="mt-6 flex items-center justify-center gap-1">
            <button
                className="h-9 w-9 inline-flex items-center justify-center rounded border bg-white disabled:opacity-50"
                onClick={() => go(1)} disabled={page === 1} aria-label="Trang đầu"
            >
                <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
                className="h-9 w-9 inline-flex items-center justify-center rounded border bg-white disabled:opacity-50"
                onClick={() => go(page - 1)} disabled={page === 1} aria-label="Trang trước"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {start > 1 && (
                <>
                    <button className="h-9 min-w-9 px-3 rounded border bg-white" onClick={() => go(1)}>1</button>
                    {start > 2 && <span className="px-1">…</span>}
                </>
            )}

            {pages.map(p => (
                <button
                    key={p}
                    className={`h-9 min-w-9 px-3 rounded border ${p === page ? "bg-black text-white" : "bg-white"}`}
                    onClick={() => go(p)}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="px-1">…</span>}
                    <button className="h-9 min-w-9 px-3 rounded border bg-white" onClick={() => go(totalPages)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button
                className="h-9 w-9 inline-flex items-center justify-center rounded border bg-white disabled:opacity-50"
                onClick={() => go(page + 1)} disabled={page === totalPages} aria-label="Trang sau"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
            <button
                className="h-9 w-9 inline-flex items-center justify-center rounded border bg-white disabled:opacity-50"
                onClick={() => go(totalPages)} disabled={page === totalPages} aria-label="Trang cuối"
            >
                <ChevronsRight className="h-4 w-4" />
            </button>
        </div>
    );
}
