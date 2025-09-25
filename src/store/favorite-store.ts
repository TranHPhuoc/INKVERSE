// src/store/favorites.ts
import { getMyFavorites } from "../services/favorite";

// ====== state ======
type PersistShape = {
  ids: number[];
  counts: Record<number, number>; // bookId -> favoriteCount (từ API /favorites/me)
};

let ids = new Set<number>();
let counts: Record<number, number> = {};

let userKey = "guest";
const KEY = () => `FAV_${userKey}_V1`;

let loadedOnce = false;

// ====== persist helpers ======
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(KEY());
    if (!raw) return;
    const obj = JSON.parse(raw) as PersistShape;
    ids = new Set<number>(obj.ids ?? []);
    counts = obj.counts ?? {};
  } catch {
    /* ignore */
  }
}
function saveToLocal() {
  try {
    const obj: PersistShape = { ids: [...ids], counts };
    localStorage.setItem(KEY(), JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

// ====== public API ======
/** Gọi khi login / logout để tách dữ liệu theo user */
export function configureFavoritesForUser(userId?: number | string | null) {
  userKey = (userId ?? "guest").toString();
  // reset & nạp lại theo user
  ids = new Set();
  counts = {};
  loadedOnce = false;
  loadFromLocal();
}

/** Đồng bộ từ server lần đầu cho user hiện tại */
export async function preloadFavoritesFromServer(): Promise<void> {
  if (loadedOnce) return;
  try {
    let page = 0;
    const size = 200;

    const first = await getMyFavorites(page, size);
    first.content.forEach((b) => {
      ids.add(b.id);
      counts[b.id] = Number(b.favoriteCount ?? 0);
    });

    for (page = 1; page < first.totalPages; page++) {
      const res = await getMyFavorites(page, size);
      res.content.forEach((b) => {
        ids.add(b.id);
        counts[b.id] = Number(b.favoriteCount ?? 0);
      });
    }
    saveToLocal();
  } catch {
    // ignore
  } finally {
    loadedOnce = true;
  }
}

export function isFavorite(id: number): boolean {
  return ids.has(id);
}
export function getCount(id: number): number | undefined {
  const v = counts[id];
  return typeof v === "number" ? v : undefined;
}
export function setCount(id: number, value: number) {
  counts[id] = Math.max(0, Number(value) || 0);
  saveToLocal();
  window.dispatchEvent(
    new CustomEvent("favorite:count-changed", { detail: { bookId: id, count: counts[id] } }),
  );
}

/** Cập nhật liked + bắn sự kiện. Nếu biết count mới thì truyền kèm để persist. */
export function applyFavoriteToggle(id: number, liked: boolean, newCount?: number) {
  if (liked) ids.add(id);
  else ids.delete(id);

  if (typeof newCount === "number") {
    setCount(id, newCount);
  } else {
    saveToLocal();
  }

  window.dispatchEvent(new CustomEvent("favorite:changed", { detail: { bookId: id, liked } }));
}

/** Debug optional */
export const _favDebug = {
  dump() {
    return { userKey, ids: [...ids], counts: { ...counts } };
  },
};
