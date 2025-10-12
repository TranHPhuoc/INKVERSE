// import { useQuery } from "@tanstack/react-query";
// import { listMovements, type ResMovementLog, type PageResp } from "../../services/inventory";
//
// type Props = {
//   bookId: number;
//   filterType?: "ALL" | "IN" | "OUT" | "ADJUST";
//   pageSize?: number;
// };
//
// export default function MovementTable({ bookId, filterType = "ALL", pageSize = 50 }: Props) {
//   const { data, isLoading, isError } = useQuery<PageResp<ResMovementLog>>({
//     queryKey: ["movements", bookId, pageSize],
//     queryFn: () => listMovements({ bookId, page: 0, size: pageSize }),
//     staleTime: 30_000,
//   });
//
//   if (isLoading) return <div className="text-sm text-gray-500">Loading movements…</div>;
//   if (isError || !data) return <div className="text-sm text-rose-600">Cannot load movements.</div>;
//
//   const rows = filterType === "ALL" ? data.content : data.content.filter((r) => r.type === filterType);
//
//   return (
//     <div className="overflow-x-auto rounded-xl border">
//       <table className="min-w-[680px] w-full text-sm">
//         <thead className="bg-gray-50 text-left">
//         <tr>
//           <th className="px-3 py-2">#</th>
//           <th className="px-3 py-2">Type</th>
//           <th className="px-3 py-2">Δ</th>
//           <th className="px-3 py-2">Qty After</th>
//           <th className="px-3 py-2">Reason</th>
//           <th className="px-3 py-2">Created At</th>
//         </tr>
//         </thead>
//         <tbody>
//         {rows.map((r) => (
//           <tr key={r.id} className="border-t">
//             <td className="px-3 py-2">{r.id}</td>
//             <td className="px-3 py-2">
//                 <span className={`rounded-full px-2 py-0.5 ring-1 text-xs ${
//                   r.type === "IN" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" :
//                     r.type === "OUT" ? "bg-amber-50 text-amber-700 ring-amber-200" :
//                       "bg-sky-50 text-sky-700 ring-sky-200"
//                 }`}>{r.type}</span>
//             </td>
//             <td className="px-3 py-2">{r.delta > 0 ? `+${r.delta}` : r.delta}</td>
//             <td className="px-3 py-2">{r.quantityAfter}</td>
//             <td className="px-3 py-2">{r.reason ?? "-"}</td>
//             <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
//           </tr>
//         ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
