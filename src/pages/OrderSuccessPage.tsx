// src/pages/OrderSuccessPage.tsx
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function OrderSuccessPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const code = params.get("code"); // lấy orderCode truyền từ CheckoutPage

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-white via-rose-50/60 to-pink-100/70">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-3xl bg-white shadow-xl p-10 text-center max-w-md mx-auto ring-1 ring-rose-100"
      >
        {/* Icon check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
          className="flex justify-center mb-6"
        >
          <CheckCircle2 className="w-20 h-20 text-emerald-500 drop-shadow-lg" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-semibold text-gray-800"
        >
          Đặt hàng thành công!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-3 text-gray-600 leading-relaxed"
        >
          Cảm ơn bạn đã tin tưởng và lựa chọn <span className="font-semibold text-rose-600">INKVERSE</span> 💖
          <br />
          Đơn hàng của bạn sẽ được xử lý và giao trong thời gian sớm nhất.
        </motion.p>

        {/* Mã đơn hàng */}
        {code && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 rounded-lg bg-rose-50 text-rose-700 px-4 py-2 font-medium"
          >
            Mã đơn hàng: <span className="font-mono">{code}</span>
          </motion.div>
        )}

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex flex-col gap-3"
        >
          <Link
            to="/"
            className="inline-block rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold px-6 py-3 shadow-md hover:shadow-lg hover:opacity-95 transition"
          >
            🛍️ Về lại trang chủ để mua sắm tiếp
          </Link>
          <Link
            to="/orders"
            className="inline-block rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Xem đơn hàng của tôi
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
