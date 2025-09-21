type Props = { value?: number | string | null; size?: "sm" | "md" };

export default function RatingStars({ value = 0, size = "md" }: Props) {
  // luôn ép số an toàn
  const n = Number(value);
  const safe = Number.isFinite(n) && n > 0 ? n : 0;
  const full = Math.round(Math.max(0, Math.min(5, safe)));

  return (
    <div className={`flex items-center ${size === "sm" ? "gap-0.5" : "gap-1"}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 ${i < full ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}`}
          aria-hidden
        >
          <path d="M10 15.27 15.18 18l-1.64-5.03L18 9.24l-5.19-.04L10 4 7.19 9.2 2 9.24l4.46 3.73L4.82 18 10 15.27z" />
        </svg>
      ))}
      {/* KHÔNG bao giờ gọi toFixed trên undefined */}
      <span className="ml-1 text-sm text-gray-600">{safe.toFixed(1)}</span>
    </div>
  );
}
