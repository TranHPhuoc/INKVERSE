import React from "react";
import { motion } from "framer-motion";
import logo from "../assets/logoweb.png";

const SHELL = "mx-auto w-full max-w-[1550px] px-4 sm:px-6 lg:px-8";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-gray-900 text-white shadow-lg">
      <div className={`${SHELL} grid grid-cols-2 gap-8 py-10 md:grid-cols-4`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <img src={logo} alt="INKVERSE" className="h-14" />
          <p className="text-sm text-gray-400">Chỉ đâu tri thức, lan tỏa đam mê.</p>
        </motion.div>

        {[
          { title: "Dịch vụ", items: ["Điều khoản", "Bảo mật", "Thanh toán"] },
          { title: "Hỗ trợ", items: ["Đổi trả", "Bảo hành", "Vận chuyển"] },
          { title: "Tài khoản", items: ["Địa chỉ", "Chi tiết", "Lịch sử mua"] },
        ].map((sec) => (
          <div key={sec.title}>
            <h4 className="mb-3 font-semibold text-white">{sec.title}</h4>
            <ul className="space-y-2 text-sm">
              {sec.items.map((i) => (
                <li key={i}>
                  <a href="#" className="transition-colors hover:text-rose-400">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700">
        <div
          className={`${SHELL} flex flex-col items-center justify-between gap-2 py-4 text-xs md:flex-row`}
        >
          <p>© {year} INKVERSE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
