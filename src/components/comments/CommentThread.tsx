import { useState, useCallback, useEffect } from "react";
import CommentItem, { type ActiveReply } from "./CommentItem";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  type ResComment,
} from "../../services/comment";
import { useAuth } from "../../context/useAuth";

/* ============ KEBAB MENU (CHUNG FILE) ============ */
function Kebab({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="rounded px-2 py-1 text-black hover:bg-gray-200 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 w-40 rounded-md overflow-hidden border bg-white shadow"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Chỉnh sửa
          </button>
          <button
            className="block w-full text-left px-3 py-2 hover:bg-rose-50 text-sm text-rose-600 cursor-pointer"
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


function hasChildren(x: ResComment): x is ResComment & { children: ResComment[] } {
  const v = (x as unknown as { children?: unknown }).children;
  return Array.isArray(v);
}

function insertReply(
  list: ResComment[],
  parentId: number,
  reply: ResComment,
): ResComment[] {
  return list.map((c) => {
    if (c.id === parentId) {
      const children = hasChildren(c) ? c.children : [];
      return { ...c, children: [...children, reply] };
    }
    if (hasChildren(c)) {
      return { ...c, children: insertReply(c.children, parentId, reply) };
    }
    return c;
  });
}

function patchById(
  list: ResComment[],
  id: number,
  patch: (c: ResComment) => ResComment,
): ResComment[] {
  return list.map((c) => {
    if (c.id === id) return patch(c);

    if (hasChildren(c)) {
      const nextKids = patchById(c.children, id, patch);
      if (nextKids !== c.children) return { ...c, children: nextKids };
    }
    return c;
  });
}

/* ============ COMMENT THREAD ============ */

export default function CommentThread({ bookId }: { bookId: number }) {
  const { isAuthenticated, user } = useAuth();

  const [items, setItems] = useState<ResComment[]>([]);
  const [rootText, setRootText] = useState("");
  const [activeReply, setActiveReply] = useState<ActiveReply>(null);
  const [replyText, setReplyText] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canEdit = useCallback(
    (c: ResComment) => c.userId === user?.id,
    [user?.id],
  );

  const load = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await listComments(bookId, { page: 0, size: 50, sort: "new" });
      setItems(res.content ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không tải được bình luận");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ----- comment root ----- */
  const submitRoot = async () => {
    const body = rootText.trim();
    if (!body) return;

    try {
      const created = await createComment(bookId, { content: body });
      // newest first nên unshift
      setItems((prev) => [created, ...prev]);
      setRootText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không gửi được bình luận");
    }
  };

  /* ----- inline reply ----- */
  const replyClick = (c: ResComment) => {
    setActiveReply({ id: c.id, name: c.userName });
    setReplyText(`@${c.userName} `);
  };

  const cancelReply = () => {
    setActiveReply(null);
    setReplyText("");
  };

  const submitReply = async () => {
    if (!activeReply) return;
    const body = replyText.trim();
    if (!body) return;

    try {
      const created = await createComment(bookId, {
        content: body,
        parentId: activeReply.id,
      });

      setItems((prev) => insertReply(prev, activeReply.id, created));

      cancelReply();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Không gửi được trả lời");
    }
  };

  const toggleLike = async (id: number, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      setErr("Vui lòng đăng nhập để thích bình luận.");
      return;
    }

    setItems((prev) =>
      patchById(prev, id, (c) => ({
        ...c,
        likedByMe: !currentlyLiked,
        likeCount: Math.max(
          0,
          (c.likeCount || 0) + (currentlyLiked ? -1 : 1),
        ),
      })),
    );

    try {
      if (currentlyLiked) await unlikeComment(id);
      else await likeComment(id);
    } catch {
      setItems((prev) =>
        patchById(prev, id, (c) => ({
          ...c,
          likedByMe: currentlyLiked,
          likeCount: Math.max(
            0,
            (c.likeCount || 0) + (currentlyLiked ? 1 : -1),
          ),
        })),
      );
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-xl font-semibold tracking-tight">Bình luận</h3>

      {err && <div className="text-sm text-rose-600">{err}</div>}
      {loading && <div className="text-sm text-gray-500">Đang tải bình luận…</div>}

      {/* LIST */}
      <div className="space-y-4">
        {items.map((c) => (
          <CommentItem
            key={c.id}
            c={c}
            Kebab={Kebab}
            canEdit={canEdit}
            activeReply={activeReply}
            onReplyClick={replyClick}
            onCancelReply={cancelReply}
            replyText={replyText}
            onChangeReplyText={setReplyText}
            onSubmitReply={submitReply}
            onEdited={async (id, content) => {
              await updateComment(id, { content });
              await load();
            }}
            onDeleted={async (id) => {
              await deleteComment(id);
              await load();
            }}
            onToggleLike={toggleLike}
          />
        ))}

        {!loading && items.length === 0 && !err && (
          <div className="text-sm text-gray-500">Chưa có bình luận.</div>
        )}
      </div>

      {/* ROOT COMPOSER */}
      {isAuthenticated ? (
        <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
          <textarea
            rows={3}
            value={rootText}
            onChange={(e) => setRootText(e.target.value)}
            placeholder="Viết bình luận…"
            className="w-full rounded-2xl bg-white/95 p-4 text-[15px] text-gray-900 shadow outline-none placeholder:text-gray-400 sm:text-base"
          />
          <div className="mt-3">
            <button
              onClick={submitRoot}
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
