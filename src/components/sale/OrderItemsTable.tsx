import type { ResOrderItem } from "../../types/sale-order";

export default function OrderItemsTable({ items }: { items: ResOrderItem[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                <tr>
                    <th className="px-4 py-2 text-left">Sách</th>
                    <th className="px-4 py-2 text-right">Đơn giá</th>
                    <th className="px-4 py-2 text-center">SL</th>
                    <th className="px-4 py-2 text-right">Tạm tính</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {items.map((it, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2">{it.bookTitle}</td>
                        <td className="px-4 py-2 text-right">{it.price}</td>
                        <td className="px-4 py-2 text-center">{it.qty}</td>
                        <td className="px-4 py-2 text-right">{it.subtotal}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
