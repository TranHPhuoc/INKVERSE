import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { listRatings, deleteRating, upsertRating, type ResRating } from "../services/rating";
import RatingStars from "./RatingStars";
import { useAuth } from "../context/AuthContext";

type Props = {
  bookId: number;
  editingId?: number | null;
  onRequestEdit?: (id: number) => void;
  onCancelEdit?: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
};

export default function ReviewList({
  bookId,
  editingId = null,
  onRequestEdit,
  onCancelEdit,
  onSaved,
  onDeleted,
}: Props) {
  const { user } = useAuth(); // cần user?.id
  const [items, setItems] = useState<ResRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await listRatings(bookId, { page: 0, size: 5, sort: "new" });
      setItems(res.content ?? []);
    } catch {
      setErr("Không tải được đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, [bookId]);

  const canEdit = (r: ResRating) => user?.id === r.userId;

  // inline editor cho card đang sửa
  const Editor = ({ r }: { r: ResRating }) => {
    const [score, setScore] = useState(r.score);
    const [content, setContent] = useState(r.content ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const save = async () => {
      try {
        setSubmitting(true);
        setErr(null);
        const s = Math.max(1, Math.min(5, Number(score) || 0));
        await upsertRating(bookId, { score: s, content: content.trim() });
        onSaved?.();
        fetchData();
      } catch {
        setErr("Không lưu được chỉnh sửa");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="mt-2 space-y-2">
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center gap-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScore(i + 1)}
                aria-label={`${i + 1} sao`}
              >
                <span className={i < score ? "text-yellow-400" : "text-gray-300"}>★</span>
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">({score} sao)</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Lưu
          </button>
          <button
            onClick={onCancelEdit}
            disabled={submitting}
            className="rounded-lg bg-gray-100 px-3 py-1.5 hover:bg-gray-200 disabled:opacity-60"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  };

  const Kebab = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative">
        <button
          className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
          aria-label="Thao tác"
          onClick={() => setOpen((v) => !v)}
        >
          ⋮
        </button>
        {open && (
          <div
            className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border bg-white shadow"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Chỉnh sửa
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Xóa
            </button>
          </div>
        )}
      </div>
    );
  };

  const onDelete = async (id: number) => {
    try {
      await deleteRating(id);
      onDeleted?.();
      fetchData();
    } catch {
      // có thể show toast
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Đang tải đánh giá…</div>;
  if (err) return <div className="text-sm text-rose-600">{err}</div>;

  return (
    <div className="space-y-4">
      {items.map((r) => {
        const mine = canEdit(r);
        const isEditing = editingId === r.id && mine;
        return (
          <div key={r.id} className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-800">{r.userName}</span>
                  <span className="text-gray-500">
                    · {dayjs(r.createdAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                </div>
                <div className="mt-1">
                  <RatingStars value={r.score} />
                </div>
              </div>

              {/* nút 3 chấm chỉ hiện với đánh giá của chính mình */}
              {mine && !isEditing && (
                <Kebab onEdit={() => onRequestEdit?.(r.id)} onDelete={() => onDelete(r.id)} />
              )}
            </div>

            {!isEditing && r.content && <div className="mt-2 text-gray-800">{r.content}</div>}
            {isEditing && <Editor r={r} />}
          </div>
        );
      })}
      {items.length === 0 && <div className="text-sm text-gray-500">Chưa có đánh giá.</div>}
    </div>
  );
}
