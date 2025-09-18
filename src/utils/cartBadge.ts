const KEY = "CART_BADGE_COUNT";
let lastSetAt = 0;

export function getBadgeCache(): number {
    const n = Number(localStorage.getItem(KEY) || "0");
    return Number.isFinite(n) ? n : 0;
}

export function setBadgeCache(n: number) {
    lastSetAt = Date.now();
    localStorage.setItem(KEY, String(Math.max(0, n|0)));
}

export function recentlySet(ms = 800) {
    return Date.now() - lastSetAt < ms;
}
