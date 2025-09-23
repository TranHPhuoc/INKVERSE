import { useEffect, useState } from "react";

/* ========== Types ========== */
export type Province = { code: number; name: string };
export type District = { code: number; name: string; province_code: number };
export type Ward = { code: number; name: string; district_code: number };

/* ========== Remote API endpoints ========== */
const API = {
  provinces: "https://provinces.open-api.vn/api/?depth=1",
  districts: (provCode: number) => `https://provinces.open-api.vn/api/p/${provCode}?depth=2`,
  wards: (distCode: number) => `https://provinces.open-api.vn/api/d/${distCode}?depth=2`,
};

/* ========== Utils ========== */
function readCache<T>(k: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(k) || "null") as T | null;
  } catch {
    return null;
  }
}
function writeCache<T>(k: string, v: T): void {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // ignore
  }
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name);
}

function isNameCodeArray(x: unknown): x is Array<{ code: number; name: string }> {
  return (
    Array.isArray(x) &&
    x.every((i) => i && typeof i.code === "number" && typeof i.name === "string")
  );
}
function hasDistricts(x: unknown): x is { districts: Array<{ code: number; name: string }> } {
  return typeof x === "object" && x !== null && isNameCodeArray((x as any).districts);
}
function hasWards(x: unknown): x is { wards: Array<{ code: number; name: string }> } {
  return typeof x === "object" && x !== null && isNameCodeArray((x as any).wards);
}

/* ========== Hook ========== */
export default function useVnLocation() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState({ p: false, d: false, w: false });

  /* ---- load provinces once ---- */
  useEffect(() => {
    const cached = readCache<Province[]>("vn_p");
    if (cached?.length) {
      setProvinces(cached);
      return;
    }
    (async () => {
      setLoading((s) => ({ ...s, p: true }));
      try {
        const res = await fetch(API.provinces);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isNameCodeArray(data)) throw new Error("Bad provinces payload");
        const list: Province[] = data.slice().sort(byName);
        setProvinces(list);
        writeCache("vn_p", list);
      } catch (err) {
        console.error("Load provinces failed:", err);
      } finally {
        setLoading((s) => ({ ...s, p: false }));
      }
    })();
  }, []);

  /* ---- load districts by province ---- */
  const loadDistricts = async (provinceCode: number | null): Promise<void> => {
    setDistricts([]);
    setWards([]);
    if (!provinceCode) return;

    setLoading((s) => ({ ...s, d: true }));
    try {
      const key = `vn_d_${provinceCode}`;
      const cached = readCache<District[]>(key);
      if (cached?.length) {
        setDistricts(cached);
        return;
      }

      const res = await fetch(API.districts(provinceCode));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      if (!hasDistricts(data)) throw new Error("Bad districts payload");

      const list: District[] = data.districts
        .map((d) => ({ code: d.code, name: d.name, province_code: provinceCode }))
        .sort(byName);
      setDistricts(list);
      writeCache(key, list);
    } catch (err) {
      console.error("Load districts failed:", err);
    } finally {
      setLoading((s) => ({ ...s, d: false }));
    }
  };

  /* ---- load wards by district ---- */
  const loadWards = async (districtCode: number | null): Promise<void> => {
    setWards([]);
    if (!districtCode) return;

    setLoading((s) => ({ ...s, w: true }));
    try {
      const key = `vn_w_${districtCode}`;
      const cached = readCache<Ward[]>(key);
      if (cached?.length) {
        setWards(cached);
        return;
      }

      const res = await fetch(API.wards(districtCode));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      if (!hasWards(data)) throw new Error("Bad wards payload");

      const list: Ward[] = data.wards
        .map((w) => ({ code: w.code, name: w.name, district_code: districtCode }))
        .sort(byName);
      setWards(list);
      writeCache(key, list);
    } catch (err) {
      console.error("Load wards failed:", err);
    } finally {
      setLoading((s) => ({ ...s, w: false }));
    }
  };

  return { provinces, districts, wards, loadDistricts, loadWards, loading };
}
