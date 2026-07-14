import { prisma } from "@/lib/prisma";

// Desinscription d'un destinataire (obligation legale anti-spam).
// Le lien figure en pied de chaque email de campagne.
export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}) {
  const { trackId } = await params;

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { trackId },
    include: { contact: true },
  });

  if (recipient && !recipient.unsubscribed) {
    await prisma.campaignRecipient
      .update({ where: { id: recipient.id }, data: { unsubscribed: true } })
      .catch(() => {});
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/xol-logo.png" alt="XOL Music" style={{ width: 120, marginBottom: 24 }} />
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Désinscription confirmée</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          {recipient
            ? "Vous ne recevrez plus d'emails de cette campagne. Merci."
            : "Ce lien n'est plus valide."}
        </p>
      </div>
    </main>
  );
}
