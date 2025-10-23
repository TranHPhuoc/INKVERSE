// src/components/ChatBoxWidget.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, RotateCw, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import {
  askSophia,
  startSophiaChat,
  getMessages,
  type ChatMessageDTO,
  type Role,
  type ChatMode,
} from "../services/chat";

/* ---------- Props ---------- */
type ChatBoxWidgetProps = {
  avatarSrc?: string;
  mode?: ChatMode;
};

/* ---------- Types & helpers ---------- */
type Msg = { id?: number; role: Role; content: string; createdAt: string };

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;
const pick = <T,>(o: unknown, k: string): T | undefined =>
  isRecord(o) ? (o[k] as T) : undefined;

const toMsg = (m: ChatMessageDTO): Msg => {
  const base: Msg = { role: m.role, content: m.content, createdAt: m.createdAt };
  return typeof m.id === "number" ? { ...base, id: m.id } : base;
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(+d)
    ? ""
    : d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
};

/* ---------- Markdown formatting ---------- */
function isGfmTable(md: string): boolean {
  return /\n\|.*\|\s*\n\|[\s:\-|]+\|\s*\n/.test(md);
}
function isCodeBlock(md: string): boolean {
  return /```[\s\S]*?```/.test(md);
}
function normalizeBooksMd(md: string): string {
  const text = md.replace(/\r\n/g, "\n");
  const isItemStart = (s: string) => /^\s*\d+\.\s+/.test(s);
  const lines = text.split("\n");
  const blocks: { header: string; body: string[] }[] = [];
  let cur: { header: string; body: string[] } | null = null;

  for (const ln of lines) {
    if (isItemStart(ln)) {
      if (cur) blocks.push(cur);
      cur = { header: ln.trim(), body: [] };
    } else {
      if (!cur) blocks.push({ header: "", body: [ln] });
      else cur.body.push(ln);
    }
  }
  if (cur) blocks.push(cur);

  const out: string[] = [];
  for (const b of blocks) {
    if (!b.header) out.push(...b.body);
    else {
      out.push(b.header);
      out.push(...b.body);
      out.push("");
    }
  }
  return out.join("\n");
}
function renderMd(md: string): string {
  if (isGfmTable(md) || isCodeBlock(md)) return md;
  return normalizeBooksMd(md);
}

function extractMarkdown(resp: unknown): string {
  const d1 = pick<string>(resp, "markdown");
  if (typeof d1 === "string") return d1;
  const data1 = pick(resp, "data");
  const d2 = pick<string>(data1, "markdown");
  if (typeof d2 === "string") return d2;
  const data2 = pick(data1, "data");
  const d3 = pick<string>(data2, "markdown");
  if (typeof d3 === "string") return d3;
  return "";
}

