// // src/services/inventory.ts
// import api from "./api";
//
// /* ===== Types ===== */
// export type ResInventory = {
//   bookId: number;
//   stock: number;
//   sold: number;
// };
//
// export type ResMovement = {
//   bookId: number;
//   oldQuantity: number;
//   delta: number;
//   newQuantity: number;
//   movementId: number;
// };
//
// export type ResMovementLog = {
//   id: number;
//   bookId: number;
//   type: "IN" | "OUT" | "ADJUST";
//   delta: number;
//   quantityAfter: number;
//   reason?: string | null;
//   createdAt: string; // ISO (BE trả Instant)
// };
//
// export type PageResp<T> = {
//   content: T[];
//   number: number;
//   size: number;
//   totalElements: number;
//   totalPages: number;
// };
//
// /* ===== Calls ===== */
// export async function getInventory(bookId: number) {
//   const { data } = await api.get<ResInventory>(`/api/v1/admin/inventory/${bookId}`);
//   return data;
// }
//
// export async function listMovements(params: { bookId: number; page?: number; size?: number }) {
//   const { data } = await api.get<PageResp<ResMovementLog>>(
//     `/api/v1/admin/inventory/movements`,
//     { params },
//   );
//   return data;
// }
//
// export async function applyMovement(body: {
//   bookId: number;
//   type: "IN" | "OUT" | "ADJUST";
//   quantity: number;
//   reason?: string;
// }) {
//   const { data } = await api.post<ResMovement>(`/api/v1/admin/inventory/movements`, body);
//   return data;
// }
