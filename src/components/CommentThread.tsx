import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  listComments,
  createComment,
  updateComment,
  deleteComment,
  type ResComment,
} from "../services/comment";
import { useAuth } from "../context/AuthContext";

/* ===== helpers ===== */
function fmtTime(iso?: string) {
  if (!iso) return "";
  const d = dayjs(String(iso));
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "";
}

/* ===== single item (đệ quy) ===== */
function CommentItem({
  c,
  onReply,
  onEdited,
  onDeleted,
}: {
  c: ResComment;
  onReply: (parentId: number) => void;
  onEdited: (id: number, content: string) => Promise<void>;
  onDeleted: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.content);

  return (
    <div className="space-y-2 rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="font-medium text-gray-800">{c.userName}</div>
        <div>{fmtTime(c.createdAt)}</div>
      </div>

      {!editing ? (
        <div className="text-gray-800">{c.content}</div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded border p-2"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const v = text.trim();
                if (!v) return;
                await onEdited(c.id, v);
                setEditing(false);
              }}
              className="rounded bg-emerald-600 px-3 py-1 text-white"
            >
              Lưu
            </button>
            <button onClick={() => setEditing(false)} className="rounded border px-3 py-1">
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 text-sm text-gray-500">
        <button onClick={() => onReply(c.id)} className="hover:text-gray-700">
          Trả lời
        </button>
        <button onClick={() => setEditing(true)} className="hover:text-gray-700">
          Sửa
        </button>
        <button onClick={async () => onDeleted(c.id)} className="hover:text-gray-700">
          Xóa
        </button>
      </div>

      {c.children?.length ? (
        <div className="mt-3 space-y-3 border-l-2 border-rose-100 pl-4">
          {c.children.map((ch) => (
            <CommentItem
              key={ch.id}
              c={ch}
              onReply={onReply}
              onEdited={onEdited}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ===== thread ===== */
export default function CommentThread({ bookId }: { bookId: number }) {
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<ResComment[]>([]);
  const [page] = useState(0); // có thể mở rộng phân trang sau
  const [size] = useState(5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [text, setText] = useState("");

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

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">Bình luận</h3>

      {/* Composer */}
      {isAuthenticated ? (
        <div className="space-y-2">
          {replyTo && (
            <div className="text-sm text-gray-600">
              Đang trả lời bình luận #{replyTo}{" "}
              <button className="text-blue-600" onClick={() => setReplyTo(null)}>
                Hủy
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Viết bình luận…"
            className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={submit} className="rounded bg-blue-600 px-4 py-2 text-white">
            Gửi bình luận
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Chỉ có thành viên mới có thể viết bình luận. Vui lòng{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            đăng nhập
          </a>
          .
        </div>
      )}

      {/* States */}
      {err ? <div className="text-sm text-rose-600">{err}</div> : null}
      {loading ? <div className="text-sm text-gray-500">Đang tải bình luận…</div> : null}

      {/* List */}
      <div className="space-y-4">
        {items.map((c) => (
          <CommentItem
            key={c.id}
            c={c}
            onReply={(pid) => setReplyTo(pid)}
            onEdited={async (id, content) => {
              await updateComment(id, { content });
              await load();
            }}
            onDeleted={async (id) => {
              await deleteComment(id);
              await load();
            }}
          />
        ))}
        {!loading && items.length === 0 && !err && (
          <div className="text-sm text-gray-500">Chưa có bình luận.</div>
        )}
      </div>
    </div>
  );
}
