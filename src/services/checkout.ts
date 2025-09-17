import api from "./api";

export type PaymentMethod = "COD" | "BANK_TRANSFER" | "MOMO" | "VNPAY" | "ZALOPAY" | "STRIPE";
export type DeliveryMethod = "STANDARD" | "EXPRESS";

export type PlaceOrderReq = {
    addressId: number;
    paymentMethod: PaymentMethod;
    deliveryMethod: DeliveryMethod;
    note?: string;
};

export type ResOrderCreated = {
    code: string;
    paymentRedirectUrl?: string | null;
};

export async function placeOrder(body: PlaceOrderReq): Promise<ResOrderCreated> {
    const res = await api.post("/api/v1/orders", body);
    return res.data?.data ?? res.data;
}
