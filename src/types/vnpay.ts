// src/types/vnpay.ts
import type { PaymentStatus } from "./order";

export type VnpReturnInfo = {
  orderCode?: string;
  responseCode?: string; // '00' = gateway ok
  bankCode?: string;
};

export interface SummaryProps {
  loading: boolean;
  error: string | null;
  gatewayOk: boolean;
  paid: boolean;
  failed: boolean;
  orderCode?: string;
}

export const isPaid = (st?: PaymentStatus | null) => st === "PAID";

export const isWaiting = (st?: PaymentStatus | null) => st === "PENDING" || st === "UNPAID";

export const isFinalFail = (st?: PaymentStatus | null) =>
  st === "FAILED" || st === "CANCELED" || st === "REFUNDED" || st === "REFUND_PENDING";
