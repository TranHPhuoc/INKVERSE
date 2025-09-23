import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { ThumbsUp } from "lucide-react";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  type ResComment,
} from "../services/comment";
import { useAuth } from "../context/AuthContext";

/* ===== helpers ===== */
function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = dayjs(String(iso));
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "";
}

function Kebab({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="rounded px-2 py-1 text-black hover:bg-gray-100"
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
}

type CommentItemProps = {
  c: ResComment;
  depth?: number;
  canEdit: (c: ResComment) => boolean;
  onReply: (parentId: number) => void;
  onEdited: (id: number, content: string) => Promise<void>;
  onDeleted: (id: number) => Promise<void>;
  onToggleLike: (id: number, currentlyLiked: boolean) => void;
};

function CommentItem({
  c,
  depth = 0,
  canEdit,
  onReply,
  onEdited,
  onDeleted,
  onToggleLike,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.content ?? "");
  const isMine = canEdit(c) || (c as any)?.isMine === true;
  const liked = !!c.likedByMe;
  const likeCount = c.likeCount ?? 0;

  return (
    <div
      className={[
        "space-y-2 rounded-xl bg-white/95 p-3",
        depth > 0 ? "shadow-[inset_0_0_0_1px_rgba(244,63,94,.06)]" : "shadow-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900 transition-colors hover:text-rose-600">
              {c.userName}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">{fmtTime(c.createdAt)}</span>
          </div>
        </div>

        {isMine && !editing && (
          <Kebab onEdit={() => setEditing(true)} onDelete={() => onDeleted(c.id)} />
        )}
      </div>

      {!editing ? (
        <div className="leading-relaxed text-gray-900">{c.content}</div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-xl bg-white/95 p-3 text-[15px] text-gray-900 shadow-sm outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const v = text.trim();
                if (!v) return;
                await onEdited(c.id, v);
                setEditing(false);
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
            >
              Lưu
            </button>
            <button
              onClick={() => {
                setText(c.content ?? "");
                setEditing(false);
              }}
              className="rounded-lg bg-gray-100 px-3 py-1.5 hover:bg-gray-200"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* actions */}
      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
        <button
          onClick={() => onToggleLike(c.id, liked)}
          aria-pressed={liked}
          className={[
            "inline-flex cursor-pointer items-center gap-1 transition-colors",
            liked ? "font-semibold text-blue-600" : "text-gray-600 hover:text-blue-600",
          ].join(" ")}
        >
          <ThumbsUp className="h-4 w-4" strokeWidth={2} fill={liked ? "currentColor" : "none"} />
          <span>Thích</span>
          {!!likeCount && <span className="cursor-pointer text-gray-400">({likeCount})</span>}
        </button>

        <button
          onClick={() => onReply(c.id)}
          className="cursor-pointer font-medium text-gray-600 transition-colors hover:text-rose-600"
        >
          Trả lời
        </button>
      </div>

      {/* replies */}
      {c.children?.length ? (
        <div className="mt-3 space-y-3 pl-5">
          {c.children.map((ch) => (
            <CommentItem
              key={ch.id}
              c={ch}
              depth={depth + 1}
              canEdit={canEdit}
              onReply={onReply}
              onEdited={onEdited}
              onDeleted={onDeleted}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ===== thread ===== */
export default function CommentThread({ bookId }: { bookId: number }) {
  const { isAuthenticated, user } = useAuth();

  const [items, setItems] = useState<ResComment[]>([]);
  const [page] = useState(0);
  const [size] = useState(5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [text, setText] = useState("");

  const canEdit = useCallback(
    (c: ResComment) => {
      const commentUserId = (c as any)?.userId;
      return user?.id != null && commentUserId != null ? user.id === commentUserId : false;
    },
    [user?.id],
  );

  const load = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await listComments(bookId, { page, size, sort: "new" });
      setItems(res.content ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tải được bình luận");
    } finally {
      setLoading(false);
    }
  }, [bookId, page, size]);

  useEffect(() => {
    void load();
  }, [load]);

  // helper: patch 1 comment theo id (đệ quy)
  function patchById(
    list: ResComment[],
    id: number,
    patch: (c: ResComment) => ResComment,
  ): ResComment[] {
    return list.map((c) => {
      if (c.id === id) return patch(c);
      const children = c.children?.length ? patchById(c.children, id, patch) : c.children;
      return children === c.children ? c : { ...c, children };
    });
  }

  const toggleLike = async (id: number, currentlyLiked: boolean) => {
    if (!isAuthenticated) return; // hoặc điều hướng login nếu muốn
    // optimistic UI
    setItems((prev) =>
      patchById(prev, id, (c) => ({
        ...c,
        likedByMe: !currentlyLiked,
        likeCount: Math.max(0, (c.likeCount || 0) + (currentlyLiked ? -1 : 1)),
      })),
    );
    try {
      if (currentlyLiked) {
        await unlikeComment(id);
      } else {
        await likeComment(id);
      }
    } catch {
      // revert nếu lỗi
      setItems((prev) =>
        patchById(prev, id, (c) => ({
          ...c,
          likedByMe: currentlyLiked,
          likeCount: Math.max(0, (c.likeCount || 0) + (currentlyLiked ? 1 : -1)),
        })),
      );
    }
  };

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    try {
      await createComment(bookId, { content: body, ...(replyTo ? { parentId: replyTo } : {}) });
      setText("");
      setReplyTo(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không gửi được bình luận");
    }
  };

  const onEdited = async (id: number, content: string) => {
    try {
      await updateComment(id, { content });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không lưu được chỉnh sửa");
    }
  };

  const onDeleted = async (id: number) => {
    try {
      await deleteComment(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không xóa được bình luận");
    }
  };

  const empty = useMemo(
    () => !loading && (items?.length ?? 0) === 0 && !err,
    [loading, items, err],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold tracking-tight">Bình luận</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-rose-200/80 to-transparent" />
      </div>

      {/* States */}
      {err ? <div className="text-sm text-rose-600">{err}</div> : null}
      {loading ? <div className="text-sm text-gray-500">Đang tải bình luận…</div> : null}

      {/* List */}
      <div className="space-y-4">
        {items.map((c) => (
          <CommentItem
            key={c.id}
            c={c}
            canEdit={canEdit}
            onReply={(pid) => setReplyTo(pid)}
            onEdited={onEdited}
            onDeleted={onDeleted}
            onToggleLike={toggleLike}
          />
        ))}
        {empty && <div className="text-sm text-gray-500">Chưa có bình luận.</div>}
      </div>

      {/* Composer dưới cùng, chữ to & đen, không viền */}
      {isAuthenticated ? (
        <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
          {replyTo && (
            <div className="mb-2 text-sm text-gray-600">
              Đang trả lời bình luận <span className="font-semibold text-gray-800">#{replyTo}</span>{" "}
              <button
                className="ml-2 rounded px-2 py-0.5 text-rose-600 hover:bg-rose-50"
                onClick={() => setReplyTo(null)}
              >
                Hủy
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Viết bình luận…"
            className="w-full rounded-2xl bg-white/95 p-4 text-[15px] text-gray-900 shadow outline-none placeholder:text-gray-400 sm:text-base"
          />
          <div className="mt-3">
            <button
              onClick={submit}
              className="rounded-lg bg-rose-600 px-4 py-2 text-base font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0"
            >
              Gửi bình luận
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Chỉ có thành viên mới có thể viết bình luận. Vui lòng{" "}
          <a href="/login" className="font-semibold text-rose-600 hover:underline">
            đăng nhập
          </a>
          .
        </div>
      )}
    </div>
  );
}
