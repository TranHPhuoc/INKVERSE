// src/components/ChatBoxWidget.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
  type ReactElement,
} from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { X, Minus, Send, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";

import {
  askSophia,
  startSophiaChat,
  getMessages,
  type ChatMessageDTO,
  type Role,
} from "../services/chat";
import aiAvatar from "../assets/aiagentchat.png";

/* ===== Types ===== */
type Msg = {
  id?: number;
  role: Role;
  content: string;
  createdAt: string;
};

/* ===== Utils ===== */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function normalizeBooksMd(md: string): string {
  const text = md.replace(/\r\n/g, "\n");

  const isItemStart = (s: string) => /^\s*\d+\.\s+/.test(s);
  const isLinkLine  = (s: string) => /\[[^\]]+\]\([^)]+\)/.test(s) || /^Mua\b/i.test(s.trim());
  const isPriceLine = (s: string) =>
    /Giá\s*(?:gốc|cũ|khuyến\s*mãi|hiện\s*tại|giảm|:)/i.test(s) ||
    /~~\s*[\d.,]+(?:\s*(?:VND|đ|₫))?\s*~~/i.test(s);

  const cap1 = (re: RegExp, s: string): string | null => {
    const m = s.match(re);
    return m && typeof m[1] === "string" ? m[1] : null;
  };

  function extractGroup(lines: string[]): string {
    let orig: string | null = null;
    let sale: string | null = null;
    let link: string | null = null;
    let desc: string | null = null;

    // 1) Giá gốc
    for (const ln of lines) {
      const t = ln.trim();
      const g = cap1(/~~\s*([\d.,]+)\s*(?:VND|đ|₫)?\s*~~/i, t)
        ?? cap1(/Giá\s*(?:gốc|cũ)\s*:\s*([\d.,]+)\s*(?:VND|đ|₫)?/i, t);
      if (g) { orig = g; break; }
    }

    // 2) Giá sale
    for (const ln of lines) {
      const t = ln.trim();
      const s = cap1(/Giá\s*(?:khuyến\s*mãi|hiện\s*tại|giảm|sale|ưu\s*đãi)\s*:\s*([\d.,]+)\s*(?:VND|đ|₫)?/i, t)
        ?? cap1(/^\s*Giá\s*:\s*([\d.,]+)\s*(?:VND|đ|₫)?/i, t);
      if (s) { sale = s; break; }
    }

    // 3) Link
    for (const ln of lines) {
      const m = ln.match(/\[[^\]]+\]\([^)]+\)/);
      if (m) { link = m[0]; break; }
    }

    // 4) Mô tả
    for (const ln of lines) {
      const t = ln.trim();
      const d = cap1(/^\s*(?:[-*]\s*)?Mô\s*tả(?:\s*ngắn)?\s*:?\s*(.+)$/i, t);
      if (d) { desc = d.trim(); break; }
    }

    if (!desc) {
      let afterPrice = false;
      for (const ln of lines) {
        const t = ln.trim();

        if (/Giá\s*(?:khuyến\s*mãi|hiện\s*tại|giảm|sale|ưu\s*đãi)\s*:/i.test(t) || /^\s*Giá\s*:/i.test(t)) {
          afterPrice = true;
          continue;
        }
        if (!afterPrice) continue;

        if (t === "" || isLinkLine(t) || isItemStart(t) || isPriceLine(t) || /^[-*]\s*$/.test(t)) continue;

        desc = t.replace(/^\s*[-*]\s*/, "");
        break;
      }
    }


    const sub: string[] = [];
    sub.push(`- Giá gốc: ${orig ? `~~${orig}~~` : "—"}`);
    sub.push(`- Giá khuyến mãi: ${sale ? `**${sale}**` : "—"}`);
    if (desc) sub.push(`- Mô tả: ${desc}`);
    if (link) sub.push(`- ${link}`);

    return sub.map(l => `   ${l}`).join("\n");
  }

  const lines = text.split("\n");
  const blocks: { header: string; body: string[] }[] = [];
  let current: { header: string; body: string[] } | null = null;

  for (const ln of lines) {
    if (isItemStart(ln)) {
      if (current) blocks.push(current);
      current = { header: ln.trim(), body: [] };
    } else {
      if (!current) blocks.push({ header: "", body: [ln] });
      else current.body.push(ln);
    }
  }
  if (current) blocks.push(current);

  const rebuilt: string[] = [];
  for (const b of blocks) {
    if (!b.header) { rebuilt.push(...b.body); continue; }

    rebuilt.push(b.header);
    rebuilt.push(extractGroup(b.body));
    rebuilt.push("");
  }

  return rebuilt.join("\n");
}


