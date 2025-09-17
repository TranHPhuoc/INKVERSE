import React from "react";
import { motion } from "framer-motion";
import logo from "../assets/logoweb.png";

const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white shadow-lg mt-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-3"
                >
                    <img src={logo} alt="INKVERSE" className="h-14" />
                    <p className="text-sm text-gray-400">
                        Chỉ đâu tri thức, lan tỏa đam mê.
                    </p>
                </motion.div>

                {[
                    { title: "Dịch vụ", items: ["Điều khoản", "Bảo mật", "Thanh toán"] },
                    { title: "Hỗ trợ", items: ["Đổi trả", "Bảo hành", "Vận chuyển"] },
                    { title: "Tài khoản", items: ["Địa chỉ", "Chi tiết", "Lịch sử mua"] },
                ].map((sec) => (
                    <div key={sec.title}>
                        <h4 className="font-semibold text-white mb-3">{sec.title}</h4>
                        <ul className="space-y-2 text-sm">
                            {sec.items.map((i) => (
                                <li key={i}>
                                    <a
                                        href="#"
                                        className="hover:text-rose-400 transition-colors"
                                    >
                                        {i}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-700">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 text-xs flex flex-col md:flex-row items-center justify-between gap-2">
                    <p>© {year} INKVERSE. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
