import React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import BGCONTACT from "../assets/bgcontact.png"

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ==== HEADER ==== */}
      <header
        className="relative w-full h-64 md:h-72 flex items-center justify-center bg-center bg-cover"
        style={{ backgroundImage: `url(${BGCONTACT})` }}
      >
        <div className="absolute inset-0 bg-white/10" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold">
          Liên hệ với chúng tôi
        </h1>
      </header>


      {/* ==== MAIN ==== */}
      <main className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 px-6 py-16">
        {/* Left Info */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Hãy trò chuyện với chúng tôi</h2>
          <p className="text-zinc-500 mb-8">
            Bạn có thắc mắc, ý kiến đóng góp hoặc đề xuất gì không? Chỉ cần điền vào mẫu và chúng tôi sẽ liên hệ ngay. </p>

          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-zinc-700" />
              <p>
                Hồ Chí Minh
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-zinc-700" />
              <p>0399 684 813 (Khanh)</p>
              <p>0335 863 953 (Phuoc)</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-zinc-700" />
              <p>announcements.pkbooks@gmail.com</p>
            </div>
          </div>
        </section>

        {/* Right Form */}
        <form
          className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-zinc-200 flex flex-col gap-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <input
              type="text"
              placeholder="Họ và tên"
              className="input-field w-full p-2 "
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <input
              type="email"
              placeholder="Email"
              className="input-field p-2"
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              className="input-field p-2"
              required
            />
          </div>

          <textarea
            placeholder="Tin nhắn của bạn..."
            rows={5}
            className="input-field resize-none p-2"
          />

          <button
            type="submit"
            className="cursor-pointer w-full py-3 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 active:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-black/60"
          >
            Gửi tin nhắn
          </button>
        </form>
      </main>
    </div>
  );
}

/* === CSS thêm vào global.css hoặc Tailwind layer === */
// @layer components {
//   .input-field {
//     @apply w-full bg-white border border-zinc-300 rounded-lg px-4 py-3
//            text-zinc-900 placeholder-zinc-400 shadow-sm
//            focus:outline-none focus:ring-2 focus:ring-black/60 focus:border-black;
//   }
// }