function extractMarkdown(resp: unknown): string {
  if (!isRecord(resp)) return "";
  const direct = resp["markdown"];
  if (typeof direct === "string") return direct;

  const data1 = resp["data"];
  if (isRecord(data1)) {
    const md2 = data1["markdown"];
    if (typeof md2 === "string") return md2;

    const data2 = data1["data"];
    if (isRecord(data2)) {
      const md3 = data2["markdown"];
      if (typeof md3 === "string") return md3;
    }
  }
  return "";
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return !Number.isNaN(d.getTime())
    ? d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    })
    : "";
}

/* ===== Suggestion chips ===== */
const DEFAULT_SUGS = [
  "Sách đang giảm giá",
  "Sách bán chạy tuần này",
  "Tìm theo tác giả",
  "Tìm theo thể loại",
  "Kiểm tra đơn hàng",
  "Gợi ý sách cho học sinh",
];

function hasAny(s: string, kws: string[]): boolean {
  const t = s.toLowerCase();
  return kws.some((k) => t.includes(k));
}
function nextSuggestions(lastUserMsg: string | null): string[] {
  if (!lastUserMsg) return DEFAULT_SUGS;
  const t = lastUserMsg.toLowerCase().trim();

  if (hasAny(t, ["giảm giá", "sale", "khuyến mãi", "giá bao nhiêu", "giá", "bao nhiêu"])) {
    return [
      "Sách giảm giá theo thể loại",
      "Flash Sale hôm nay",
      "So sánh giá hai cuốn cùng chủ đề",
      "Thông báo khi có giảm giá",
      "Sách mới ra mắt đang giảm",
      "Chính sách đổi trả",
    ];
  }
  if (hasAny(t, ["tác giả", "ai viết", "của ai", "nguyễn nhật ánh", "chu lai", "haruki murakami"])) {
    return [
      "Sách nổi bật của tác giả này",
      "Sách mới phát hành của tác giả này",
      "Tác giả tương tự",
      "Top 5 cuốn nên đọc trước",
      "Tác phẩm theo thứ tự xuất bản",
      "Tìm sự kiện ký tặng",
    ];
  }
  if (hasAny(t, ["cuốn", "sách", "nội dung", "tóm tắt", "giới thiệu"])) {
    return [
      "Sách tương tự chủ đề này",
      "Đánh giá của độc giả",
      "Có eBook/PDF không",
      "Phiên bản bìa cứng/bìa mềm",
      "Bản tái bản gần nhất",
      "Tác giả của cuốn này là ai",
    ];
  }
  if (hasAny(t, ["thể loại", "kinh tế", "văn học", "truyện", "kỹ năng", "self-help"])) {
    return [
      "Top bán chạy của thể loại",
      "Sách mới ra mắt trong thể loại",
      "Gợi ý theo độ tuổi",
      "Combo theo thể loại",
      "Sách nghe (audiobook) cùng chủ đề",
      "Sách của NXB uy tín nhất",
    ];
  }
  if (hasAny(t, ["đơn hàng", "mã đơn", "vận chuyển", "giao hàng", "trạng thái"])) {
    return [
      "Thời gian giao dự kiến",
      "Phí ship bao nhiêu",
      "Chính sách đổi trả",
      "Hỗ trợ cập nhật địa chỉ",
      "Hóa đơn VAT",
      "Liên hệ CSKH",
    ];
  }
  return DEFAULT_SUGS;
}

