import api from "./api";

/* ------------ Types ------------ */
export type ResRating = {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  score: number;
  content?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type RatingPage = {
  content: ResRating[];
  totalElements: number;
  totalPages: number;
  number: number; // current page (0-based)
  size: number;
};

export type ResRatingSummary = {
  average: number | null;
  count: number;
  distribution?: Record<number, number>; // {1..5: count}
  percent?: Record<number, number>; // {1..5: percent}
};

/** unwrap payload kiểu {statusCode,error,message,data} hoặc trả raw */
function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

/* ------------ API ------------ */
export async function getRatingSummary(bookId: number): Promise<ResRatingSummary> {
  const res = await api.get(`/api/v1/books/${bookId}/ratings/summary`);
  return unwrap<ResRatingSummary>(res.data);
}

export async function listRatings(
  bookId: number,
  params: { page?: number; size?: number; sort?: "new" | "old" | "high" | "low" } = {},
): Promise<RatingPage> {
  const { page = 0, size = 5, sort = "new" } = params;
  const res = await api.get(`/api/v1/books/${bookId}/reviews`, { params: { page, size, sort } });
  return unwrap<RatingPage>(res.data);
}

export async function myRating(bookId: number): Promise<ResRating | null> {
  const res = await api.get(`/api/v1/books/${bookId}/ratings/me`);
  const data = unwrap<ResRating | null>(res.data);
  return (data as any) ?? null;
}

export async function upsertRating(
  bookId: number,
  body: { score: number; content?: string },
): Promise<ResRating> {
  // BE nhận POST /books/{bookId}/ratings
  const res = await api.post(`/api/v1/books/${bookId}/ratings`, body);
  return unwrap<ResRating>(res.data);
}

export async function deleteRating(id: number): Promise<void> {
  await api.delete(`/api/v1/ratings/${id}`);
}
