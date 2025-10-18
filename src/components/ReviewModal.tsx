import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { upsertRating, myRating } from "../services/rating";

type Props = {
  bookId: number;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

const STAR_LABELS: Record<number, { bold: string; text: string }> = {
  1: { bold: "Tệ.", text: "Gần như không hiểu/nản với chất lượng." },
  2: { bold: "Chưa tốt.", text: "Hiểu một ít, còn nhiều chỗ khó chịu." },
  3: { bold: "Ổn.", text: "Hiểu đủ ý chính, có thể cải thiện thêm." },
  4: { bold: "Rất tốt.", text: "Gần như hoàn hảo, trải nghiệm mượt." },
  5: { bold: "Tuyệt vời.", text: "Mình hiểu hết và cực kỳ hài lòng." },
};

const clampStar = (n: number) => Math.max(1, Math.min(5, Math.round(Number(n) || 0)));

export default function ReviewModal({ bookId, open, onClose, onSubmitted }: Props) {
  const [score, setScore] = useState<number>(5);
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
        setScore(clampStar(r.score ?? 5));
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
        score: clampStar(score),
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
  const label = STAR_LABELS[displayScore];

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
              <div className="flex items-center gap-2" onMouseLeave={() => setHoverScore(null)}>
                <div className="flex" role="radiogroup" aria-label="Chọn số sao">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starIndex = i + 1;
                    const filled = displayScore >= starIndex;
                    return (
                      <motion.button
                        key={i}
                        type="button"
                        role="radio"
                        aria-checked={score === starIndex}
                        aria-label={`${starIndex} sao`}
                        onMouseEnter={() => setHoverScore(starIndex)}
                        onFocus={() => setHoverScore(starIndex)}
                        onBlur={() => setHoverScore(null)}
                        onClick={() => setScore(starIndex)}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 450, damping: 22 }}
                        className="relative cursor-pointer p-1"
                      >
                        {/* SVG star with animated fill + glow */}
                        <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
                          <defs>
                            <filter id="rg-glow" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
                              <feMerge>
                                <feMergeNode in="b" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          {/* outline */}
                          <path
                            d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 20l1.5-6.6-5-4.3 6.6-.6L12 2.5z"
                            className="fill-gray-200 stroke-gray-300"
                            strokeWidth={1.2}
                          />
                          {/* animated fill */}
                          <motion.path
                            d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 20l1.5-6.6-5-4.3 6.6-.6L12 2.5z"
                            initial={false}
                            animate={{
                              fill: filled ? "#F59E0B" : "transparent",
                              stroke: filled ? "#F59E0B" : "transparent",
                              filter: filled ? "url(#rg-glow)" : "none",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 18 }}
                          />
                        </svg>
                      </motion.button>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-500">({displayScore} sao)</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={displayScore}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="mt-2 text-[15px]"
                >
                  {label && (
                    <>
                      <span
                        className={
                          "font-semibold " +
                          (displayScore >= 4 ? "text-emerald-600" : "text-rose-600")
                        }
                      >
                        {label.bold + " "}
                      </span>
                      <span className="text-gray-700">{label.text}</span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="mb-4">
              <div className="mb-1 text-sm text-gray-700">Nhận xét</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Chia sẻ cảm nhận của bạn…"
                className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
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
