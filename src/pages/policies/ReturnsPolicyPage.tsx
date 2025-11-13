import React from "react";

export default function WarrantyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">CHÍNH SÁCH BẢO HÀNH – BỒI HOÀN</h1>

      <div className="space-y-5 text-[15.5px] leading-7 text-justify text-zinc-800">
        <h2 className="text-xl font-semibold">1. Hình thức bảo hành</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><b>Bảo hành chính hãng</b>: khách hàng mang sản phẩm tới TTBH của hãng theo tem/phiếu/QR kích hoạt.</li>
          <li><b>Qua INKVERSE</b>: liên hệ chúng tôi để được hướng dẫn gửi sản phẩm; thời gian dự kiến 21–45 ngày (không gồm vận chuyển), tùy linh kiện.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">2. Điều kiện bảo hành miễn phí</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Còn thời hạn bảo hành; tem/phiếu nguyên vẹn; lỗi kỹ thuật từ nhà sản xuất.</li>
          <li>Các trường hợp bể/biến dạng/cháy nổ/ẩm mốc/thiệt hại do người dùng có thể phát sinh phí hoặc từ chối bảo hành.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Bồi hoàn</h2>
        <p>
          Nếu không thể bảo hành trong thời gian hợp lý, INKVERSE/nhà sản xuất có thể đổi sản phẩm tương đương
          hoặc hoàn tiền theo giá trị thực tế thanh toán.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Lưu ý</h2>
        <p>
          INKVERSE hiện chưa áp dụng bảo hành cho quà tặng kèm; yêu cầu bảo hành cần cung cấp hình ảnh/clip mô tả lỗi rõ ràng.
        </p>
      </div>
    </div>
  );
}
