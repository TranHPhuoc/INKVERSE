// src/services/admin/sale.ts
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

type ApiEnvelope<T> = { statusCode?: number; message?: string; data?: T };
type WithData<T> = { data: T };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function hasDataProp<T>(value: unknown): value is WithData<T> {
  return isObject(value) && "data" in value && (value as WithData<T>).data !== undefined && (value as WithData<T>).data !== null;
}

function pickData<T>(raw: unknown): T {
  let cur: unknown = raw;
  for (let i = 0; i < 2; i++) {
    if (hasDataProp<T>(cur)) {
      cur = (cur as WithData<T>).data;
    } else {
      break;
    }
  }
  return cur as T;
}

export async function fetchSales(params: {
  page?: number;
  size?: number;
  sort?: string;
}): Promise<SpringPage<SaleUser>> {
  const { page = 0, size = 10, sort = "id,desc" } = params;

  const res: AxiosResponse<ApiEnvelope<SpringPage<SaleUser>> | SpringPage<SaleUser>> =
    await api.get("/api/v1/sales", { params: { page, size, sort } });

  const pageData = pickData<SpringPage<SaleUser>>(res.data);

  return {
    content: pageData?.content ?? [],
    totalElements: pageData?.totalElements ?? (pageData?.content?.length ?? 0),
    totalPages: pageData?.totalPages ?? 1,
    number: pageData?.number ?? page,
    size: pageData?.size ?? size,
  };
}

export async function createSale(payload: CreateSalePayload): Promise<CreateSaleResponse> {
  const res: AxiosResponse<ApiEnvelope<CreateSaleResponse> | CreateSaleResponse> =
    await api.post("/api/v1/users/create/sale", payload);
  return pickData<CreateSaleResponse>(res.data);
}

export async function deleteSale(id: number): Promise<void> {
  await api.delete(`/api/v1/users/${id}`);
}
