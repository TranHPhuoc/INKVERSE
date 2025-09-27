import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PaymentReturnPage() {
  const nav = useNavigate();

  useEffect(() => {
    const qs = window.location.search;
    // Điều hướng về trang checkout để logic hiện tại xử lý & hiển thị banner
    nav(`/checkout${qs}`, { replace: true });
  }, [nav]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
        <motion.span
          className="inline-block h-3 w-3 rounded-full bg-rose-600"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.9, 1, 0.9] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          aria-hidden="true"
        />
        <div className="text-sm text-gray-700">Đang xử lý kết quả thanh toán VNPay...</div>
      </div>
      {/*<noscript>*/}
      {/*  <p className="mt-4 text-center text-sm text-gray-600">*/}
      {/*    Vui lòng bật JavaScript để tiếp tục.*/}
      {/*  </p>*/}
      {/*</noscript>*/}
    </div>
  );
}
