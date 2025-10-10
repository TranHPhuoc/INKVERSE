// src/utils/date-helpers.ts

/** 'YYYY-MM' theo local time*/
export function fmtMonthLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthStr(mm: string): { y: number; m: number } {
  const [ys, ms] = (mm ?? "").split("-") as [string, string];
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1 };
  }
  return { y, m };
}

export function toOffsetString(
  y: number,
  m: number,
  d: number,
  hh = 0,
  mi = 0,
  ss = 0,
  offsetMinutes = 7 * 60, // VN = +07:00
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mi)}:${pad(ss)}${sign}${oh}:${om}`;
}

export function lastDayOfMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/**
 * Khoảng thời gian theo múi giờ VN
 * - from: 01/tháng 00:00:00+07:00
 * - to  : ngày cuối tháng 23:59:59+07:00
 */
export function monthRangeVNInclusive(y: number, m: number, offsetMinutes = 7 * 60) {
  const from = toOffsetString(y, m, 1, 0, 0, 0, offsetMinutes);
  const last = lastDayOfMonth(y, m);
  const to = toOffsetString(y, m, last, 23, 59, 59, offsetMinutes);
  return { from, to };
}

/** Khoảng tháng trước */
export function prevMonthRangeVNInclusive(y: number, m: number, offsetMinutes = 7 * 60) {
  const pm = m === 1 ? 12 : m - 1;
  const py = m === 1 ? y - 1 : y;
  return monthRangeVNInclusive(py, pm, offsetMinutes);
}
