import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upsertRating, myRating } from "../services/rating";

type Props = {
  bookId: number;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function ReviewModal({ bookId, open, onClose, onSubmitted }: Props) {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookId) return;
    let active = true;
    myRating(bookId)
      .then((r) => {
        if (!active || !r) return;
        setScore(r.score ?? 5);
        setContent(r.content ?? "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, bookId]);

  const submit = async () => {
    try {
      setSubmitting(true);
      setErr(null);
      await upsertRating(bookId, {
        score: Math.max(0.5, Math.min(5, Number(score) || 0)),
        content: content.trim(),
      });
      onSubmitted?.();
      onClose();
    } catch {
      setErr("Không gửi được đánh giá, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayScore = hoverScore ?? score;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    setHoverScore(i + half);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Viết đánh giá</h3>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            {err && <div className="mb-3 text-sm text-rose-600">{err}</div>}

            {/* Rating */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex"
                  onMouseLeave={() => setHoverScore(null)}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const fill =
                      displayScore >= i + 1
                        ? 1
                        : displayScore >= i + 0.5
                          ? 0.5
                          : 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        onMouseMove={(e) => handleMouseMove(e, i)}
                        onClick={() => setScore(displayScore)}
                        className="relative cursor-pointer text-5xl leading-none"
                        aria-label={`${i + 1} sao`}
                      >
                        <span className="text-gray-300 select-none">★</span>
                        <span
                          className="absolute left-0 top-0 overflow-hidden text-yellow-400 select-none"
                          style={{ width: `${fill * 100}%` }}
                        >
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-500">
                  ({displayScore.toFixed(1)} sao)
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <div className="mb-1 text-sm text-gray-700">Nhận xét</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Chia sẻ cảm nhận của bạn…"
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="cursor-pointer rounded-xl bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Gửi đánh giá
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
