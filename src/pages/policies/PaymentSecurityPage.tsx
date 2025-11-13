import React from "react";
import PolicyShell from "@/components/PolicyShell";

export default function PaymentSecurityPage() {
  return (
    <PolicyShell
      title="CHÍNH SÁCH BẢO MẬT THANH TOÁN"
    >
      <div className="space-y-5 text-[15.5px] leading-7 text-zinc-800">
        <p>
          Hệ thống thanh toán của INKVERSE được cung cấp bởi các đối tác cổng thanh toán
          đã được cấp phép tại Việt Nam. Chúng tôi tuân thủ tiêu chuẩn bảo mật ngành và
          chỉ tiếp nhận các thông tin tối thiểu cần thiết để xử lý giao dịch.
        </p>

        <h2 className="mt-6 text-xl font-semibold">1. Chuẩn bảo mật</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kết nối <b>SSL/TLS</b> trong suốt quá trình nhập – truyền dữ liệu.</li>
          <li>Đối tác thanh toán đạt chứng nhận <b>PCI-DSS</b>.</li>
          <li>Xác thực <b>OTP</b> / 3DS theo cơ chế của ngân hàng phát hành.</li>
          <li>Mã hoá, tokenization – INKVERSE <i>không</i> lưu số thẻ của khách hàng.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">2. Lưu trữ thông tin</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Chúng tôi chỉ lưu mã giao dịch, mã đơn hàng, phương thức thanh toán, ngân hàng.</li>
          <li>Số thẻ, ngày hết hạn, CVV… được lưu (nếu có) tại hệ thống của cổng thanh toán.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Sự cố &amp; hỗ trợ</h2>
        <p>
          Khi nghi ngờ giao dịch bất thường, vui lòng liên hệ ngân hàng phát hành thẻ và thông báo ngay cho INKVERSE
          qua <b>announcements.pkbooks@gmail.com</b> để được phối hợp tra soát.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Cập nhật</h2>
        <p>
          Chính sách có thể thay đổi để phù hợp quy định mới; phiên bản cập nhật sẽ được đăng công khai.
        </p>
      </div>
    </PolicyShell>
  );
}
