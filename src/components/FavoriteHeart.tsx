import { useState } from "react";
import { motion } from "framer-motion";
import { toggleFavorite } from "../services/favorite";
import { useAuth } from "../context/useAuth";
import LoginPrompt from "./LoginPromptModal";
import { applyFavoriteToggle } from "../store/favorite-store";

type Props = {
  bookId: number;
  initialLiked?: boolean;
  initialCount?: number; // nếu undefined -> ẩn số
  size?: number; // px
  className?: string;
  onChange?: (liked: boolean, count: number) => void;
};

export default function FavoriteHeart({
  bookId,
  initialLiked = false,
  initialCount = 0,
  size = 18,
  className = "",
  onChange,
}: Props) {
  const { isAuthenticated } = useAuth();

  const [liked, setLiked] = useState<boolean>(!!initialLiked);
  const [count, setCount] = useState<number>(Math.max(0, Number(initialCount) || 0));
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  async function onToggle() {
    if (!isAuthenticated) {
      // lưu trang hiện tại để quay lại sau đăng nhập
      try {
        localStorage.setItem(
          "redirectAfterLogin",
          window.location.pathname + window.location.search + window.location.hash,
        );
      } catch {
        /**/
      }
      setShowPrompt(true);
      return;
    }
    if (loading) return;

    setLoading(true);

    // optimistic update
    const nextLiked = !liked;
    const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);
    onChange?.(nextLiked, nextCount);

    try {
      const serverLiked = await toggleFavorite(bookId);

      if (serverLiked !== nextLiked) {
        const fixed = Math.max(0, nextCount + (serverLiked ? 1 : -1) * 2);
        setLiked(serverLiked);
        setCount(fixed);
        onChange?.(serverLiked, fixed);
      }

      applyFavoriteToggle(bookId, serverLiked);
      window.dispatchEvent(new CustomEvent("favorite:ids-updated"));
    } catch {
      // rollback
      setLiked(!nextLiked);
      setCount(Math.max(0, count));
      onChange?.(!nextLiked, Math.max(0, count));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 select-none ${className}`}
        aria-pressed={liked}
        aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        title={liked ? "Bỏ yêu thích" : "Yêu thích"}
        disabled={loading}
      >
        <motion.svg
          key={liked ? "liked" : "unliked"}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className={liked ? "text-rose-600" : "text-slate-400"}
          style={{ display: "block" }}
        >
          <path
            d="M12.1 8.64l-.1.1-.11-.11C10.14 6.79 7.1 7.24 6.05 9.29c-.74 1.46-.35 3.3 1 4.37L12 18l4.95-4.34c1.35-1.07 1.74-2.91 1-4.37-1.05-2.05-4.09-2.5-5.85-.65z"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </motion.svg>

        {/* muốn ẩn khi =0 thì đổi thành: {count > 0 && <span>… */}
        <span className="translate-y-[1px] text-[11px] leading-none font-semibold tabular-nums">
          {count}
        </span>
      </button>

      {/* Modal yêu cầu đăng nhập */}
      <LoginPrompt open={showPrompt} onClose={() => setShowPrompt(false)} />
    </>
  );
}
