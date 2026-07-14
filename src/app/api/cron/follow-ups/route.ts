import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergeTemplate } from "@/lib/merge";
import { sendEmail, buildHtml, fromAddress, trackingUrls } from "@/lib/email";
import { appUrl } from "@/lib/display";
import type { RecipientStatus } from "@prisma/client";

// Cron de relances : appele periodiquement par Vercel Cron.
// Protege par un secret (CRON_SECRET) passe en en-tete Authorization.
// Envoie la 1re relance (J+N1) puis la 2e (J+N2) aux destinataires qui
// n'ont pas repondu/publie/decline et ne sont pas desinscrits.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const base = appUrl();

  // Statuts consideres comme "clos" : on ne relance pas.
  const closed = ["REPLIED", "PUBLISHED", "DECLINED"] as RecipientStatus[];

  // --- 1re relance ---
  const due1 = await prisma.campaignRecipient.findMany({
    where: {
      unsubscribed: false,
      status: { notIn: closed },
      followUp1SentAt: null,
      followUp1DueAt: { not: null, lte: now },
    },
    include: { campaign: { include: { artist: true, project: true } }, contact: true },
    take: 100,
  });

  let sent1 = 0;
  for (const rec of due1) {
    if (!rec.contact.email || !rec.campaign.autoFollowUp) continue;
    const body = rec.campaign.followUp1Body || rec.campaign.emailBody;
    if (!body) continue;
    const ok = await sendFollowUp(rec, body, base);
    if (ok) {
      await prisma.campaignRecipient.update({ where: { id: rec.id }, data: { followUp1SentAt: now } });
      sent1++;
    }
  }

  // --- 2e relance ---
  const due2 = await prisma.campaignRecipient.findMany({
    where: {
      unsubscribed: false,
      status: { notIn: closed },
      followUp1SentAt: { not: null },
      followUp2SentAt: null,
      followUp2DueAt: { not: null, lte: now },
    },
    include: { campaign: { include: { artist: true, project: true } }, contact: true },
    take: 100,
  });

  let sent2 = 0;
  for (const rec of due2) {
    if (!rec.contact.email || !rec.campaign.autoFollowUp) continue;
    const body = rec.campaign.followUp2Body || rec.campaign.followUp1Body || rec.campaign.emailBody;
    if (!body) continue;
    const ok = await sendFollowUp(rec, body, base);
    if (ok) {
      await prisma.campaignRecipient.update({ where: { id: rec.id }, data: { followUp2SentAt: now } });
      sent2++;
    }
  }

  return NextResponse.json({ followUp1: sent1, followUp2: sent2 });
}

type RecipientWithRels = {
  trackId: string;
  contact: { name: string; email: string | null; organization: string | null };
  campaign: {
    emailSubject: string | null;
    shareToken: string | null;
    fromName: string | null;
    pitch: string | null;
    signature: string | null;
    artist: { stageName: string };
    project: { title: string } | null;
  };
};

async function sendFollowUp(rec: RecipientWithRels, bodyTpl: string, base: string): Promise<boolean> {
  const email = rec.contact.email;
  if (!email) return false;

  const listenBase = rec.campaign.shareToken ? `${base}/s/${rec.campaign.shareToken}` : null;
  const { clickUrl, unsubscribeUrl } = trackingUrls(rec.trackId);
  const data = {
    contactName: rec.contact.name,
    organization: rec.contact.organization,
    artistName: rec.campaign.artist.stageName,
    projectName: rec.campaign.project?.title ?? null,
    pitch: rec.campaign.pitch,
    link: listenBase,
    signature: rec.campaign.signature,
  };
  const subject = "Relance — " + mergeTemplate(rec.campaign.emailSubject ?? "", data);
  const bodyText = mergeTemplate(bodyTpl, data);
  const html = buildHtml({ bodyText, listenUrl: listenBase, trackUrl: clickUrl, unsubscribeUrl });

  const res = await sendEmail({ to: email, from: fromAddress(rec.campaign.fromName), subject, html });
  return res.ok;
}
