// src/types/img.ts
// Placeholder fallback (tuỳ thay bằng ảnh của mày)
export const PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='640'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='Inter, system-ui, sans-serif' font-size='14' fill='#9ca3af'>
        No Image
      </text>
    </svg>`
    );

/**
 * Chuẩn hoá URL ảnh để <img> dùng trực tiếp:
 * - null/undefined -> PLACEHOLDER
 * - Firebase Storage (public token) -> đảm bảo có alt=media
 * - Signed URL (X-Goog-Algorithm…) -> giữ nguyên (không chèn alt=media)
 * - Các URL bình thường -> trả nguyên
 */
export function resolveThumb(
    url?: string | null,
    opts?: { ensureAltMedia?: boolean }
): string {
    const ensureAlt = opts?.ensureAltMedia ?? true;
    if (!url || typeof url !== "string" || !url.trim()) return PLACEHOLDER;

    const u = url.trim();

    // V4 signed URL của GCS/Firebase: chứa X-Goog-Algorithm => giữ nguyên
    if (/[\?&]X-Goog-Algorithm=/.test(u)) return u;

    // Đường dẫn kiểu firebasestorage.googleapis.com/v0/b/.../o/xxx?token=...
    if (ensureAlt && /firebasestorage\.googleapis\.com\/v0\/b\//.test(u)) {
        if (!/[?&]alt=media\b/.test(u)) {
            return u + (u.includes("?") ? "&" : "?") + "alt=media";
        }
    }

    // appspot.com (public object) cũng để nguyên
    // CDN/URL khác để nguyên
    return u;
}
