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

// --- Libelles CRM ---
export const contactTypeLabel: Record<string, string> = {
  JOURNALIST: "Journaliste",
  RADIO: "Radio",
  BLOG: "Blog",
  PLAYLIST_CURATOR: "Curateur playlist",
  MANAGER: "Manager",
  BOOKER: "Booker",
  LABEL: "Label",
  STUDIO: "Studio",
  INFLUENCER: "Influenceur",
  TV: "TV",
};

export const CONTACT_TYPES = [
  "JOURNALIST", "RADIO", "BLOG", "PLAYLIST_CURATOR", "MANAGER",
  "BOOKER", "LABEL", "STUDIO", "INFLUENCER", "TV",
];

export const interactionStatusLabel: Record<string, string> = {
  TO_CONTACT: "À contacter",
  SENT: "Envoyé",
  FOLLOWED_UP: "Relancé",
  REPLIED: "Répondu",
  POSITIVE: "Positif",
  NEGATIVE: "Négatif",
  NO_REPLY: "Sans réponse",
};

export const INTERACTION_STATUSES = [
  "TO_CONTACT", "SENT", "FOLLOWED_UP", "REPLIED", "POSITIVE", "NEGATIVE", "NO_REPLY",
];

export const interactionStatusBadge: Record<string, string> = {
  TO_CONTACT: "badge",
  SENT: "badge-yellow",
  FOLLOWED_UP: "badge-yellow",
  REPLIED: "badge",
  POSITIVE: "badge-green",
  NEGATIVE: "badge-carmin",
  NO_REPLY: "badge-carmin",
};

// --- Type de relation artiste ---
export const relationTypeLabel: Record<string, string> = {
  LABEL: "Label",
  EXTERNAL: "Externe",
};

export const relationTypeBadge: Record<string, string> = {
  LABEL: "badge-green",
  EXTERNAL: "badge-yellow",
};

// --- Campagnes ---
export const campaignStatusLabel: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "En cours",
  CLOSED: "Terminée",
};
export const campaignStatusBadge: Record<string, string> = {
  DRAFT: "badge",
  ACTIVE: "badge-yellow",
  CLOSED: "badge-green",
};

export const recipientStatusLabel: Record<string, string> = {
  TO_SEND: "À envoyer",
  SENT: "Envoyé",
  REPLIED: "Répondu",
  PUBLISHED: "Publié",
  DECLINED: "Décliné",
  NO_REPLY: "Sans réponse",
};
export const RECIPIENT_STATUSES = [
  "TO_SEND", "SENT", "REPLIED", "PUBLISHED", "DECLINED", "NO_REPLY",
];
export const recipientStatusBadge: Record<string, string> = {
  TO_SEND: "badge",
  SENT: "badge-yellow",
  REPLIED: "badge-yellow",
  PUBLISHED: "badge-green",
  DECLINED: "badge-carmin",
  NO_REPLY: "badge-carmin",
};
