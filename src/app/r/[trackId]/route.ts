import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/display";

// Clic d'un destinataire sur le lien d'ecoute d'une campagne.
// On incremente le compteur (tracking fiable), puis on redirige vers
// la page d'ecoute privee. Aucune authentification (lien public).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  const base = appUrl();

  const recipient = await prisma.campaignRecipient.findUnique({
    where: { trackId },
    include: { campaign: true },
  });

  if (!recipient) {
    return NextResponse.redirect(base, 302);
  }

  // Comptabiliser le clic (1er clic horodate).
  await prisma.campaignRecipient
    .update({
      where: { id: recipient.id },
      data: {
        clickCount: { increment: 1 },
        firstClickAt: recipient.firstClickAt ?? new Date(),
      },
    })
    .catch(() => {});

  const token = recipient.campaign.shareToken;
  const dest = token ? `${base}/s/${token}` : base;
  return NextResponse.redirect(dest, 302);
}
