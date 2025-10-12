// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { listMovements } from "../../services/inventory";
// import type { ResMovementLog } from "../../services/inventory";
// import type { SpringPage } from "../../types/books";
//
// type Props = {
//   bookId: number;
//   bookTitle?: string;
//   open: boolean;
//   onClose: () => void;
// };
//
// const TABS = [
//   { key: "ALL", label: "Tất cả" },
//   { key: "IN", label: "Nhập kho (IN)" },
//   { key: "OUT", label: "Xuất kho (OUT)" },
//   { key: "ADJUST", label: "Điều chỉnh (ADJUST)" },
// ] as const;
//
// export default function BookInventoryDrawer({ bookId, bookTitle, open, onClose }: Props) {
//   const [tab, setTab] = useState<"ALL" | "IN" | "OUT" | "ADJUST">("ALL");
//
//   const { data, isLoading, isError } = useQuery<SpringPage<ResMovementLog>>({
//     queryKey: ["movements", bookId],
//     queryFn: () => listMovements({ bookId, page: 0, size: 100 }),
//     enabled: open && !!bookId,
//     staleTime: 30_000,
//     placeholderData: (prev) => prev,
//   });
//
//   const rows: ResMovementLog[] =
//     (data?.content ?? []).filter((m) => tab === "ALL" || m.type === tab);
//
//   if (!open) return null;
//
//   return (
//     <div className="fixed inset-0 z-50 flex">
//       <div className="flex-1 bg-black/40" onClick={onClose} />
//       <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto">
//         {/* Header */}
//         <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
//           <div>
//             <div className="text-sm text-gray-500">Book #{bookId}</div>
//             <div className="text-lg font-semibold">{bookTitle ?? "Inventory history"}</div>
//           </div>
//           <button onClick={onClose} className="rounded-lg border px-3 py-1.5">
//             Close
//           </button>
//         </div>
//
//         {/* Tabs */}
//         <div className="flex border-b">
//           {TABS.map((t) => (
//             <button
//               key={t.key}
//               onClick={() => setTab(t.key)}
//               className={`flex-1 py-2 text-sm font-medium border-b-2 ${
//                 tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500"
//               }`}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>
//
//         {/* Body */}
//         <div className="p-4 text-sm">
//           {isLoading ? (
//             <div className="text-gray-500">Đang tải dữ liệu…</div>
//           ) : isError ? (
//             <div className="text-rose-600">Không thể tải lịch sử.</div>
//           ) : rows.length === 0 ? (
//             <div className="text-gray-500 text-center py-8">Chưa có lịch sử cho tab này.</div>
//           ) : (
//             <div className="overflow-x-auto rounded-xl border">
//               <table className="min-w-[680px] w-full text-sm">
//                 <thead className="bg-gray-50 text-left">
//                 <tr>
//                   <th className="px-3 py-2 w-20">ID</th>
//                   <th className="px-3 py-2">Loại</th>
//                   <th className="px-3 py-2">Δ</th>
//                   <th className="px-3 py-2">Qty After</th>
//                   <th className="px-3 py-2">Lý do</th>
//                   <th className="px-3 py-2">Thời gian</th>
//                 </tr>
//                 </thead>
//                 <tbody>
//                 {rows.map((m) => (
//                   <tr key={m.id} className="border-t">
//                     <td className="px-3 py-2">{m.id}</td>
//                     <td className="px-3 py-2">
//                         <span
//                           className={`rounded-full px-2 py-0.5 ring-1 text-xs ${
//                             m.type === "IN"
//                               ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
//                               : m.type === "OUT"
//                                 ? "bg-amber-50 text-amber-700 ring-amber-200"
//                                 : "bg-sky-50 text-sky-700 ring-sky-200"
//                           }`}
//                         >
//                           {m.type}
//                         </span>
//                     </td>
//                     <td className="px-3 py-2">{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
//                     <td className="px-3 py-2">{m.quantityAfter}</td>
//                     <td className="px-3 py-2">{m.reason ?? "-"}</td>
//                     <td className="px-3 py-2">{new Date(m.createdAt).toLocaleString()}</td>
//                   </tr>
//                 ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
