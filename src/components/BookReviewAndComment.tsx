import { useCallback, useState } from "react";
import RatingSummaryPanel from "./RatingSummaryPanel";
import ReviewList from "./ReviewList";
import ReviewComposer from "./ReviewComposer";
import CommentThread from "./CommentThread";
import ErrorBoundary from "./ErrorBoundary";

export default function BookReviewAndComment({ bookId }: { bookId: number }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const refresh = useCallback(() => setReloadKey((v) => v + 1), []);

  return (
    <section className="mt-8 space-y-6">
      <ErrorBoundary
        fallback={<div className="text-sm text-rose-600">Không tải được tóm tắt đánh giá.</div>}
      >
        <RatingSummaryPanel key={`sum-${reloadKey}`} bookId={bookId} />
      </ErrorBoundary>

      {/* Ẩn composer nếu user đã có đánh giá; khi bấm “Sửa” từ list thì composer vẫn ẩn,
          việc chỉnh sửa diễn ra inline ngay trên card đánh giá. */}
      <ErrorBoundary
        fallback={<div className="text-sm text-rose-600">Không tải được khung viết đánh giá.</div>}
      >
        <ReviewComposer
          key={`composer-${reloadKey}`}
          bookId={bookId}
          hiddenWhenRated
          onSubmitted={() => {
            refresh();
            // bảo đảm composer ẩn, list reload để hiện card mới/đã cập nhật
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary
        fallback={<div className="text-sm text-rose-600">Không tải được danh sách đánh giá.</div>}
      >
        <ReviewList
          key={`list-${reloadKey}`}
          bookId={bookId}
          editingId={editingReviewId}
          onRequestEdit={(id) => setEditingReviewId(id)}
          onCancelEdit={() => setEditingReviewId(null)}
          onSaved={() => {
            setEditingReviewId(null);
            refresh();
          }}
          onDeleted={() => {
            setEditingReviewId(null);
            refresh();
          }}
        />
      </ErrorBoundary>

      <ErrorBoundary
        fallback={<div className="text-sm text-rose-600">Không tải được bình luận.</div>}
      >
        <CommentThread bookId={bookId} />
      </ErrorBoundary>
    </section>
  );
}
