import { useState } from "react";
import { motion } from "framer-motion";
import { toggleFavorite } from "../services/favorite";
import { useAuth } from "../context/useAuth";
import LoginPrompt from "./LoginPromptModal";
import { applyFavoriteToggle } from "../store/favorite-store";

type Props = {
  bookId: number;
  initialLiked?: boolean;
  initialCount?: number;
  size?: number;
  className?: string;
  onChange?: (liked: boolean, count: number) => void;
  onToggle?: (liked: boolean, count: number) => void;
  hideZero?: boolean;
  disabled?: boolean;
};

export default function FavoriteHeart({
  bookId,
  initialLiked = false,
  initialCount = 0,
  size = 18,
  className = "",
  onChange,
  onToggle, // ✅ nhận prop
  hideZero = false,
  disabled = false,
}: Props) {
  const { isAuthenticated } = useAuth();

  const [liked, setLiked] = useState<boolean>(!!initialLiked);
  const [count, setCount] = useState<number>(Math.max(0, Number(initialCount) || 0));
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  async function handleToggle() {
    if (!isAuthenticated) {
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
    if (loading || disabled) return;

    setLoading(true);

    const prevLiked = liked;
    const prevCount = count;

    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setCount(nextCount);
    onToggle?.(nextLiked, nextCount);
    onChange?.(nextLiked, nextCount);

    try {
      const serverLiked = await toggleFavorite(bookId);

      if (serverLiked !== nextLiked) {
        const corrected = Math.max(0, prevCount + (serverLiked ? 1 : -1));
        setLiked(serverLiked);
        setCount(corrected);
        onToggle?.(serverLiked, corrected);
        onChange?.(serverLiked, corrected);
      }

      applyFavoriteToggle(bookId, serverLiked);
      window.dispatchEvent(new CustomEvent("favorite:ids-updated"));
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
      onToggle?.(prevLiked, prevCount);
      onChange?.(prevLiked, prevCount);
    } finally {
      setLoading(false);
    }
  }

  const showCount = !(hideZero && count === 0);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 select-none ${className}`}
        aria-pressed={liked}
        aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        title={liked ? "Bỏ yêu thích" : "Yêu thích"}
        disabled={loading || disabled}
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

        {showCount && (
          <span className="translate-y-[1px] text-[11px] leading-none font-semibold tabular-nums">
            {count}
          </span>
        )}
      </button>

      {/* Modal yêu cầu đăng nhập */}
      <LoginPrompt open={showPrompt} onClose={() => setShowPrompt(false)} />
    </>
  );
}
