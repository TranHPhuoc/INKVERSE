export function vnd(x: string | number) {
    const n = typeof x === "string" ? Number(x) : x;
    if (Number.isNaN(n)) return "₫0";
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}
