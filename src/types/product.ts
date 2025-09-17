export type Product = {
    id: string;
    title: string;
    image: string;
    price: number;
    oldPrice?: number;
    rating?: number;
    ratingCount?: number;
    slug?: string;
    discountPct?: number;
};
