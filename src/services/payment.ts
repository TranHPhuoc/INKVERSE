import api from "./api";

export type PaymentProvider = "VNPAY";

export interface ResPaymentCheckout {
  orderCode: string;
  provider: PaymentProvider;
  checkoutUrl: string;
  message?: string | null;
}

export async function createVnpayCheckout(orderCode: string, returnUrl?: string) {
  const params = new URLSearchParams({ provider: "VNPAY" });
  if (returnUrl && returnUrl.trim()) params.set("returnUrl", returnUrl);

  const res = await api.post<{ data?: ResPaymentCheckout }>(
    `/api/v1/payments/${encodeURIComponent(orderCode)}/checkout?${params.toString()}`,
  );

  if (res.data && "data" in res.data) {
    return res.data.data as ResPaymentCheckout;
  }
  return res.data as ResPaymentCheckout;
}

export interface ResVnpReturn {
  orderCode?: string;
  responseCode?: string;
  bankCode?: string;
}

export async function parseVnpayReturnRaw(rawQuery: string) {
  const url = `/api/v1/payments/vnpay/return?${rawQuery.replace(/^\?/, "")}`;
  const res = await api.get<ResVnpReturn>(url);
  return res.data;
}
