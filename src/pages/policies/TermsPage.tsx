import React from "react";
import PolicyShell from "@/components/PolicyShell";

export default function TermsPage() {
  return (
    <PolicyShell
      title="ĐIỀU KHOẢN SỬ DỤNG"
    >
      <div className="space-y-5 text-[15.5px] leading-7 text-zinc-800">
        <p>
          Chào mừng bạn đến với <b>INKVERSE</b>. Khi truy cập, duyệt nội dung hoặc mua sắm trên
          website/app INKVERSE, bạn đồng ý bị ràng buộc bởi Điều Khoản Sử Dụng này.
          Mục tiêu của chúng tôi là xây dựng một không gian mua sách thân thiện, an toàn và minh bạch cho mọi khách hàng.
          Nếu có câu hỏi, vui lòng liên hệ <b>0399 684 813 (Khanh)</b>, <b>0335 863 953 (Phước) </b>
          hoặc email <b>announcements.pkbooks@gmail.com</b>.
        </p>

        <h2 className="mt-8 text-xl font-semibold">1. Tài khoản &amp; bảo mật</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Người dùng cần cung cấp thông tin chính xác khi tạo tài khoản; bạn chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động phát sinh từ tài khoản.</li>
          <li>Khi phát hiện truy cập trái phép, hãy thông báo ngay cho INKVERSE để được hỗ trợ khóa/khôi phục.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">2. Hành vi bị cấm</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Can thiệp trái phép vào hệ thống, thay đổi dữ liệu, quét lỗ hổng, phát tán mã độc.</li>
          <li>Đăng tải nội dung vi phạm pháp luật, xúc phạm, kỳ thị, mạo danh, hoặc xâm phạm quyền sở hữu trí tuệ.</li>
          <li>Lợi dụng chương trình khuyến mãi, điểm thưởng, mã giảm giá trái mục đích.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Đơn hàng &amp; giá</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Giá hiển thị đã bao gồm VAT (nếu có) và có thể thay đổi không cần báo trước cho tới khi bạn hoàn tất thanh toán.</li>
          <li>INKVERSE có quyền từ chối/huỷ đơn trong các trường hợp sai giá hiển thị, hết hàng, hoặc nghi ngờ gian lận; mọi khoản đã thanh toán sẽ được hoàn lại theo Chính sách Hoàn tiền.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">4. Nội dung &amp; bản quyền</h2>
        <p>
          Tất cả hình ảnh, mô tả, bài viết, giao diện và mã nguồn thuộc sở hữu của INKVERSE hoặc được cấp phép sử dụng.
          Việc sao chép, trích dẫn, khai thác cho mục đích thương mại cần có sự đồng ý bằng văn bản.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Quyền riêng tư</h2>
        <p>
          Việc thu thập, sử dụng và lưu trữ dữ liệu cá nhân tuân theo
          <a className="text-rose-600 hover:underline" href="/bao-mat"> Chính Sách Bảo Mật dữ liệu cá nhân</a>.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Trách nhiệm &amp; giới hạn trách nhiệm</h2>
        <p>
          INKVERSE nỗ lực cung cấp dịch vụ ổn định; tuy nhiên có thể phát sinh gián đoạn do bảo trì,
          sự cố đường truyền, sự kiện bất khả kháng. Trong phạm vi pháp luật cho phép, INKVERSE không chịu trách nhiệm
          cho thiệt hại gián tiếp, hệ quả phát sinh từ việc truy cập/ sử dụng dịch vụ.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Sửa đổi điều khoản</h2>
        <p>
          INKVERSE có thể cập nhật Điều khoản để phù hợp quy định pháp luật và vận hành.
          Phiên bản mới sẽ được đăng công khai; việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa chấp thuận các thay đổi.
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Liên hệ</h2>
        <p>
          Hotline: <b>0399 684 813</b> / <b>0335 863 953</b> · Email: <b>announcements.pkbooks@gmail.com</b>.
        </p>
      </div>
    </PolicyShell>
  );
}
