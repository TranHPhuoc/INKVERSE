// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
// import { getInventory } from "../../services/inventory";
// import MovementTable from "../../components/Inventory/MovementTable";
// import InventoryBadge from "../../components/Inventory/InventoryBadge";
// import MovementModal from "../../components/Inventory/MovementModal";
// import { useAuth } from "../../context/useAuth";
//
// export default function BookInventoryPage() {
//   const { bookId } = useParams<{ bookId: string }>();
//   const id = Number(bookId);
//   const { user } = useAuth();
//   const roles = new Set([user?.role].filter(Boolean) as string[]);
//   const isAdmin = roles.has("ADMIN") || roles.has("ROLE_ADMIN");
//
//   const [open, setOpen] = useState(false);
//
//   const { data, isLoading, isError } = useQuery({
//     queryKey: ["inventory", id],
//     queryFn: () => getInventory(id),
//     enabled: Number.isFinite(id),
//   });
//
//   useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
//
//   if (!Number.isFinite(id)) return <div className="p-4">Invalid bookId</div>;
//   if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading inventory…</div>;
//   if (isError || !data) return <div className="p-4 text-sm text-rose-600">Cannot load inventory (need ADMIN?).</div>;
//
//   return (
//     <div className="mx-auto max-w-5xl p-4">
//       <div className="mb-4 flex items-center justify-between">
//         <div className="space-y-1">
//           <h1 className="text-xl font-semibold">Inventory – Book #{id}</h1>
//           <InventoryBadge bookId={id} />
//           <div className="text-sm text-gray-600">Sold: <b>{data.sold}</b></div>
//         </div>
//         {isAdmin && (
//           <button className="rounded-xl bg-indigo-600 px-3 py-2 text-white" onClick={() => setOpen(true)}>
//             Adjust / Move
//           </button>
//         )}
//       </div>
//
//       <div className="rounded-2xl border p-4">
//         <div className="mb-3 text-base font-semibold">Movements</div>
//         <MovementTable bookId={id} />
//       </div>
//
//       {isAdmin && <MovementModal bookId={id} open={open} onClose={() => setOpen(false)} />}
//     </div>
//   );
// }