/* ---------- MD link điều hướng nội bộ ---------- */
function extractBookSlug(href?: string | null): string | null {
  if (!href) return null;
  try {
    const rel = href.match(/\/books\/([^?#/]+)/i);
    if (rel?.[1]) return decodeURIComponent(rel[1]);
    const u = new URL(href, window.location.origin);
    const m = u.pathname.match(/\/books\/([^?#/]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

const MdLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
                                                                           href,
                                                                           children,
                                                                           ...rest
                                                                         }) => {
  const navigate = useNavigate();
  const to = (href as string) ?? "#";
  const slug = extractBookSlug(to);
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (slug) {
      e.preventDefault();
      navigate(`/books/${slug}`);
    }
  };
  return (
    <a
      href={to}
      onClick={onClick}
      target={slug ? undefined : "_blank"}
      rel={slug ? undefined : "noopener noreferrer"}
      className="text-red-600 font-medium underline decoration-transparent hover:decoration-red-600 hover:text-red-700 transition"
      {...rest}
    >
      {children}
    </a>
  );
};

type CodeProps = {
  inline?: boolean;
  children?: React.ReactNode;
};

const mdComponents: Components = {
  a: MdLink,
  strong: ({ children }) => (
    <strong className="font-semibold text-neutral-900">{children}</strong>
  ),
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-3">{children}</ol>,
  ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
  li: ({ children }) => <li className="text-neutral-800 leading-snug">{children}</li>,
  p: ({ children }) => <p className="mb-1 whitespace-pre-line">{children}</p>,

  // Bảng GFM (SKU / Tồn / Đã bán …)
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-neutral-100">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="[&:not(:last-child)]:border-b [&:not(:last-child)]:border-neutral-200">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-semibold text-neutral-900 border border-neutral-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1 align-top text-neutral-800 border border-neutral-200">
      {children}
    </td>
  ),

  // Code/Pre – giữ thẳng cột ASCII
  code: (props) => {
    const { inline, children } = props as CodeProps;
    return inline ? (
      <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[12px]">
        {children}
      </code>
    ) : (
      <code className="font-mono text-[13px]">{children}</code>
    );
  },
  pre: (props) => {
    const { children } = props as CodeProps;
    return (
      <pre className="my-2 max-w-full overflow-x-auto rounded-md bg-neutral-50 p-3 font-mono text-[13px] leading-[1.35] text-neutral-900 ring-1 ring-neutral-200">
        {children}
      </pre>
    );
  },
};

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

/* ---------- Suggestion engine ---------- */
type Suggestion = { label: string; prompt: string };

function getDefaultSuggestions(mode: ChatMode): Suggestion[] {
  if (mode === "SALE")
    return [
      { label: "KPI tháng này", prompt: "KPI THANG NAY" },
      { label: "Best-sellers còn ít", prompt: "sách nào bán chạy mà còn ít hàng" },
      {
        label: "Sắp hết hàng",
        prompt:
          "những cuốn sách bán được trên 5 cuốn trong vòng 30 ngày qua nhưng chỉ còn dưới 500 cuốn là?",
      },
      { label: "Đơn hôm nay", prompt: "liệt kê đơn hàng hôm nay" },
    ];
  if (mode === "ADMIN")
    return [
      { label: "Doanh thu tháng", prompt: "Tổng doanh thu tháng này" },
      { label: "Top sản phẩm", prompt: "Top 10 sản phẩm bán chạy tháng này" },
      { label: "Tỷ lệ chuyển đổi", prompt: "Tỷ lệ chuyển đổi tháng này" },
      { label: "Tồn kho thấp", prompt: "Các sản phẩm tồn kho dưới 50" },
    ];
  // USER
  return [
    { label: "Sách giảm giá", prompt: "Liệt kê sách đang giảm giá" },
    { label: "Bán chạy tuần này", prompt: "Sách bán chạy tuần này" },
    { label: "Theo tác giả", prompt: "Sách theo tác giả Nguyễn Nhật Ánh" },
    { label: "Kiểm tra đơn", prompt: "Kiểm tra đơn hàng với mã INK" },
  ];
}

type Intent =
  | "CHECK_ORDER"
  | "LIST_PENDING"
  | "LIST_TODAY"
  | "PROMO"
  | "BESTSELLER"
  | "BY_AUTHOR"
  | "ADMIN_REVENUE"
  | "ADMIN_TOP"
  | "ADMIN_CONV"
  | "ADMIN_LOW"
  | "UNKNOWN";

function classifyIntent(q: string, mode: ChatMode): Intent {
  const s = q.toLowerCase();
  if (/ink\d{6,}/i.test(q) || /kiểm\s*tra.*đơn|tra\s*cứu.*đơn/.test(s)) return "CHECK_ORDER";
  if (/chờ\s*xử\s*lý/.test(s)) return "LIST_PENDING";
  if (/hôm\s*nay/.test(s)) return "LIST_TODAY";
  if (mode === "ADMIN") {
    if (/doanh\s*thu|revenue/.test(s)) return "ADMIN_REVENUE";
    if (/bán\s*chạy|top/.test(s)) return "ADMIN_TOP";
    if (/chuyển\s*đổi|conversion/.test(s)) return "ADMIN_CONV";
    if (/tồn\s*kho|hết\s*hàng|low\s*stock/.test(s)) return "ADMIN_LOW";
  }
  if (mode === "USER") {
    if (/giảm\s*giá|sale|khuyến\s*mãi/.test(s)) return "PROMO";
    if (/bán\s*chạy|best/.test(s)) return "BESTSELLER";
    if (/tác\s*giả|author/.test(s)) return "BY_AUTHOR";
  }
  return "UNKNOWN";
}

function getFollowupSuggestions(mode: ChatMode, intent: Intent): Suggestion[] {
  if (mode === "SALE") {
    switch (intent) {
      case "LIST_TODAY":
        return [
          { label: "Theo trạng thái", prompt: "Phân bổ trạng thái các đơn hôm nay" },
          { label: "Doanh thu hôm nay", prompt: "Tổng doanh thu của đơn hôm nay" },
          { label: "Khách mua nhiều", prompt: "Khách hàng mua nhiều trong hôm nay" },
          { label: "Đơn chờ xử lý", prompt: "Các đơn hàng đang chờ xử lý" },
        ];
      default:
        return getDefaultSuggestions("SALE");
    }
  }
  if (mode === "ADMIN") {
    switch (intent) {
      case "ADMIN_REVENUE":
        return [
          { label: "So với tháng trước", prompt: "So sánh doanh thu tháng này với tháng trước" },
          { label: "Theo danh mục", prompt: "Doanh thu theo danh mục trong tháng này" },
          { label: "Theo kênh", prompt: "Doanh thu theo kênh bán trong tháng này" },
          { label: "Đơn hủy", prompt: "Tỷ lệ đơn hủy trong tháng này" },
        ];
      case "ADMIN_TOP":
        return [
          { label: "Theo tác giả", prompt: "Top tác giả doanh thu cao tháng này" },
          { label: "Theo danh mục", prompt: "Top danh mục bán chạy tháng này" },
          { label: "Theo khu vực", prompt: "Sản phẩm bán chạy theo khu vực" },
          { label: "Lợi nhuận", prompt: "Top sản phẩm lợi nhuận cao nhất" },
        ];
      default:
        return getDefaultSuggestions("ADMIN");
    }
  }
  // USER
  switch (intent) {
    case "PROMO":
      return [
        { label: "Sale theo %", prompt: "Sách giảm giá trên 30%" },
        { label: "Theo thể loại", prompt: "Sách giảm giá thể loại tiểu thuyết" },
        { label: "Mới giảm", prompt: "Sách mới giảm giá hôm nay" },
        { label: "Hết sale khi nào", prompt: "Chương trình giảm giá này kết thúc khi nào" },
      ];
    case "BESTSELLER":
      return [
        { label: "Theo giá", prompt: "Sách bán chạy dưới 100k" },
        { label: "Theo tác giả", prompt: "Sách bán chạy của Nguyễn Nhật Ánh" },
        { label: "Theo tháng", prompt: "Top bán chạy tháng này" },
        { label: "Gợi ý cá nhân", prompt: "Gợi ý bán chạy phù hợp với tôi" },
      ];
    case "BY_AUTHOR":
      return [
        { label: "Mới phát hành", prompt: "Sách mới phát hành của tác giả trên" },
        { label: "Theo series", prompt: "Các series nổi bật của tác giả này" },
        { label: "Tương tự", prompt: "Sách tương tự cùng phong cách" },
        { label: "Đang giảm giá", prompt: "Sách của tác giả trên đang giảm giá" },
      ];
    default:
      return getDefaultSuggestions("USER");
  }
}


function getUserRoles(u: unknown): string[] {
  if (typeof u !== "object" || u === null) return [];
  const { role, roles } = u as { role?: string | null; roles?: (string | null)[] | null };
  const out: string[] = [];
  if (typeof role === "string") out.push(role);
  if (Array.isArray(roles)) out.push(...roles.filter((r): r is string => typeof r === "string"));
  return out;
}
/* ---------- Component ---------- */
export default function ChatBoxWidget({
                                        avatarSrc,
                                        mode: propMode,
                                      }: ChatBoxWidgetProps): ReactElement {
  const { user } = useAuth();
  const { pathname } = useLocation();

  // Ẩn FAB ở các trang auth
  const HIDE_ON = useMemo(
    () => ["/dang-nhap", "/dang-ky", "/quen-mat-khau", "/verify-email", "/dat-lai-mat-khau"],
    [],
  );

  const mode: ChatMode = useMemo(() => {
    if (propMode) return propMode;

    const roleSet = new Set(
      getUserRoles(user)
        .map((r) => r.toUpperCase())
        .filter(Boolean)
    );

    if (roleSet.has("ROLE_ADMIN") || roleSet.has("ADMIN") || roleSet.has("ROLE_SALE") || roleSet.has("SALE"))
      return "SALE";

    return "USER";
  }, [propMode, user]);

  // UI state
  const [visible, setVisible] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sugs, setSugs] = useState<Suggestion[]>(() => getDefaultSuggestions(mode));
  const lastModeRef = useRef<ChatMode | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

  /* ——— Nghe 'chat:open' & 'chat:close' ——— */
  useEffect(() => {
    const onOpen = () => setVisible(true);
    const onClose = () => setVisible(false);
    window.addEventListener("chat:open", onOpen as EventListener);
    window.addEventListener("chat:close", onClose as EventListener);
    return () => {
      window.removeEventListener("chat:open", onOpen as EventListener);
      window.removeEventListener("chat:close", onClose as EventListener);
    };
  }, []);

  /* ——— Gắn attribute lên <html> để trang khác biết panel đang mở ——— */
  useEffect(() => {
    const html = document.documentElement;
    if (visible) html.setAttribute("data-chat-open", "true");
    else html.removeAttribute("data-chat-open");
    return () => html.removeAttribute("data-chat-open");
  }, [visible]);

  /* ——— Auto scroll ——— */
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight });
  }, [msgs.length, loading]);

  /* ——— Reset phiên CHỈ khi đổi mode sau lần mở đầu tiên ——— */
  useEffect(() => {
    if (!visible) return;

    if (lastModeRef.current === null) {
      lastModeRef.current = mode;
      setSugs(getDefaultSuggestions(mode));
      return;
    }

    if (lastModeRef.current !== mode) {
      (async () => {
        try {
          await startSophiaChat();
        } catch {
          /* ignore */
        }
        lastModeRef.current = mode;
        setSugs(getDefaultSuggestions(mode));
      })();
    }
  }, [visible, mode]);

  /* ——— Lần đầu mở: load page mới nhất ——— */
  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoadingMore(true);
      try {
        const list = await getMessages({ limit: 30, mode });
        const asc = [...list].reverse().map(toMsg);
        setMsgs(asc);
        setHasMore(list.length >= 30);
        setBooted(true);
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [visible, mode]);

  /* ——— Nếu panel đang mở và mode đổi (sau khi boot) → reload messages ——— */
  useEffect(() => {
    if (!booted || !visible) return;
    (async () => {
      const list = await getMessages({ limit: 30, mode });
      const asc = [...list].reverse().map(toMsg);
      setMsgs(asc);
      setHasMore(list.length >= 30);
    })();
  }, [booted, visible, mode]);

  /* ——— Send ——— */
  async function send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || loading) return;
    setMsgs((m) => [...m, { role: "user", content, createdAt: new Date().toISOString() }]);
    setInput("");
    setLoading(true);
    try {
      const resp = await askSophia(content, mode);
      const md = extractMarkdown(resp);
      const bot =
        md.trim().length > 0
          ? md
          : "Mình chưa nhận được nội dung trả lời hợp lệ. Bạn thử lại giúp mình nhé!";
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: bot, createdAt: new Date().toISOString() },
      ]);

      const intent = classifyIntent(content, mode);
      setSugs(getFollowupSuggestions(mode, intent));
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: "Có trục trặc kết nối. Bạn vui lòng thử lại giúp mình nhé!",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send(input);
  };

  /* ——— Scroll lên để load thêm ——— */
  const onScroll = async () => {
    const el = viewportRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop <= 24) {
      setLoadingMore(true);
      try {
        const firstId = typeof msgs[0]?.id === "number" ? msgs[0]!.id : undefined;
        const older = await getMessages(
          firstId ? { limit: 30, beforeId: firstId, mode } : { limit: 30, mode },
        );
        if (!Array.isArray(older) || older.length === 0) {
          setHasMore(false);
          return;
        }
        const asc = [...older].reverse().map(toMsg);
        const prevH = el.scrollHeight;
        setMsgs((m) => [...asc, ...m]);
        requestAnimationFrame(() => {
          const newH = el.scrollHeight;
          el.scrollTop = newH - prevH + el.scrollTop;
        });
        setHasMore(older.length >= 30);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const headerClass =
    "relative flex items-center justify-between px-3 py-2 bg-neutral-900 text-white select-none";
  const shellClass =
    "fixed bottom-4 right-4 z-50 h-[560px] w-[380px] overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-xl";

  // Ẩn FAB ở các trang auth + khi panel đang mở
  const hideFabByRoute = HIDE_ON.some((p) => pathname.startsWith(p));
  const shouldShowFab = !hideFabByRoute && !visible;

  const openPanel = () => {
    setVisible(true);
    window.dispatchEvent(new Event("chat:open"));
  };

  const closePanel = () => {
    setVisible(false);
    window.dispatchEvent(new Event("chat:close"));
  };

  return (
    <>
      {/* === Floating Button mở chat (ẩn khi panel mở) === */}
      {shouldShowFab && (
        <button
          onClick={openPanel}
          className="ink-fab-sophia fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform"
          aria-label="Mở chat Sophia"
          type="button"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Sophia" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </button>
      )}

      {/* === Panel chat === */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="chat-panel"
            className={shellClass}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className={headerClass}>
              {/* Title + Avatar */}
              <div className="flex items-center gap-2">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Sophia"
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-white">
                    S
                  </div>
                )}
                <span className="font-semibold tracking-wide">Sophia</span>
                {mode !== "USER" && (
                  <span className="ml-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    {mode}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    try {
                      await startSophiaChat();
                    } catch { /* ignore */ }
                    setMsgs([
                      {
                        role: "assistant",
                        content:
                          mode === "SALE"
                            ? "Bắt đầu chat SALE ✨. Bạn có thể hỏi **KPI**, **best-sellers sắp hết**, hoặc **đơn hôm nay**."
                            : mode === "ADMIN"
                              ? "Bắt đầu chat ADMIN ✨. Bạn có thể hỏi **doanh thu**, **top bán chạy**, hay **tỷ lệ chuyển đổi**."
                              : "Bắt đầu cuộc trò chuyện mới ✨. Bạn cần **sách giảm giá**, **bán chạy** hay **kiểm tra đơn hàng**?",
                        createdAt: new Date().toISOString(),
                      },
                    ]);
                    setSugs(getDefaultSuggestions(mode));
                    setHasMore(false);
                  }}
                  className="rounded-full p-1.5 hover:bg-white/10"
                  aria-label="Bắt đầu mới"
                  title="Bắt đầu mới"
                  type="button"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  onClick={closePanel}
                  className="rounded-full p-1.5 hover:bg-white/10"
                  aria-label="Đóng"
                  title="Đóng"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex h-[508px] min-h-0 flex-col">
              <div
                ref={viewportRef}
                onScroll={onScroll}
                className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3 text-sm"
              >
                {msgs.map((m, idx) => (
                  <div
                    key={m.id ?? idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
                        m.role === "user"
                          ? "bg-neutral-900 text-white"
                          : "bg-white border border-neutral-200 text-neutral-900"
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                        {m.role === "assistant" ? renderMd(m.content) : m.content}
                      </ReactMarkdown>
                      <div
                        className={`mt-1 text-right text-[10px] ${
                          m.role === "user" ? "text-white/70" : "text-neutral-400"
                        }`}
                      >
                        {fmtTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}

                {(loading || (!booted && visible)) && (
                  <div className="flex justify-start">
                    <TypingBubble />
                  </div>
                )}
              </div>

              {/* Gợi ý câu hỏi */}
              {sugs.length > 0 && !loading && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {sugs.map((s, i) => (
                    <button
                      key={`${s.label}-${i}`}
                      type="button"
                      onClick={() => void send(s.prompt)}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                      title={s.prompt}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={onSubmit}
                className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3"
              >
                <input
                  value={input}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
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
        )}
      </AnimatePresence>
    </>
  );
}
