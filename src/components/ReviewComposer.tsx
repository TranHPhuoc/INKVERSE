import { useEffect, useState } from "react";
import { myRating, upsertRating, type ResRating } from "../services/rating";
import { useAuth } from "../context/AuthContext";

type Props = {
  bookId: number;
  /** Mặc định true: nếu đã có đánh giá → ẩn toàn bộ composer */
  hiddenWhenRated?: boolean;
  /** gọi sau khi POST thành công (để cha reload list/summary) */
  onSubmitted?: () => void;
};

export default function ReviewComposer({ bookId, hiddenWhenRated = true, onSubmitted }: Props) {
  const { isAuthenticated } = useAuth();
  const [mine, setMine] = useState<ResRating | null>(null);
  const [score, setScore] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // lấy đánh giá của mình để quyết định ẩn/hiện
  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !bookId) {
      setMine(null);
      return;
    }
    (async () => {
      try {
        setError(null);
        const r = await myRating(bookId);
        if (!active) return;
        setMine(r ?? null);
        setScore(r?.score ?? 5);
        setContent(r?.content ?? "");
      } catch {
        if (active) setError("Không tải được đánh giá của bạn");
      }
    })();
    return () => {
      active = false;
    };
  }, [bookId, isAuthenticated]);

  // nếu đã có đánh giá và yêu cầu ẩn → return null
  if (!isAuthenticated) {
    return (
      <div className="text-sm text-gray-500">
        Chỉ có thành viên mới có thể viết nhận xét. Vui lòng{" "}
        <a className="text-blue-600 hover:underline" href="/dang-nhap">
          đăng nhập
        </a>
        .
      </div>
    );
  }
  if (hiddenWhenRated && mine) return null;

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      const s = Math.max(1, Math.min(5, Number(score) || 0));
      await upsertRating(bookId, { score: s, content: content.trim() });

      // Reset form ngay sau khi gửi + thông báo cha reload
      setScore(5);
      setContent("");
      onSubmitted?.();
    } catch {
      setError("Không gửi được đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border p-4">
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <div className="text-sm text-gray-700">Đánh giá của bạn</div>

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
        rows={4}
        placeholder="Chia sẻ cảm nhận của bạn…"
        className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-yellow-400"
      />

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Gửi đánh giá
        </button>
      </div>
    </div>
  );
}
