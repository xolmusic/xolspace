// Fusionne un modele d'email avec les donnees d'un contact et d'une campagne.
// Variables supportees : {{prenom}}, {{nom}}, {{media}}, {{artiste}},
// {{projet}}, {{pitch}}, {{lien}}, {{signature}}.

export type MergeData = {
  contactName?: string | null;
  organization?: string | null;
  artistName?: string | null;
  projectName?: string | null;
  pitch?: string | null;
  link?: string | null;
  signature?: string | null;
};

export const MERGE_VARIABLES = [
  { token: "{{prenom}}", desc: "Prénom du contact" },
  { token: "{{nom}}", desc: "Nom complet du contact" },
  { token: "{{media}}", desc: "Média / organisation" },
  { token: "{{artiste}}", desc: "Nom de l'artiste" },
  { token: "{{projet}}", desc: "Nom du projet" },
  { token: "{{pitch}}", desc: "Pitch du morceau" },
  { token: "{{lien}}", desc: "Lien d'écoute privé" },
  { token: "{{signature}}", desc: "Signature du label" },
];

function firstName(full?: string | null): string {
  if (!full) return "";
  return full.trim().split(/\s+/)[0];
}

export function mergeTemplate(template: string, data: MergeData): string {
  if (!template) return "";
  const map: Record<string, string> = {
    "{{prenom}}": firstName(data.contactName),
    "{{nom}}": data.contactName ?? "",
    "{{media}}": data.organization ?? "",
    "{{artiste}}": data.artistName ?? "",
    "{{projet}}": data.projectName ?? "",
    "{{pitch}}": data.pitch ?? "",
    "{{lien}}": data.link ?? "",
    "{{signature}}": data.signature ?? "",
  };
  return template.replace(/\{\{\s*(prenom|nom|media|artiste|projet|pitch|lien|signature)\s*\}\}/g, (m) => {
    const key = m.replace(/\s+/g, "");
    return map[key] ?? m;
  });
}
