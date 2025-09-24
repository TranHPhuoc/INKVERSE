import api from "./api";

export type ResUserDTO = {
  id: number;
  email: string;
  username: string | null;
  fullName: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: "FEMALE" | "MALE" | "OTHER" | null;
  role: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ReqUserUpdate = {
  fullName?: string | null;
  phone?: string | null;
  birthDate?: string | null; // yyyy-MM-dd
  gender?: "FEMALE" | "MALE" | "OTHER" | "";
};

export type ChangePasswordReq = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload && "statusCode" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export async function userGetById(id: number) {
  const res = await api.get(`/api/v1/users/${id}`);
  return unwrap<ResUserDTO>(res.data);
}

/** BE đã có PUT /api/v1/users/me */
export async function userUpdateMe(body: ReqUserUpdate) {
  const res = await api.put(`/api/v1/users/me`, body);
  return unwrap<ResUserDTO>(res.data);
}
export async function changePassword(body: ChangePasswordReq) {
  // BE trả RestResponse<Void> { statusCode, message, ... }
  const res = await api.put(`/api/v1/users/change-password`, body);
  return res.data as { statusCode: number; message?: string; error?: unknown };
}
