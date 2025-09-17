import api from "./api";

export type ApiEnvelope<T> = {
    statusCode: number;
    error: unknown;
    message: string;
    data: T;
};

function unwrap<T>(raw: unknown): T {
    const obj = raw as { data?: T };
    return (obj && "data" in obj ? (obj.data as T) : (raw as T));
}

export type Address = {
    id: number;
    userId: number;
    fullName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    province: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
};

export type AddressCreate = {
    fullName: string;
    phone: string;
    line1: string;
    ward: string;
    district: string;
    province: string;
    makeDefault?: boolean | null;
};

const BASE = "/api/v1/address";

export async function listMyAddresses(): Promise<Address[]> {
    const res = await api.get<ApiEnvelope<Address[]> | Address[]>(BASE);
    return unwrap<Address[]>(res.data);
}

/** Tạo địa chỉ mới */
export async function createMyAddress(payload: AddressCreate): Promise<Address> {
    const body = {
        fullName: payload.fullName,
        phone: payload.phone,
        line1: payload.line1,
        ward: payload.ward,
        district: payload.district,
        province: payload.province,
        makeDefault: payload.makeDefault,
    };
    const res = await api.post<ApiEnvelope<Address> | Address>(BASE, body);
    return unwrap<Address>(res.data);
}

/** Cập nhật địa chỉ */
export async function updateMyAddress(id: number, payload: AddressCreate): Promise<Address> {
    const body = {
        fullName: payload.fullName,
        phone: payload.phone,
        line1: payload.line1,
        ward: payload.ward,
        district: payload.district,
        province: payload.province,
        makeDefault: payload.makeDefault,
    };
    const res = await api.put<ApiEnvelope<Address> | Address>(`${BASE}/${id}`, body);
    return unwrap<Address>(res.data);
}

/** Xóa địa chỉ */
export async function deleteMyAddress(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}

/** Đặt làm địa chỉ mặc định */
export async function setDefaultAddress(id: number): Promise<Address> {
    const res = await api.patch<ApiEnvelope<Address> | Address>(`${BASE}/${id}`);
    return unwrap<Address>(res.data);
}
