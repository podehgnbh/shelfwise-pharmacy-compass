export const USERNAME_DOMAIN = "medicine.app";

export function normalizeUsername(u: string) {
  return u.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export function usernameToEmail(u: string) {
  return `${normalizeUsername(u)}@${USERNAME_DOMAIN}`;
}

/** A, B, ... Z, AA, AB ... */
export function shelfCode(index: number) {
  let s = "";
  let n = index;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function normalizeText(t: string | null | undefined) {
  return (t ?? "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function isSubsequence(q: string, t: string) {
  let i = 0;
  for (const c of t) if (c === q[i]) i++;
  return i === q.length;
}

function distance(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Smart fuzzy score (0 = no match). Tolerates typos and Arabic letter variants. */
export function matchScore(query: string, fields: (string | null | undefined)[]) {
  const q = normalizeText(query);
  if (!q) return 1;
  let best = 0;
  for (const f of fields) {
    const t = normalizeText(f);
    if (!t) continue;
    if (t === q) best = Math.max(best, 100);
    else if (t.startsWith(q)) best = Math.max(best, 90);
    else if (t.includes(q)) best = Math.max(best, 75);
    else {
      for (const word of t.split(" ")) {
        const w = word.slice(0, Math.max(q.length, 1) + 1);
        const d = distance(q, w.slice(0, q.length));
        const allowed = q.length <= 3 ? 0 : q.length <= 6 ? 1 : 2;
        if (d <= allowed) best = Math.max(best, 60 - d * 10);
      }
      if (q.length >= 3 && isSubsequence(q, t)) best = Math.max(best, 30);
    }
  }
  return best;
}

export function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export type ExpiryStatus = "expired" | "soon" | "ok" | "none";

export function expiryStatus(days: number | null): ExpiryStatus {
  if (days === null) return "none";
  if (days < 0) return "expired";
  if (days <= 90) return "soon";
  return "ok";
}

export function describeDays(days: number | null) {
  if (days === null) return "بدون تاريخ";
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
  if (days === 0) return "ينتهي اليوم";
  if (days < 60) return `باقي ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 24) return `باقي ${months} شهر`;
  return `باقي ${(days / 365).toFixed(1)} سنة`;
}
