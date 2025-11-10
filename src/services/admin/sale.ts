import api from "@/services/api";
import type { AxiosResponse } from "axios";

export interface SaleUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  createdAt: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface CreateSalePayload {
  email: string;
  fullname: string;
  phone: string;
}

interface CreateSaleResponse {
  username: string;
  password: string;
}


function unwrap<T>(payload: unknown): T {
  return payload as T;
}


export async function fetchSales(params: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<SpringPage<SaleUser>> {
  const { page = 0, size = 10, sort = "id,desc" } = params;
  const res: AxiosResponse<SpringPage<SaleUser>> = await api.get(
    "/api/v1/sales",
    { params: { page, size, sort } }
  );
  return unwrap<SpringPage<SaleUser>>(res.data);
}

export async function createSale(
  payload: CreateSalePayload
): Promise<CreateSaleResponse> {
  const res: AxiosResponse<CreateSaleResponse> = await api.post(
    "/api/v1/users/create/sale",
    payload
  );
  return unwrap<CreateSaleResponse>(res.data);
}

export async function deleteSale(id: number): Promise<void> {
  await api.delete(`/api/v1/users/${id}`);
}
