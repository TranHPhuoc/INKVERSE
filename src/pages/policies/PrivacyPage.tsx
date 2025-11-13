import React from "react";
import PolicyShell from "@/components/PolicyShell";

export default function PrivacyPage() {
  return (
    <PolicyShell
      title="CHÍNH SÁCH BẢO MẬT DỮ LIỆU CÁ NHÂN"
    >
      <div className="space-y-5 text-[15.5px] leading-7 text-zinc-800">
        <p>
          Chúng tôi tôn trọng quyền riêng tư của khách hàng và cam kết bảo vệ dữ liệu cá nhân khi bạn
          sử dụng dịch vụ INKVERSE. Chính sách này giải thích loại dữ liệu thu thập, mục đích, cách xử lý,
          thời hạn lưu trữ và các quyền của bạn.
        </p>

        <h2 className="mt-6 text-xl font-semibold">1. Sự chấp thuận</h2>
        <p>
          Bằng việc đăng ký/đặt hàng/tiếp tục sử dụng dịch vụ, bạn xác nhận đã đọc và đồng ý cho INKVERSE xử lý
          dữ liệu cá nhân theo chính sách này. Bạn có quyền rút lại sự đồng ý bất cứ lúc nào.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Phạm vi thu thập</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Thông tin định danh: họ tên, email, số điện thoại, địa chỉ giao/thu, giới tính, ngày sinh.</li>
          <li>Thông tin giao dịch: đơn hàng, phương thức thanh toán (không lưu số thẻ), lịch sử mua hàng.</li>
          <li>Dữ liệu kỹ thuật: cookie, địa chỉ IP, loại thiết bị, thời gian truy cập.</li>
          <li><i>Không</i> thu thập dữ liệu nhạy cảm (sức khỏe, tôn giáo, chính trị...).</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Mục đích xử lý</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Xử lý đơn hàng, thanh toán, giao nhận và chăm sóc hậu mãi.</li>
          <li>Duy trì tài khoản, chương trình khách hàng thân thiết, lịch sử mua hàng.</li>
          <li>Cá nhân hoá trải nghiệm, đề xuất sản phẩm phù hợp, phòng chống gian lận.</li>
          <li>Thực hiện yêu cầu pháp lý khi có cơ quan có thẩm quyền.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">4. Cách thức xử lý &amp; chia sẻ</h2>
        <p>
          Dữ liệu được lưu trữ an toàn trên hạ tầng máy chủ của INKVERSE và/hoặc nhà cung cấp dịch vụ
          được ký hợp đồng. Chúng tôi chỉ chia sẻ thông tin cần thiết cho đối tác vận chuyển, cổng thanh toán,
          đơn vị bảo hành… nhằm hoàn thành giao dịch; tuyệt đối không bán dữ liệu cho bên thứ ba.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Thời gian lưu trữ</h2>
        <p>
          Lưu trong suốt thời gian tài khoản còn hoạt động và theo yêu cầu kế toán – pháp luật; hoặc cho tới khi bạn yêu cầu xóa (nếu pháp luật cho phép).
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Quyền của bạn</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Truy cập, chỉnh sửa, xoá dữ liệu; rút lại sự đồng ý; yêu cầu hạn chế xử lý.</li>
          <li>Yêu cầu cung cấp bản sao dữ liệu; khiếu nại khi phát hiện vi phạm.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">7. An toàn dữ liệu</h2>
        <p>
          INKVERSE áp dụng các biện pháp kỹ thuật và tổ chức để bảo vệ dữ liệu (mã hoá, phân quyền truy cập,
          sao lưu, giám sát an ninh…). Khi phát sinh sự cố, chúng tôi sẽ phối hợp cơ quan chức năng và thông báo theo quy định.
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Liên hệ</h2>
        <p>
          Email: <b>announcements.pkbooks@gmail.com</b> · Hotline: <b>0399 684 813</b> / <b>0335 863 953</b>.
        </p>
      </div>
    </PolicyShell>
  );
}
