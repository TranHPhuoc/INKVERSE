// src/services/payment.ts
import api from "./api";

/* ===================== Types ===================== */
export type PaymentProvider = "VNPAY";

export interface ResPaymentCheckout {
  orderCode: string;
  provider: PaymentProvider;
  checkoutUrl: string;
  message?: string | null;
}

export interface ResVnpReturn {
  orderCode?: string | undefined;
  responseCode?: string | undefined;
  bankCode?: string | undefined;
}

/* ===================== Create VNPay Checkout ===================== */
export async function createVnpayCheckout(
  orderCode: string,
  returnUrl?: string
): Promise<ResPaymentCheckout> {
  const params = new URLSearchParams({ provider: "VNPAY" });
  if (returnUrl && returnUrl.trim()) params.set("returnUrl", returnUrl);

  const res = await api.post<{ data?: ResPaymentCheckout } | ResPaymentCheckout>(
    `/api/v1/payments/${encodeURIComponent(orderCode)}/checkout?${params.toString()}`
  );

  if ("data" in res.data && typeof (res.data as { data?: unknown }).data === "object") {
    return (res.data as { data: ResPaymentCheckout }).data;
  }
  return res.data as ResPaymentCheckout;
}

/* ===================== Parse VNPay Return ===================== */

export async function parseVnpayReturnRaw(rawQuery: string): Promise<ResVnpReturn> {
  const qs = rawQuery.replace(/^\?/, "");
  const url = `/api/v1/payments/vnpay/return?${qs}`;

  const res = await api.get<{ data?: ResVnpReturn } | ResVnpReturn>(url);

  const payload: ResVnpReturn =
    "data" in res.data && typeof (res.data as { data?: unknown }).data === "object"
      ? (res.data as { data: ResVnpReturn }).data
      : (res.data as ResVnpReturn);

  const usp = new URLSearchParams(qs);

  const orderCode = payload?.orderCode ?? usp.get("vnp_TxnRef") ?? undefined;
  const responseCode = payload?.responseCode ?? usp.get("vnp_ResponseCode") ?? undefined;
  const bankCode = payload?.bankCode ?? usp.get("vnp_BankCode") ?? undefined;

  const merged: ResVnpReturn = {};
  if (orderCode !== undefined) merged.orderCode = orderCode;
  if (responseCode !== undefined) merged.responseCode = responseCode;
  if (bankCode !== undefined) merged.bankCode = bankCode;

  return merged;
}

export async function getVnpayReturnInfo(rawQuery: string): Promise<ResVnpReturn> {
  return parseVnpayReturnRaw(rawQuery);
}
