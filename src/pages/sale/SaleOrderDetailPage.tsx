import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    saleGetOrder, saleUpdateStatus, saleUpdatePayment, saleUpdateShipping,
    saleAssignOrder, saleAddNote, saleCancelOrder, saleRefundManual
} from "../../services/sale/sale-order";
import type { ResOrderAdmin } from "../../types/sale-order";
import {
    ORDER_STATUS, PAYMENT_STATUS, REFUND_METHOD,
    type OrderStatus, type PaymentStatus, type RefundMethod,
} from "../../types/sale-order";
import { OrderStatusBadge, PaymentStatusBadge } from "../../components/sale/StatusBadge";
import OrderItemsTable from "../../components/sale/OrderItemsTable";

const nf = new Intl.NumberFormat("vi-VN");

export default function SaleOrderDetailPage() {
    const { id } = useParams();
    const orderId = Number(id);
    const [o, setO] = useState<ResOrderAdmin | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    async function refresh() {
        setLoading(true); setErr(null);
        try {
            const data = await saleGetOrder(orderId);
            setO(data);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e.message || "Load lỗi");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [orderId]);

    async function onUpdateStatus(status: OrderStatus) {
        await saleUpdateStatus(orderId, { status }); await refresh();
    }
    async function onUpdatePayment(paymentStatus: PaymentStatus, paidAt?: string | null) {
        await saleUpdatePayment(orderId, { paymentStatus, paidAt: paidAt || undefined }); await refresh();
    }
    async function onUpdateShipping(payload: { fee?: string; carrier?: string; track?: string; shippedAt?: string }) {
        await saleUpdateShipping(orderId, {
            fee: payload.fee, shippingCarrier: payload.carrier, trackingCode: payload.track, shippedAt: payload.shippedAt,
        }); await refresh();
    }
    async function onAssign(assigneeId: number) { await saleAssignOrder(orderId, { assigneeId }); await refresh(); }
    async function onAddNote(note: string) { await saleAddNote(orderId, { note }); }
    async function onCancel(reason: string) { await saleCancelOrder(orderId, { reason }); await refresh(); }
    async function onRefundManual(amount: string, method: RefundMethod) {
        await saleRefundManual(orderId, { amount, method }); await refresh();
    }

    if (loading) return <div>Đang tải...</div>;
    if (err) return <div className="text-red-600">{err}</div>;
    if (!o) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Đơn hàng #{o.code}</h1>
                <div className="flex items-center gap-2">
                    <OrderStatusBadge value={o.status} />
                    <PaymentStatusBadge value={o.paymentStatus} />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                    <div className="rounded-2xl border p-4 shadow-sm bg-gradient-to-br from-white to-gray-50">
                        <div className="font-medium mb-2">Thông tin giao hàng</div>
                        <div className="text-sm">
                            <div>{o.shippingAddress?.receiverName} — {o.shippingAddress?.receiverPhone}</div>
                            <div>{o.shippingAddress?.receiverEmail}</div>
                            <div>
                                {[o.shippingAddress?.line1, o.shippingAddress?.line2, o.shippingAddress?.ward, o.shippingAddress?.district, o.shippingAddress?.province]
                                    .filter(Boolean).join(", ")}
                            </div>
                        </div>
                    </div>

                    <OrderItemsTable items={o.items} />
                </div>

                {/* RIGHT PANEL */}
                <div className="space-y-4">
                    <ActionCard title="Chuyển trạng thái">
                        <div className="grid grid-cols-2 gap-2">
                            {[ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED].map(s => (
                                <StyledButton key={s} onClick={() => onUpdateStatus(s)}>{s}</StyledButton>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Lưu ý: BE đã chặn chuyển sai (vd SHIPPED khi chưa có shippingFee hoặc đơn chưa PAID).
                        </p>
                    </ActionCard>

                    <ActionCard title="Cập nhật thanh toán">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                const status = fd.get("paymentStatus") as PaymentStatus;
                                const paidAt = (fd.get("paidAt") as string) || undefined;
                                await onUpdatePayment(status, paidAt);
                                (e.currentTarget as HTMLFormElement).reset();
                            }}
                            className="space-y-2"
                        >
                            <select name="paymentStatus" className="w-full rounded-xl border px-3 py-2 cursor-pointer" defaultValue={o.paymentStatus}>
                                {Object.values(PAYMENT_STATUS).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input name="paidAt" className="w-full rounded-xl border px-3 py-2"
                                   placeholder="ISO paidAt (tuỳ chọn) vd: 2025-09-18T12:34:56Z" />
                            <StyledButton type="submit">Cập nhật</StyledButton>
                        </form>
                    </ActionCard>

                    <ActionCard title="Thông tin vận chuyển">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                await onUpdateShipping({
                                    fee: (fd.get("fee") as string) || undefined,
                                    carrier: (fd.get("carrier") as string) || undefined,
                                    track: (fd.get("tracking") as string) || undefined,
                                    shippedAt: (fd.get("shippedAt") as string) || undefined,
                                });
                            }}
                            className="space-y-2"
                        >
                            <input name="fee" className="w-full rounded-xl border px-3 py-2" placeholder="Phí vận chuyển (BigDecimal)" />
                            <input name="carrier" className="w-full rounded-xl border px-3 py-2" placeholder="Hãng vận chuyển" />
                            <input name="tracking" className="w-full rounded-xl border px-3 py-2" placeholder="Mã vận đơn" />
                            <input name="shippedAt" className="w-full rounded-xl border px-3 py-2" placeholder="ISO shippedAt" />
                            <StyledButton type="submit">Lưu</StyledButton>
                        </form>
                        <p className="mt-2 text-xs text-gray-500">Đổi trạng thái sang SHIPPED dùng khối “Chuyển trạng thái”.</p>
                    </ActionCard>

                    <ActionCard title="Giao nhân viên phụ trách">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                const id = Number(fd.get("assigneeId") || 0);
                                if (id > 0) await onAssign(id);
                            }}
                            className="flex gap-2"
                        >
                            <input name="assigneeId" className="flex-1 rounded-xl border px-3 py-2" placeholder="UserId nhân viên" />
                            <StyledButton type="submit" className="w-auto">Giao</StyledButton>
                        </form>
                        <div className="text-sm text-gray-600 mt-1">
                            Hiện tại: {o.assigneeName ?? (o.assigneeId ? `#${o.assigneeId}` : "Chưa có")}
                        </div>
                    </ActionCard>

                    <ActionCard title="Thêm ghi chú nội bộ">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                const note = String(fd.get("note") || "");
                                if (note.trim()) await onAddNote(note);
                                (e.currentTarget as HTMLFormElement).reset();
                            }}
                            className="space-y-2"
                        >
                            <textarea name="note" className="w-full rounded-xl border px-3 py-2" placeholder="Nội dung ghi chú..." />
                            <StyledButton type="submit">Thêm</StyledButton>
                        </form>
                    </ActionCard>

                    <ActionCard title="Huỷ đơn">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                const reason = String(fd.get("reason") || "");
                                if (reason.trim()) await onCancel(reason);
                            }}
                            className="space-y-2"
                        >
                            <input name="reason" className="w-full rounded-xl border px-3 py-2" placeholder="Lý do huỷ" />
                            <StyledButton type="submit" className="text-rose-600 hover:bg-rose-50">Huỷ đơn</StyledButton>
                        </form>
                    </ActionCard>

                    <ActionCard title="Hoàn tiền thủ công (manual)">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget as HTMLFormElement);
                                const amount = String(fd.get("amount") || "");
                                const method = fd.get("method") as RefundMethod;
                                if (amount && method) await onRefundManual(amount, method);
                            }}
                            className="space-y-2"
                        >
                            <input name="amount" className="w-full rounded-xl border px-3 py-2" placeholder="Số tiền (BigDecimal)" />
                            <select name="method" className="w-full rounded-xl border px-3 py-2 cursor-pointer">
                                {Object.values(REFUND_METHOD).map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <StyledButton type="submit">Hoàn tiền</StyledButton>
                        </form>
                    </ActionCard>
                </div>
            </div>

            {/* Totals */}
            <div className="rounded-2xl border p-4 grid sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white/60">
                <Money label="Tạm tính" value={nf.format(Number(o.subtotal))} />
                <Money label="Phí ship" value={nf.format(Number(o.shippingFee ?? 0))} />
                <Money label="Giảm" value={nf.format(Number(o.discount ?? 0))} />
                <Money label="Tổng" value={nf.format(Number(o.total))} strong />
            </div>
        </div>
    );
}

function ActionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <div className="font-medium mb-2">{title}</div>
            {children}
        </div>
    );
}

function StyledButton(
    { className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
    return (
        <button
            {...props}
            className={
                "rounded-xl border px-3 py-2 hover:bg-gray-100 cursor-pointer transition shadow-sm active:scale-[0.98] " +
                className
            }
            type={props.type ?? "button"}
        />
    );
}

function Money({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-gray-600">{label}</span>
            <span className={strong ? "font-semibold text-lg" : "font-medium"}>{value}</span>
        </div>
    );
}
