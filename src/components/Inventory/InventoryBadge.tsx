// import { useQuery } from "@tanstack/react-query";
// import { getInventory } from "../../services/inventory";
//
// export default function InventoryBadge({ bookId, className = "" }: { bookId: number; className?: string }) {
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ["inventory", bookId],
//     queryFn: () => getInventory(bookId),
//     staleTime: 30_000,
//   });
//
//   if (isLoading) return <span className={`inline-flex animate-pulse rounded-full bg-gray-200 px-2 py-0.5 text-xs ${className}`}>…</span>;
//   if (isError || !data) return <span className={`inline-flex rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-xs ${className}`}>N/A</span>;
//
//   const stock = data.stock ?? 0;
//   const tone =
//     stock === 0 ? "bg-rose-100 text-rose-700 ring-rose-200" :
//       stock <= 10 ? "bg-amber-100 text-amber-700 ring-amber-200" :
//         "bg-emerald-100 text-emerald-700 ring-emerald-200";
//
//   return (
//     <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ${tone} ${className}`}>
//       <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
//       Stock: <strong className="font-semibold">{stock}</strong>
//     </span>
//   );
// }
