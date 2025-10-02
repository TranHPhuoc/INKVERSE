// src/pages/VNPayReturnPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, CircleX, RefreshCw } from "lucide-react";
import { getVnpayReturnInfo } from "../services/payment";
import { getOrderByCode } from "../services/order";
import type { ResOrderDetail, PaymentStatus } from "../types/order";
import type { VnpReturnInfo, SummaryProps } from "../types/vnpay";
import { isPaid, isFinalFail, isWaiting } from "../types/vnpay";

export default function VNPayReturnPage() {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [waitingIpn, setWaitingIpn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [returnInfo, setReturnInfo] = useState<VnpReturnInfo | null>(null);
  const [order, setOrder] = useState<ResOrderDetail | null>(null);

  const pollRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const rawQuery = useMemo(() => {
    const s = window.location.search;
    return s.startsWith("?") ? s.slice(1) : s;
  }, []);

  useEffect(() => {
    const clearPoll = () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    (async () => {
      try {
        setLoading(true);
        setVerifying(true);
        setWaitingIpn(false);
        setError(null);

        const info = await getVnpayReturnInfo(rawQuery);
        setReturnInfo(info);
        setVerifying(false);

        const code = info.orderCode;
        if (!code) {
          setError("Thiếu mã đơn hàng trong dữ liệu trả về.");
          setLoading(false);
          return;
        }

        if (info.responseCode === "00") {
          setWaitingIpn(true);
          elapsedRef.current = 0;

          const doPoll = async () => {
            try {
              const od = await getOrderByCode(code);
              setOrder(od);

              const st = od?.paymentStatus as PaymentStatus | undefined;

              if (isPaid(st) || isFinalFail(st)) {
                clearPoll();
                setWaitingIpn(false);
                setLoading(false);
                return;
              }

              elapsedRef.current += 3000;
              if (elapsedRef.current >= 60000) {
                clearPoll();
                setWaitingIpn(false);
                setLoading(false);
                setError(
                  "Xác nhận thanh toán đang chậm. Vui lòng kiểm tra mục Đơn hàng sau ít phút.",
                );
              }
            } catch {
              /**/
            }
          };

          await doPoll();
          pollRef.current = window.setInterval(doPoll, 3000);
        } else {
          setWaitingIpn(false);
          setLoading(false);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Có lỗi khi xử lý VNPay return.";
        setError(msg);
        setVerifying(false);
        setWaitingIpn(false);
        setLoading(false);
      }
    })();

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [rawQuery]);

  const gatewayOk = returnInfo?.responseCode === "00";
  const st = order?.paymentStatus as PaymentStatus | undefined;
  const paid = isPaid(st);
  const failed = isFinalFail(st);
  const stillWaiting = isWaiting(st);

  return (
    <div className="min-h-[70vh] w-full bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-100"
        >
          <h1 className="text-2xl font-semibold">Kết quả thanh toán VNPay</h1>

          <div className="mt-6 space-y-4 text-slate-700">
            <StatusRow
              label="Xác thực dữ liệu trả về"
              active={verifying}
              ok={!verifying}
              warn={false}
            />
            <StatusRow
              label={`Kết quả cổng VNPay: ${returnInfo?.responseCode ?? "-"}`}
              active={!verifying && !waitingIpn}
              ok={gatewayOk}
              warn={!gatewayOk}
            />
            <StatusRow
              label={`Trạng thái đơn hàng: ${waitingIpn ? "Đang chờ IPN..." : (st ?? "Chưa xác định")}`}
              active={waitingIpn}
              ok={paid}
              warn={!paid && !waitingIpn && gatewayOk && (stillWaiting || !failed)}
            />

            <Summary
              loading={loading}
              error={error}
              gatewayOk={gatewayOk}
              paid={paid}
              failed={failed}
              {...(returnInfo?.orderCode ? { orderCode: returnInfo.orderCode } : {})} // tránh truyền undefined khi có exactOptionalPropertyTypes
            />
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              to="/orders"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-90"
            >
              Xem đơn hàng
            </Link>
            <Link to="/" className="rounded-xl bg-slate-100 px-4 py-2 hover:bg-slate-200">
              Về trang chủ
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  active,
  ok,
  warn,
}: {
  label: string;
  active: boolean;
  ok: boolean;
  warn: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {active ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : ok ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : warn ? (
          <RefreshCw className="h-5 w-5 text-amber-500" />
        ) : (
          <CircleX className="h-5 w-5 text-rose-600" />
        )}
      </div>
      <div className="flex-1 font-medium">{label}</div>
    </div>
  );
}

function Summary({ loading, error, gatewayOk, paid, failed, orderCode }: SummaryProps) {
  if (loading) return <div className="mt-6 rounded-xl bg-slate-50 p-4">Đang xử lý kết quả…</div>;
  if (error) return <div className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>;

  if (!gatewayOk) {
    return (
      <div className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">
        Cổng VNPay trả về không thành công. Vui lòng thử lại.
        {orderCode && <div className="text-sm">Mã đơn: {orderCode}</div>}
      </div>
    );
  }
  if (paid) {
    return (
      <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-800">
        Thanh toán thành công 🎉
        {orderCode && <div className="text-sm">Mã đơn: {orderCode}</div>}
      </div>
    );
  }
  if (failed) {
    return (
      <div className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-800">
        Giao dịch không thành công (đã hủy/hoàn/đang hoàn).
        {orderCode && <div className="text-sm">Mã đơn: {orderCode}</div>}
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-800">
      VNPay đã tiếp nhận. Hệ thống đang chờ IPN xác nhận…
      {orderCode && <div className="text-sm">Mã đơn: {orderCode}</div>}
    </div>
  );
}
