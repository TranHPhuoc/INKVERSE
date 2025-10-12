// import { useMemo, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import BookInventoryDrawer from "../../components/Inventory/BookInventoryDrawer";
// import InventoryBadge from "../../components/Inventory/InventoryBadge";
// import { listBooks, searchBooks, type BookListItem, type SpringPage } from "../../types/books";
//
// export default function InventoryIndexPage() {
//   const [keyword, setKeyword] = useState("");
//   const [page, setPage] = useState(0);
//   const size = 12;
//
//   const { data, isLoading, isError } = useQuery<SpringPage<BookListItem>>({
//     queryKey: ["inv-books", keyword, page],
//     queryFn: async () => {
//       const p = page + 1; // BE 1-based
//       return keyword.trim()
//         ? await searchBooks({ q: keyword, page: p, size })
//         : await listBooks({ page: p, size });
//     },
//     staleTime: 30_000,
//     // v5: dùng placeholderData thay cho keepPreviousData
//     placeholderData: (prev) => prev,
//   });
//
//   const books = useMemo(() => data?.content ?? [], [data]);
//   const totalPages = data?.totalPages ?? 1;
//
//   const [drawer, setDrawer] = useState<{ open: boolean; bookId?: number; title?: string }>({
//     open: false,
//   });
//
//   return (
//     <div className="p-4">
//       {/* Header */}
//       <div className="mb-4 flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Inventory</h1>
//         <input
//           className="rounded-lg border px-3 py-2 w-64"
//           placeholder="Tìm sách..."
//           value={keyword}
//           onChange={(e) => {
//             setKeyword(e.target.value);
//             setPage(0);
//           }}
//         />
//       </div>
//
//       {/* Table */}
//       {isLoading ? (
//         <div className="text-sm text-gray-500">Loading books…</div>
//       ) : isError ? (
//         <div className="text-sm text-rose-600">Cannot load books.</div>
//       ) : (
//         <div className="overflow-x-auto rounded-xl border">
//           <table className="min-w-[800px] w-full text-sm">
//             <thead className="bg-gray-50 text-left">
//             <tr>
//               <th className="px-3 py-2 w-16">ID</th>
//               <th className="px-3 py-2">Title</th>
//               <th className="px-3 py-2">Stock</th>
//               <th className="px-3 py-2 w-28">Actions</th>
//             </tr>
//             </thead>
//             <tbody>
//             {books.map((b: BookListItem) => (
//               <tr key={b.id} className="border-t">
//                 <td className="px-3 py-2">{b.id}</td>
//                 <td className="px-3 py-2">{b.title}</td>
//                 <td className="px-3 py-2"><InventoryBadge bookId={b.id} /></td>
//                 <td className="px-3 py-2">
//                   <button
//                     className="rounded-lg border px-2 py-1 hover:bg-gray-50"
//                     onClick={() => setDrawer({ open: true, bookId: b.id, title: b.title })}
//                   >
//                     History
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {books.length === 0 && (
//               <tr>
//                 <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
//                   Không có sách.
//                 </td>
//               </tr>
//             )}
//             </tbody>
//           </table>
//         </div>
//       )}
//
//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="mt-3 flex items-center justify-end gap-2 text-sm">
//           <button
//             className="rounded border px-2 py-1 disabled:opacity-50"
//             onClick={() => setPage((p) => Math.max(0, p - 1))}
//             disabled={page === 0}
//           >
//             Prev
//           </button>
//           <div>Page {page + 1} / {totalPages}</div>
//           <button
//             className="rounded border px-2 py-1 disabled:opacity-50"
//             onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
//             disabled={page + 1 >= totalPages}
//           >
//             Next
//           </button>
//         </div>
//       )}
//
//       {/* Drawer */}
//       {drawer.open && drawer.bookId != null && (
//         <BookInventoryDrawer
//           bookId={drawer.bookId}
//           {...(drawer.title ? { bookTitle: drawer.title } : {})}
//           open={drawer.open}
//           onClose={() => setDrawer({ open: false })}
//         />
//
//       )}
//     </div>
//   );
// }
