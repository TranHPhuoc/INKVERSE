// import { useState } from "react";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { applyMovement } from "../../services/inventory";
//
// type Props = { bookId: number; open: boolean; onClose: () => void };
//
// export default function MovementModal({ bookId, open, onClose }: Props) {
//   const qc = useQueryClient();
//   const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN");
//   const [quantity, setQuantity] = useState<number>(1);
//   const [reason, setReason] = useState<string>("");
//
//   const { mutateAsync, isPending, error } = useMutation({
//     mutationFn: () => applyMovement({ bookId, type, quantity, reason }),
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: ["inventory", bookId] });
//       qc.invalidateQueries({ queryKey: ["movements", bookId] });
//       onClose();
//     },
//   });
//
//   if (!open) return null;
//
//   return (
//     <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
//       <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
//         <div className="mb-3 text-lg font-semibold">Inventory Movement</div>
//
//         <label className="mb-2 block text-sm font-medium">Type</label>
//         <select className="mb-3 w-full rounded-lg border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as any)}>
//           <option value="IN">IN (Nhập kho)</option>
//           <option value="OUT">OUT (Xuất kho)</option>
//           <option value="ADJUST">ADJUST (Đặt lại tồn)</option>
//         </select>
//
//         <label className="mb-2 block text-sm font-medium">Quantity</label>
//         <input
//           type="number"
//           min={0}
//           className="mb-3 w-full rounded-lg border px-3 py-2"
//           value={quantity}
//           onChange={(e) => setQuantity(parseInt(e.target.value || "0", 10))}
//         />
//
//         <label className="mb-2 block text-sm font-medium">Reason (optional)</label>
//         <input
//           className="mb-4 w-full rounded-lg border px-3 py-2"
//           value={reason}
//           onChange={(e) => setReason(e.target.value)}
//           placeholder="Lý do (stock count, damaged, return...)"
//         />
//
//         {error ? <p className="mb-3 text-sm text-rose-600">Thao tác thất bại. {(error as any)?.message ?? ""}</p> : null}
//
//         <div className="flex justify-end gap-2">
//           <button className="rounded-xl border px-3 py-2" onClick={onClose} disabled={isPending}>Cancel</button>
//           <button
//             className="rounded-xl bg-indigo-600 px-3 py-2 font-medium text-white disabled:opacity-60"
//             onClick={() => mutateAsync()}
//             disabled={isPending || (type !== "ADJUST" && quantity <= 0)}
//           >
//             {isPending ? "Saving..." : "Save"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
