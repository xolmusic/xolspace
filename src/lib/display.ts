export const projectTypeLabel: Record<string, string> = {
  SINGLE: "Single",
  EP: "EP",
  ALBUM: "Album",
};

export const statusLabel: Record<string, string> = {
  UNRELEASED: "Non sorti",
  SCHEDULED: "Programmé",
  RELEASED: "Sorti",
};

export const statusBadgeClass: Record<string, string> = {
  UNRELEASED: "badge-carmin",
  SCHEDULED: "badge-yellow",
  RELEASED: "badge-green",
};

export function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDuration(sec: number | null | undefined) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
