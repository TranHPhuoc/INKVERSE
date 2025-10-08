import api from "./api";

/* ========== Types ========== */
export interface AuthorDetail {
  id: number;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  born?: string;
  nationality?: string;
  shortBio?: string;
}

export interface BookLite {
  id: number;
  title: string;
  slug: string;
  cover: string;
  price: number;
  salePrice?: number | null;
}

/* ========== BE wrapper & Page (Spring) ========== */
interface ApiWrapper<T> {
  statusCode?: number;
  error?: unknown;
  message?: string;
  data?: T;
}

interface SpringPageWire<T> {
  content: T[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
}

/* ========== Item sách (wire) ========== */
interface ResBookListItemWire {
  id: number;
  title: string;
  slug: string;
  thumbnail?: string;
  cover?: string;
  coverUrl?: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number | null;
  effectivePrice?: number | null;
}

/* ========== Avatar ========== */
import NguyenNhatAnh from "../assets/authors/NguyenNhatAnh.jpg";
import ToHoai from "../assets/authors/ToHoai.jpg";
import NamCao from "../assets/authors/NamCao.jpg";
import VuTrongPhung from "../assets/authors/VuTrongPhung.jpg";
import MaVanKhang from "../assets/authors/Nha-van-Ma-Van-Khang.png";
import NguyenNgocTu from "../assets/authors/NguyenNgocTu.jpg";
import TranDangKhoa from "../assets/authors/TranDangKhoa.jpg";
import JKRowling from "../assets/authors/J.K. Rowling.jpg";
import AgathaChristie from "../assets/authors/AgathaChristie.jpg";
import PauloCoelho from "../assets/authors/PauloCoelho.jpg";
import StephenKing from "../assets/authors/StephenKing.webp";
import WarrenBuffett from "../assets/authors/warrenbuffett.webp";
import ArthurConanDoyle from "../assets/authors/ArthurConanDoyle.jpg";
import NapoleonHill from "../assets/authors/NapoleonHill.jpg";

const AVATAR_BY_SLUG: Record<string, string> = {
  "nguyen-nhat-anh": NguyenNhatAnh,
  "to-hoai": ToHoai,
  "nam-cao": NamCao,
  "vu-trong-phung": VuTrongPhung,
  "ma-van-khang": MaVanKhang,
  "nguyen-ngoc-tu": NguyenNgocTu,
  "tran-dang-khoa": TranDangKhoa,
  "jk-rowling": JKRowling,
  "j.k.-rowling": JKRowling,
  "agatha-christie": AgathaChristie,
  "paulo-coelho": PauloCoelho,
  "stephen-king": StephenKing,
  "warren-buffett": WarrenBuffett,
  "arthur-conan-doyle": ArthurConanDoyle,
  "napoleon-hill": NapoleonHill,
};

/* ========== Tên hiển thị có dấu ========== */
const DISPLAY_NAME_BY_SLUG: Record<string, string> = {
  "nguyen-nhat-anh": "Nguyễn Nhật Ánh",
  "to-hoai": "Tô Hoài",
  "nam-cao": "Nam Cao",
  "vu-trong-phung": "Vũ Trọng Phụng",
  "ma-van-khang": "Ma Văn Kháng",
  "nguyen-ngoc-tu": "Nguyễn Ngọc Tư",
  "tran-dang-khoa": "Trần Đăng Khoa",
  "warren-buffett": "Warren Buffett",
  "jk-rowling": "J.K. Rowling",
  "agatha-christie": "Agatha Christie",
  "paulo-coelho": "Paulo Coelho",
  "stephen-king": "Stephen King",
  "arthur-conan-doyle": "Arthur Conan Doyle",
  "napoleon-hill": "Napoleon Hill",
};

/* ========== Helpers ========== */
const nfSlug = (s: string): string =>
  decodeURIComponent((s ?? "").trim()).toLowerCase();

function isApiWrapper<T>(v: unknown): v is ApiWrapper<T> {
  return !!v && typeof v === "object" && "data" in (v as Record<string, unknown>);
}

function unwrap<T>(payload: ApiWrapper<T> | T): T {
  return isApiWrapper<T>(payload)
    ? (payload as ApiWrapper<T>).data as T
    : (payload as T);
}

function unwrapPage<T>(
  payload: ApiWrapper<SpringPageWire<T> | T[]> | SpringPageWire<T> | T[],
): T[] {
  const d = unwrap(payload);
  if (Array.isArray((d as SpringPageWire<T>)?.content))
    return (d as SpringPageWire<T>).content;
  if (Array.isArray(d)) return d as T[];
  return [];
}

function toBooks(
  payload:
    | ApiWrapper<SpringPageWire<ResBookListItemWire> | ResBookListItemWire[]>
    | SpringPageWire<ResBookListItemWire>
    | ResBookListItemWire[],
): BookLite[] {
  const arr = unwrapPage<ResBookListItemWire>(payload);
  return arr.map((b): BookLite => {
    const price = Number(b.price ?? 0);
    const sale =
      b.salePrice != null
        ? Number(b.salePrice)
        : b.effectivePrice != null && Number(b.effectivePrice) < price
          ? Number(b.effectivePrice)
          : null;
    return {
      id: b.id,
      title: String(b.title ?? ""),
      slug: String(b.slug ?? ""),
      cover: String(b.thumbnail ?? b.cover ?? b.coverUrl ?? b.imageUrl ?? ""),
      price,
      salePrice: sale,
    };
  });
}

function titleFromSlug(slug: string): string {
  const s = nfSlug(slug);
  if (DISPLAY_NAME_BY_SLUG[s]) return DISPLAY_NAME_BY_SLUG[s];
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ========== Author header ========== */
export function makeAuthorHeader(slug: string, authorId?: number): AuthorDetail {
  const s = nfSlug(slug);
  return {
    id: Number.isFinite(authorId ?? NaN) ? Number(authorId) : 0,
    name: titleFromSlug(s),
    slug: s,
    avatarUrl: AVATAR_BY_SLUG[s] ?? null,
    coverUrl: null,
  };
}

/* ========== API PUBLIC ========== */
type ResAuthor = { id: number; name: string; slug: string };

export async function fetchAuthorBySlug(slug: string): Promise<ResAuthor | null> {
  const s = nfSlug(slug);
  try {
    const res = await api.get<ApiWrapper<ResAuthor>>(`/api/v1/authors/slug/${encodeURIComponent(s)}`);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
}

/* ========== Books by authorId (PUBLIC) ========== */
export async function getAuthorFeaturedWorksById(authorId: number): Promise<BookLite[]> {
  if (!Number.isFinite(authorId) || authorId <= 0) return [];
  const res = await api.get<ApiWrapper<SpringPageWire<ResBookListItemWire>>>("/api/v1/books", {
    params: { authorId, status: "ACTIVE", page: 0, size: 6, sort: "createdAt", direction: "DESC" },
  });
  return toBooks(res.data).slice(0, 6);
}

export async function listAuthorBooksById(authorId: number): Promise<BookLite[]> {
  if (!Number.isFinite(authorId) || authorId <= 0) return [];
  const res = await api.get<ApiWrapper<SpringPageWire<ResBookListItemWire>>>("/api/v1/books", {
    params: { authorId, status: "ACTIVE", page: 0, size: 200, sort: "createdAt", direction: "DESC" },
  });
  return toBooks(res.data);
}
