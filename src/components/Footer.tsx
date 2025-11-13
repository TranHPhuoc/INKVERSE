import React from "react";
import { motion } from "framer-motion";
import logo from "../assets/logoweb.png";

const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: "DỊCH VỤ",
      items: [
        { label: "Điều khoản sử dụng", href: "/dieu-khoan" },
        { label: "Chính sách bảo mật thông tin cá nhân", href: "/bao-mat" },
        { label: "Chính sách bảo mật thanh toán", href: "/thanh-toan" },
      ],
    },
    {
      title: "HỖ TRỢ",
      items: [
        { label: "Chính sách đổi - trả - hoàn tiền", href: "/doi-tra" },
        { label: "Chính sách bảo hành - bồi hoàn", href: "/bao-hanh" },
        { label: "Chính sách vận chuyển", href: "/van-chuyen" },
      ],
    },
    {
      title: "TÀI KHOẢN CỦA TÔI",
      items: [
        { label: "Thay đổi địa chỉ khách hàng", href: "/tai-khoan/dia-chi" },
        { label: "Chi tiết tài khoản", href: "/tai-khoan/ho-so-cua-toi" },
        { label: "Lịch sử mua hàng", href: "/lich-su-mua-hang" },
      ],
    },
  ] as const;

  return (
    <footer className="mt-auto bg-gradient-to-b from-[#e8ecf3] via-[#dbe3ed] to-[#cfd8e3] text-slate-800">
      <div className={`${SHELL} grid grid-cols-2 gap-8 py-12 md:grid-cols-4`}>
        {/* logo + tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <img src={logo} alt="INKVERSE" className="h-22" />
        </motion.div>

        {/* columns */}
        {cols.map((sec) => (
          <div key={sec.title}>
            <h4 className="mb-3 font-semibold tracking-wide text-slate-900 uppercase">
              {sec.title}
            </h4>
            <ul className="space-y-2 text-[15px]">
              {sec.items.map((i) => (
                <li key={i.href}>
                  <a
                    href={i.href}
                    className="inline-block transition-colors text-slate-700 hover:text-rose-600"
                  >
                    {i.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-400/50">
        <div className={`${SHELL} flex items-center justify-between py-4 text-xs text-slate-600`}>
          <p>© {year} INKVERSE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
