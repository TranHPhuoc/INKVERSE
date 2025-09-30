import { useCallback, useEffect, useState } from "react";
import RatingSummaryPanel from "./RatingSummaryPanel";
import ReviewList from "./ReviewList";
import CommentThread from "./CommentThread";
import ErrorBoundary from "./ErrorBoundary";
import { PenLine } from "lucide-react";

type TabId = "comments" | "reviews";

export default function BookReviewAndComment({
  bookId,
  canWrite,
  onOpenWrite,
  refreshKey,
}: {
  bookId: number;
  canWrite?: boolean;
  onOpenWrite?: () => void;
  refreshKey?: number;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("reviews");

  const refresh = useCallback(() => setReloadKey((v) => v + 1), []);

  useEffect(() => {
    if (refreshKey !== undefined) {
      setReloadKey((v) => v + 1);
    }
  }, [refreshKey]);

  return (
    <section className="mt-8 space-y-6">
      {/* Tabs */}
      <div className="flex gap-6 border-b">
        {[
          { id: "reviews", label: "Đánh giá" },
          { id: "comments", label: "Bình luận" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabId)}
            className={`relative cursor-pointer px-3 pb-2 text-xl font-semibold transition-colors ${
              activeTab === t.id ? "text-rose-600" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t.label}
            {activeTab === t.id && (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-rose-600" />
            )}
          </button>
        ))}
      </div>

      {/* Nội dung tab */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
            {/* LEFT: Tổng quan đánh giá */}
            <div className="h-full rounded-2xl border border-gray-200 bg-white/90 shadow-sm ring-1 ring-white/50">
              <div className="border-b px-4 py-3 text-xl font-semibold text-gray-800">
                Tổng quan đánh giá
              </div>
              <div className="p-4">
                <ErrorBoundary
                  fallback={
                    <div className="text-sm text-rose-600">Không tải được tóm tắt đánh giá.</div>
                  }
                >
                  <RatingSummaryPanel key={`sum-${reloadKey}`} bookId={bookId} />
                </ErrorBoundary>
              </div>
            </div>

            {/* RIGHT: chỉ còn nút Viết đánh giá ở giữa */}
            <div className="flex h-full items-center justify-center rounded-2xl border border-gray-200 bg-white/90 shadow-sm ring-1 ring-white/50">
              <button
                onClick={onOpenWrite}
                disabled={!canWrite}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium shadow-sm ${
                  canWrite
                    ? "cursor-pointer bg-rose-600 text-white hover:bg-rose-500"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
                title={canWrite ? "Viết đánh giá" : "Bạn đã đánh giá rồi hoặc chưa mua sản phẩm"}
              >
                <PenLine className="h-5 w-5" />
                Viết đánh giá
              </button>
            </div>
          </div>

          {/* Danh sách đánh giá */}
          <ErrorBoundary
            fallback={
              <div className="text-sm text-rose-600">Không tải được danh sách đánh giá.</div>
            }
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
        </div>
      )}

      {activeTab === "comments" && (
        <ErrorBoundary
          fallback={<div className="text-sm text-rose-600">Không tải được bình luận.</div>}
        >
          <CommentThread key={`cmt-${reloadKey}`} bookId={bookId} />
        </ErrorBoundary>
      )}
    </section>
  );
}
