// src/pages/policies/ShippingPolicyPage.tsx
import React from "react";
import PolicyShell from "@/components/PolicyShell";

export default function ShippingPolicyPage() {
  return (
    <PolicyShell
      title="Chính sách vận chuyển / Đóng gói"
    >
      <h2 className="text-xl font-semibold text-zinc-900">1. Phạm vi & thời gian giao</h2>
      <p>
        INKVERSE giao hàng toàn quốc. Nếu tất cả sản phẩm đều có sẵn, đơn hàng sẽ được bàn giao
        cho đối tác vận chuyển trong vài giờ làm việc. Bảng thời gian dự kiến (không tính Thứ Bảy,
        Chủ Nhật, ngày lễ):
      </p>

      {/* Bảng thời gian giao dự kiến */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200">
        <table className="min-w-full border-collapse bg-white text-[15px]">
          <caption className="sr-only">Thời gian giao hàng dự kiến theo tuyến/khu vực</caption>
          <thead>
          <tr className="bg-zinc-50/70 text-left text-zinc-700">
            <th className="px-4 py-3 font-semibold">Tuyến</th>
            <th className="px-4 py-3 font-semibold">Khu vực</th>
            <th className="px-4 py-3 font-semibold">Thời gian dự kiến</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
          <tr className="align-top">
            <td rowSpan={2} className="px-4 py-3">
              Hồ Chí Minh ↔ Hồ Chí Minh <br /> Hà Nội ↔ Hà Nội
            </td>
            <td className="px-4 py-3">Nội thành</td>
            <td className="px-4 py-3">1 – 2 ngày</td>
          </tr>
          <tr className="align-top">
            <td className="px-4 py-3">Ngoại thành</td>
            <td className="px-4 py-3">1 – 2 ngày</td>
          </tr>

          <tr className="align-top">
            <td rowSpan={2} className="px-4 py-3">
              Hồ Chí Minh ↔ Miền Nam <br /> Hà Nội ↔ Miền Bắc
            </td>
            <td className="px-4 py-3">Trung tâm Tỉnh/Thành/Thị xã</td>
            <td className="px-4 py-3">2 ngày</td>
          </tr>
          <tr className="align-top">
            <td className="px-4 py-3">Huyện, xã</td>
            <td className="px-4 py-3">2 – 3 ngày</td>
          </tr>

          <tr className="align-top">
            <td rowSpan={2} className="px-4 py-3">
              Hồ Chí Minh ↔ Miền Trung <br /> Hà Nội ↔ Miền Trung
            </td>
            <td className="px-4 py-3">Trung tâm Tỉnh/Thành/Thị xã</td>
            <td className="px-4 py-3">3 ngày</td>
          </tr>
          <tr className="align-top">
            <td className="px-4 py-3">Huyện, xã</td>
            <td className="px-4 py-3">3 – 4 ngày</td>
          </tr>

          <tr className="align-top">
            <td rowSpan={2} className="px-4 py-3">
              Hồ Chí Minh ↔ Miền Bắc <br /> Hà Nội ↔ Miền Nam
            </td>
            <td className="px-4 py-3">Trung tâm Tỉnh/Thành/Thị xã</td>
            <td className="px-4 py-3">4 ngày</td>
          </tr>
          <tr className="align-top">
            <td className="px-4 py-3">Huyện, xã</td>
            <td className="px-4 py-3">4 – 5 ngày</td>
          </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-zinc-600">
        Lưu ý: nếu phải điều hàng từ kho khác, thời gian có thể tăng; mọi phí điều hàng phát sinh do
        điều phối kho sẽ do INKVERSE chịu.
      </p>

      <h2 className="text-xl font-semibold text-zinc-900">2. Bảng giá dịch vụ vận chuyển</h2>
      {/* Bảng phí vận chuyển */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-zinc-200">
        <table className="min-w-full border-collapse bg-white text-[15px]">
          <caption className="sr-only">Bảng giá vận chuyển tham khảo</caption>
          <thead>
          <tr className="bg-zinc-50/70 text-left text-zinc-700">
            <th className="px-4 py-3 font-semibold">Khu vực giao</th>
            <th className="px-4 py-3 font-semibold">Phí vận chuyển (đã gồm VAT)</th>
          </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-zinc-800">
          <tr>
            <td className="px-4 py-4">Nội thành Hồ Chí Minh, Hà Nội</td>
            <td className="px-4 py-4">
              20.000đ / 2kg &nbsp;(+2.000đ mỗi 1kg tiếp theo)
              <div className="mt-1 text-sm text-zinc-600">
                Phí chính xác hiển thị ở bước “Thanh toán”.
              </div>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-4">Các khu vực còn lại</td>
            <td className="px-4 py-4">
              30.000đ / 2kg &nbsp;(+3.000đ mỗi 1kg tiếp theo)
              <div className="mt-1 text-sm text-zinc-600">
                Phí chính xác hiển thị ở bước “Thanh toán”.
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-zinc-900">3. Quy định nhận hàng</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Bưu tá liên hệ trước 3–5 phút; tối đa 3 lần phát trước khi hoàn đơn.</li>
        <li>
          Nếu từ chối vì lỗi từ INKVERSE (không như mô tả, giao trễ…), hoàn lại toàn bộ số tiền
          đã thanh toán.
        </li>
        <li>
          Thùng hàng có dấu hiệu rách/móp/ướt… vui lòng kiểm tra, ghi chú với bưu tá và liên hệ
          INKVERSE trong 48 giờ.
        </li>
      </ul>

      <h2 className="text-xl font-semibold text-zinc-900">4. Đóng gói & yêu cầu đặc biệt</h2>
      <p>
        Sản phẩm được đóng theo chuẩn của INKVERSE. Nếu cần gói quà/đóng gói đặc biệt, ghi chú khi
        đặt hàng (có thể phát sinh phụ phí).
      </p>

      <h2 className="text-xl font-semibold text-zinc-900">5. Tra cứu vận đơn</h2>
      <p>
        Theo dõi lộ trình trên trang đối tác vận chuyển bằng mã vận đơn, hoặc liên hệ CSKH{" "}
        <b>0399 684 813</b> / <b>0335 863 953</b> để được hỗ trợ.
      </p>
    </PolicyShell>
  );
}
