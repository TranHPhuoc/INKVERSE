import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { parseVnpayReturnRaw, type ResVnpReturn } from "../services/payment";
import { getOrderByCode } from "../services/order";

type Status = "success" | "pending" | "fail" | null;

export default function PaymentReturnPage() {
  const [status, setStatus] = useState<Status>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const qs = window.location.search;
    if (!qs.includes("vnp_")) return;

    (async () => {
      try {
        const ret: ResVnpReturn = await parseVnpayReturnRaw(qs);
        const orderCode = ret.orderCode ?? "";
        const responseCode = ret.responseCode ?? "";

        if (!orderCode) {
          setStatus(responseCode === "00" ? "pending" : "fail");
          setMessage(
            responseCode === "00"
              ? "VNPay báo thành công, đang chờ xác nhận."
              : "Thanh toán VNPay thất bại. Vui lòng thử lại.",
          );
          return;
        }

        // Poll 1 vài lần xem BE đã chốt đơn chưa
        let paid = false;
        for (let i = 0; i < 5 && !paid; i++) {
          try {
            const o = await getOrderByCode(orderCode);
            paid = o?.paymentStatus === "PAID";
          } catch {
            /* ignore */
          }
          if (!paid) await new Promise((r) => setTimeout(r, 1200));
        }

        if (paid) {
          setStatus("success");
          setMessage("Thanh toán thành công. Bạn có thể tiếp tục mua sắm.");
        } else if (responseCode === "00") {
          setStatus("pending");
          setMessage("VNPay đã ghi nhận. Đang chờ hệ thống xác nhận thanh toán.");
        } else {
          setStatus("fail");
          setMessage("Thanh toán VNPay không thành công.");
        }
      } catch {
        setStatus("fail");
        setMessage("Không đọc được kết quả thanh toán VNPay.");
      }
    })();
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className={
          "max-w-md rounded-xl border bg-white px-6 py-5 shadow-sm " +
          (status === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : status === "pending"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : status === "fail"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "")
        }
      >
        <div className="flex items-center gap-3">
          {status === null && (
            <motion.span
              className="inline-block h-3 w-3 rounded-full bg-rose-600"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              aria-hidden="true"
            />
          )}
          <p className="text-base font-medium">
            {status === "success"
              ? "Thanh toán thành công"
              : status === "pending"
                ? "Đang chờ xác nhận"
                : status === "fail"
                  ? "Thanh toán thất bại"
                  : "Đang xử lý kết quả thanh toán VNPay..."}
          </p>
        </div>
        {message && <div className="mt-2 text-sm">{message}</div>}
        <div className="mt-4 flex gap-3">
          {status === "success" && (
            <button
              onClick={() => (window.location.href = "/")}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:opacity-90"
            >
              Về trang chủ
            </button>
          )}
          {status === "pending" && (
            <button
              onClick={() => (window.location.href = "/don-hang")}
              className="rounded-lg bg-amber-600 px-4 py-2 text-white hover:opacity-90"
            >
              Xem đơn hàng
            </button>
          )}
          {status === "fail" && (
            <button
              onClick={() => (window.location.href = "/checkout")}
              className="rounded-lg border px-4 py-2 hover:bg-white/60"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
