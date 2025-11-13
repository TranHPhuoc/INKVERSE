import React from "react";
import { Mail, MapPin, Phone, Clock} from "lucide-react";
import BGCONTACT from "../assets/bgcontact.png";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ==== HEADER ==== */}
      <header
        className="relative w-full h-64 md:h-72 flex items-center justify-center bg-center bg-cover"
        style={{ backgroundImage: `url(${BGCONTACT})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          Liên hệ với INKVERSE
        </h1>
      </header>

      {/* ==== MAIN ==== */}
      <main className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {/* --- 1. Lời giới thiệu --- */}
        <section className="text-center space-y-4">
          <h2 className="text-3xl font-semibold">Chúng tôi luôn sẵn lòng lắng nghe</h2>
          <p className="text-zinc-600 max-w-4xl mx-auto leading-relaxed">
            Dù bạn là khách hàng thân thiết, một người yêu sách lâu năm hay chỉ vừa ghé thăm INKVERSE lần đầu tiên,
            chúng tôi luôn trân trọng từng khoảnh khắc được đồng hành cùng bạn. Mỗi góp ý, mỗi lời chia sẻ hay thậm chí chỉ là một
            tin nhắn nhỏ bé của bạn đều là động lực giúp chúng tôi không ngừng hoàn thiện và lan tỏa những giá trị tích cực đến cộng đồng yêu sách Việt.
          </p>

          <p className="text-zinc-600 max-w-4xl mx-auto leading-relaxed">
            INKVERSE không chỉ là nơi mua sách – mà còn là không gian để kết nối tâm hồn, để mỗi người đọc tìm thấy sự đồng cảm
            trong từng câu chữ, và để những người làm sách được thấu hiểu, sẻ chia. Chúng tôi tin rằng sự giao tiếp chân thành sẽ
            tạo nên những mối quan hệ bền vững, giúp kiến tạo nên một cộng đồng tri thức nhân văn và sáng tạo.
          </p>

          <p className="text-zinc-600 max-w-4xl mx-auto leading-relaxed">
            Nếu bạn có bất kỳ thắc mắc, mong muốn hợp tác, hay chỉ đơn giản là muốn gửi lời chào, hãy liên hệ với chúng tôi qua
            các kênh dưới đây. INKVERSE luôn ở đây — lắng nghe, thấu hiểu và sẵn sàng kết nối cùng bạn trên hành trình nuôi dưỡng tâm hồn qua từng trang sách.
          </p>
        </section>

        {/* --- 2. Thông tin liên hệ --- */}
        <section className="grid md:grid-cols-3 gap-10 text-center md:text-left">
          <div className="space-y-3">
            <MapPin className="w-6 h-6 mx-auto md:mx-0 text-zinc-800" />
            <h3 className="font-semibold text-xl">Địa chỉ</h3>
            <p className="text-zinc-600">TP. Hồ Chí Minh, Việt Nam</p>
          </div>

          <div className="space-y-3">
            <Phone className="w-6 h-6 mx-auto md:mx-0 text-zinc-800" />
            <h3 className="font-semibold text-xl">Hotline</h3>
            <p className="text-zinc-600">0399 684 813 (Khanh)</p>
            <p className="text-zinc-600">0335 863 953 (Phước)</p>
          </div>

          <div className="space-y-3">
            <Mail className="w-6 h-6 mx-auto md:mx-0 text-zinc-800" />
            <h3 className="font-semibold text-xl">Email</h3>
            <p className="text-zinc-600">announcements.pkbooks@gmail.com</p>
          </div>
        </section>

        {/* --- 3. Giờ làm việc --- */}
        <section className="text-center bg-zinc-50 py-12 rounded-2xl shadow-sm border border-zinc-200">
          <Clock className="w-8 h-8 mx-auto text-zinc-700 mb-3" />
          <h3 className="text-2xl font-semibold mb-2">Giờ làm việc</h3>
          <p className="text-zinc-600">Thứ 2 – Thứ 7: 8h00 – 23h00</p>
          <p className="text-zinc-600">Chủ nhật & Ngày lễ: Nghỉ</p>
        </section>

        {/* --- 5. Bản đồ Google --- */}
        <section className="rounded-2xl overflow-hidden shadow-md border border-zinc-200">
          <iframe
            title="INKVERSE Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.471345345634!2d106.700423!3d10.776889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3dcbf6c6ef%3A0x9cba4c177b!2zSOG7kyBDaMOtbSBOaMOgIFRo4buLIE1pbmggSOG7kyBDaMOtbQ!5e0!3m2!1svi!2s!4v1670000000000!5m2!1svi!2s"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          ></iframe>
        </section>
      </main>
    </div>
  );
}
