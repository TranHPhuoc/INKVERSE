import type { ResOrderItem } from "../../types/sale-order";

const nf = new Intl.NumberFormat("vi-VN");

export default function OrderItemsTable({ items }: { items: ResOrderItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white/70 backdrop-blur">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-2 text-left">Sản phẩm</th>
            <th className="px-4 py-2 text-right">Đơn giá</th>
            <th className="px-4 py-2 text-center">SL</th>
            <th className="px-4 py-2 text-right">Tạm tính</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((it, i) => (
            <tr key={`${it.bookId}-${i}`} className="align-top transition hover:bg-gray-50">
              {/* Cột sản phẩm + ảnh */}
              <td className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-gray-500">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="leading-snug">
                    <div className="font-medium text-gray-900">{it.title}</div>
                    {it.sku && <div className="text-xs text-gray-500">SKU: {it.sku}</div>}
                  </div>
                </div>
              </td>

              {/* Giá, SL, Tạm tính */}
              <td className="px-4 py-3 text-right">{nf.format(Number(it.price))}</td>
              <td className="px-4 py-3 text-center">{it.qty}</td>
              <td className="px-4 py-3 text-right">{nf.format(Number(it.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
