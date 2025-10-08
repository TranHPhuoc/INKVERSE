import api from "../services/api";

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as any)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export type Author = {
  id: number;
  name: string;
  slug: string;
  /** optional – BE có thể bổ sung; FE sẽ fallback chữ cái */
  avatarUrl?: string | null;
};

/**
 * Lấy danh sách tác giả nổi bật
 * Ưu tiên endpoint public; nếu BE chưa có, fallback tạm sang admin (nếu được phép).
 */
export async function listFeaturedAuthors(limit = 8): Promise<Author[]> {
  // 1) thử public featured
  try {
    const res = await api.get("/api/v1/authors/featured", { params: { limit } });
    const data = unwrap<Author[] | null>(res.data);
    return Array.isArray(data) ? data.slice(0, limit) : [];
  } catch {
    /* ignore and try next */
  }

  try {
    const res = await api.get("/api/v1/authors", { params: { limit } });
    const data = unwrap<Author[] | null>(res.data);
    return Array.isArray(data) ? data.slice(0, limit) : [];
  } catch {
    /* ignore and try next */
  }

  try {
    const res = await api.get("/api/v1/admin/authors");
    const data = unwrap<Array<{ id: number; name: string; slug: string }> | null>(res.data);
    return Array.isArray(data) ? data.slice(0, limit) : [];
  } catch {
    return [];
  }
}