function extractBookSlug(href?: string | null): string | null {
  if (!href) return null;
  try {
    const raw = href.trim();

    // dạng /books/<slug>
    const rel = raw.match(/\/books\/([^?#/]+)/i);
    if (rel?.[1]) return decodeURIComponent(rel[1]);

    // dạng absolute
    const u = new URL(raw, window.location.origin);
    const m = u.pathname.match(/\/books\/([^?#/]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]);

    return null;
  } catch {
    return null;
  }
}

const MdLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...rest }) => {
  const navigate = useNavigate();
  const to = (href as string) ?? "#";
  const slug = extractBookSlug(to);
  const isInternal = !!slug;

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isInternal && slug) {
      e.preventDefault();
      navigate(`/books/${slug}`);
    }
  };

  return (
    <a
      href={to}
      onClick={onClick}
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noopener noreferrer"}
      className="text-red-600 font-medium underline decoration-transparent hover:decoration-red-600 hover:text-red-700 transition"
      {...rest}
    >
      {children}
    </a>
  );
};


const mdComponents: Components = {
  a: MdLink,
  strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-3">{children}</ol>,
  ul: ({ children }) => <ul className="ml-5 list-none space-y-1">{children}</ul>,
  li: ({ children }) => <li className="text-neutral-800 leading-snug">{children}</li>,
  p:  ({ children }) => <p className="mb-1 whitespace-pre-line">{children}</p>,
};


/* ===== Typing bubble (Hiệu ứng gõ) ===== */
const TypingBubble: React.FC = () => (
  <div className="flex items-center gap-1 rounded-2xl bg-white border border-neutral-200 px-3.5 py-2.5 text-sm">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-2 w-2 rounded-full bg-neutral-900"
        animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </div>
);

/* ===== Component ===== */
export default function ChatBoxWidget({ avatarSrc }: { avatarSrc?: string }): ReactElement {
  // Panel state
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);



  // Chat state
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [sugs, setSugs] = useState<string[]>(DEFAULT_SUGS);

  // Refs/anim
  const viewportRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const EXIT_Y = 700;
  const avatarUrl = avatarSrc ?? aiAvatar;

  // UI classes
  const headerClass = useMemo(
    () => "relative flex items-center justify-between px-3 py-2 bg-neutral-900 text-white select-none",
    [],
  );
  const shellClass = useMemo(
    () => "fixed bottom-24 right-6 z-50 h-[600px] w-[380px] overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50",
    [],
  );

  // Auto scroll
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  // Load history
  const loadHistory = async (): Promise<void> => {
    setReloading(true);
    try {
      const list = await getMessages({ limit: 30 });
      const asc: Msg[] = [...list].reverse().map((m: ChatMessageDTO) => {
        const base: Msg = { role: m.role, content: m.content, createdAt: m.createdAt };
        return typeof m.id === "number" ? { ...base, id: m.id } : base;
      });
      if (asc.length > 0) {
        setMsgs(asc);
        const lastU = [...asc].reverse().find((x) => x.role === "user")?.content ?? null;
        setSugs(nextSuggestions(lastU));
      }
    } finally {
      setReloading(false);
      setBooted(true);
    }
  };

  // First open
  useEffect(() => {
    if (visible && !booted) {
      setMsgs([
        {
          role: "assistant",
          content:
            "Hi, mình là **Sophia** 👋 – trợ lý ảo của Inkverse.\nBạn muốn tìm theo **tên sách, tác giả, thể loại** hay xem **sách đang giảm giá**?",
          createdAt: new Date().toISOString(),
        },
      ]);
      setSugs(DEFAULT_SUGS);
      void loadHistory();
    }
  }, [visible, booted]);

  // Send
  async function send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || loading) return;

    setMsgs((m) => [...m, { role: "user", content, createdAt: new Date().toISOString() }]);
    setSugs([]);
    setInput("");
    setLoading(true);

    try {
      const resp = await askSophia(content);
      const md = extractMarkdown(resp);
      const bot =
        md.trim().length > 0
          ? md
          : "Mình chưa nhận được nội dung trả lời hợp lệ. Bạn thử lại giúp mình nhé!";

      setMsgs((m) => [
        ...m,
        { role: "assistant", content: bot, createdAt: new Date().toISOString() },
      ]);
      setSugs(nextSuggestions(content));
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: "Có trục trặc kết nối. Bạn vui lòng thử lại giúp mình nhé!",
          createdAt: new Date().toISOString(),
        },
      ]);
      setSugs(nextSuggestions(content));
    } finally {
      setLoading(false);
    }
  }

  // Open/minimize
  const openPanel = (): void => {
    if (isAnimating || visible) return;
    setHidden(false);
    setVisible(true);
    y.set(EXIT_Y);
    setIsAnimating(true);
    animate(y, 0, { duration: 0.45, ease: [0.33, 1, 0.68, 1] }).then(() => setIsAnimating(false));
  };
  const minimizePanel = (): void => {
    if (isAnimating || !visible) return;
    setIsAnimating(true);
    animate(y, EXIT_Y, { duration: 0.45, ease: [0.33, 1, 0.68, 1] }).then(() => {
      setVisible(false);
      setHidden(true);
      setIsAnimating(false);
      y.set(0);
    });
  };

  // Handlers
  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void send(input);
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => setInput(e.target.value);

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => (visible ? minimizePanel() : openPanel())}
        className="fixed bottom-6 right-24 z-[80] rounded-full p-1 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:scale-105 transition cursor-pointer"
        aria-label="Mở chat Sophia"
        type="button"
      >
        <img
          src={avatarUrl}
          alt="Mở chat Sophia"
          className="h-14 w-14 rounded-full object-cover"
          draggable={false}
        />
      </button>

      {/* Panel */}
      <motion.div className={`${shellClass} ${hidden ? "hidden" : "block"}`} style={{ y }}>
        {/* Header */}
        <div className={headerClass}>
          <div className="flex items-center gap-2">
            <img src={avatarUrl} alt="Sophia" className="h-[22px] w-[22px] rounded-full object-cover" />
            <span className="font-semibold tracking-wide">Sophia</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => void loadHistory()}
              className="rounded-full p-1.5 hover:bg-white/10 cursor-pointer"
              aria-label="Tải lại lịch sử"
              title="Tải lại lịch sử"
              type="button"
            >
              <RotateCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={minimizePanel}
              className="rounded-full p-1.5 hover:bg-white/10 cursor-pointer"
              aria-label="Thu nhỏ"
              title="Thu nhỏ"
              type="button"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={async () => {
                setMsgs([]);
                try {
                  await startSophiaChat();
                } catch {/**/}
                setMsgs([
                  {
                    role: "assistant",
                    content:
                      "Bắt đầu cuộc trò chuyện mới ✨. Bạn muốn xem **sách giảm giá**, **theo tác giả** hay **kiểm tra đơn hàng**?",
                    createdAt: new Date().toISOString(),
                  },
                ]);
                setSugs(DEFAULT_SUGS);
              }}
              className="rounded-full p-1.5 hover:bg-white/10 cursor-pointer"
              aria-label="Xoá hội thoại"
              title="Xoá hội thoại"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex h-[560px] flex-col min-h-0">
          <div ref={viewportRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3 text-sm">
            {msgs.map((m, idx) => (
              <div key={m.id ?? idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                    m.role === "user"
                      ? "bg-neutral-900 text-white"
                      : "bg-white border border-neutral-200 text-neutral-900"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {m.role === "assistant" ? normalizeBooksMd(m.content) : m.content}
                  </ReactMarkdown>

                  <div
                    className={`mt-1 text-[10px] ${
                      m.role === "user" ? "text-white/70 text-right" : "text-neutral-400 text-right"
                    }`}
                  >
                    {fmtTime(m.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <TypingBubble />
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {sugs.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-200 bg-white/70 px-3 py-2">
              {sugs.map((s, i) => (
                <button
                  key={`${s}-${i}`}
                  onClick={() => void send(s)}
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3">
            <input
              value={input}
              onChange={onChange}
              placeholder="Nhắn cho Sophia…"
              className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-300"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Gửi
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
