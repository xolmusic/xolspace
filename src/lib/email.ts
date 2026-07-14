import { Resend } from "resend";
import { appUrl } from "./display";

// Client Resend. La cle vient des variables d'environnement.
function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// Adresse d'expedition verifiee (domaine authentifie chez Resend).
// Ex : "promo@xolmusic.space". Definie en variable d'environnement.
export function fromAddress(fromName?: string | null) {
  const email = process.env.CAMPAIGN_FROM_EMAIL ?? "promo@xolmusic.space";
  const name = (fromName ?? "XOL Music").replace(/["\n\r]/g, "");
  return `${name} <${email}>`;
}

// Transforme le corps texte en HTML simple, en remplacant :
// - le lien d'ecoute {{lien}} deja fusionne par une URL de tracking
// - en ajoutant un pied de page de desinscription (obligatoire).
export function buildHtml(opts: {
  bodyText: string;
  listenUrl: string | null;
  trackUrl: string | null;
  unsubscribeUrl: string;
}): string {
  const { bodyText, listenUrl, trackUrl, unsubscribeUrl } = opts;

  // Echapper le HTML puis re-injecter les liens.
  const escaped = bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let html = escaped.replace(/\n/g, "<br>");

  // Remplacer l'URL d'ecoute brute par le lien de tracking (si present).
  if (listenUrl && trackUrl) {
    const safeListen = listenUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(safeListen, "g"),
      `<a href="${trackUrl}" style="color:#33305E;font-weight:600">Écouter le morceau</a>`
    );
  }

  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#211E42">
${html}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0">
<p style="font-size:11px;color:#999">
Vous recevez cet email dans le cadre d'une communication professionnelle de XOL Music.
<a href="${unsubscribeUrl}" style="color:#999">Se désinscrire</a>.
</p>
</body></html>`;
}

// Envoie un email unitaire. Retourne { ok } ou { error }.
export async function sendEmail(opts: {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = client();
  if (!resend) return { ok: false, error: "Service d'envoi non configuré (RESEND_API_KEY manquante)." };

  try {
    const res = await resend.emails.send({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Échec d'envoi." };
  }
}

// URLs de tracking et desinscription pour un destinataire donne.
export function trackingUrls(trackId: string) {
  const base = appUrl();
  return {
    clickUrl: `${base}/r/${trackId}`,        // clic -> compte + redirige vers l'ecoute
    unsubscribeUrl: `${base}/u/${trackId}`,  // desinscription
  };
}
