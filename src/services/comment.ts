import axios from "./api";
import type { ApiEnvelope } from "../types/http";

export type ResComment = {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  parentId?: number | null;
  status: string;
  likeCount: number;
  likedByMe?: boolean | null;
  children?: ResComment[];
};

export type CommentPage = {
  content: ResComment[];
  page: number;
  size: number;
  totalPages: number;
  totalComments: number;
};

export async function listComments(
  bookId: number,
  params: { page?: number; size?: number; sort?: "new" | "old" },
) {
  // ⬇️ unwrap: ApiEnvelope<CommentPage>
  const { data } = await axios.get<ApiEnvelope<CommentPage>>(`/api/v1/books/${bookId}/comments`, {
    params,
  });
  return data.data; // <- trả về CommentPage thuần
}

export async function createComment(bookId: number, body: { content: string; parentId?: number }) {
  const { data } = await axios.post<ApiEnvelope<ResComment>>(
    `/api/v1/books/${bookId}/comments`,
    body,
  );
  return data.data; // <- trả về ResComment thuần
}

export async function updateComment(id: number, body: { content: string }) {
  const { data } = await axios.put<ApiEnvelope<ResComment>>(`/api/v1/comments/${id}`, body);
  return data.data;
}

export async function deleteComment(id: number) {
  await axios.delete<ApiEnvelope<null>>(`/api/v1/comments/${id}`);
}

export async function likeComment(id: number): Promise<void> {
  await axios.put(`/api/v1/comment/${id}/like`);
}

export async function unlikeComment(id: number): Promise<void> {
  await axios.delete(`/api/v1/comment/${id}/like`);
}
