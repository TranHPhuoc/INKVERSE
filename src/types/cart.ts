export type ResCartItem = {
    bookId: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    onSale: boolean;
    qty: number;
    selected: boolean;
    originalUnitPrice: string | number; // BigDecimal -> string/number (axios có thể parse number)
    unitPrice: string | number;
    lineTotal: string | number;
    stockAvailable: number;
};

export type ResCartSummary = {
    items: ResCartItem[];
    subtotal: string | number;
    discountTotal: string | number;
    shippingFee: string | number;
    taxTotal: string | number;
    grandTotal: string | number;
    totalItems: number;
    totalSelected: number;
};

export type ReqAddItem = { bookId: number; qty: number };
export type ReqUpdateItem = { qty?: number; selected?: boolean };
export type ReqSelectAll = { selected?: boolean };
export type ClearReq = { onlyUnselected?: boolean };
