import { useState, type ComponentType } from "react";
import dayjs from "dayjs";
import { ThumbsUp } from "lucide-react";
import type { ResComment } from "../../services/comment";

export type ActiveReply = { id: number; name: string } | null;

type KebabProps = { onEdit: () => void; onDelete: () => void };

type Props = {
  c: ResComment;
  depth?: number;
  Kebab: ComponentType<KebabProps>;

  canEdit: (c: ResComment) => boolean;

  activeReply: ActiveReply;
  onReplyClick: (c: ResComment) => void;
  onCancelReply: () => void;

  replyText: string;
  onChangeReplyText: (v: string) => void;
  onSubmitReply: () => void;

  onEdited: (id: number, content: string) => void;
  onDeleted: (id: number) => void;
  onToggleLike: (id: number, liked: boolean) => void;
};

export default function CommentItem({
  c,
  depth = 0,
  Kebab,
  canEdit,
  activeReply,
  onReplyClick,
  onCancelReply,
  replyText,
  onChangeReplyText,
  onSubmitReply,
  onEdited,
  onDeleted,
  onToggleLike,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.content);

  const isMine = canEdit(c);
  const liked = !!c.likedByMe;
  const likeCount = c.likeCount ?? 0;
  const isReplyingHere = activeReply?.id === c.id;

  return (
    <div
      className={[
        "space-y-2 rounded-xl bg-white/95 p-3",
        depth > 0 ? "shadow-[inset_0_0_0_1px_rgba(244,63,94,.06)]" : "shadow-sm",
      ].join(" ")}
    >
      {/* HEADER */}
      <div className="flex justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">{c.userName}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{dayjs(c.createdAt).format("DD/MM/YYYY HH:mm")}</span>
        </div>

        {isMine && !editing && (
          <Kebab onEdit={() => setEditing(true)} onDelete={() => onDeleted(c.id)} />
        )}
      </div>

      {/* CONTENT / EDIT MODE */}
      {!editing ? (
        <div className="leading-relaxed whitespace-pre-line text-gray-900">{c.content}</div>
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
              onClick={() => {
                const v = text.trim();
                if (!v) return;
                onEdited(c.id, v);
                setEditing(false);
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700 cursor-pointer"
            >
              Lưu
            </button>
            <button
              onClick={() => {
                setText(c.content);
                setEditing(false);
              }}
              className="rounded-lg bg-gray-100 px-3 py-1.5 hover:bg-gray-200 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ACTIONS */}
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
          onClick={() => onReplyClick(c)}
          className="cursor-pointer font-medium text-gray-600 transition-colors hover:text-rose-600"
        >
          Trả lời
        </button>
      </div>

      {/* INLINE REPLY */}
      {isReplyingHere && (
        <div className="mt-3 space-y-2 pl-5">
          <textarea
            value={replyText}
            onChange={(e) => onChangeReplyText(e.target.value)}
            rows={2}
            placeholder={`Trả lời ${c.userName}...`}
            className="w-full rounded-2xl bg-gray-50 p-3 text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={onSubmitReply}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 cursor-pointer"
            >
              Gửi trả lời
            </button>
            <button
              onClick={onCancelReply}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* CHILDREN */}
      {c.children?.length ? (
        <div className="mt-3 space-y-3 pl-5">
          {c.children.map((child) => (
            <CommentItem
              key={child.id}
              c={child}
              depth={depth + 1}
              Kebab={Kebab}
              canEdit={canEdit}
              activeReply={activeReply}
              onReplyClick={onReplyClick}
              onCancelReply={onCancelReply}
              replyText={replyText}
              onChangeReplyText={onChangeReplyText}
              onSubmitReply={onSubmitReply}
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
