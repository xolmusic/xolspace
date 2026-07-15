import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signedPutUrl, keys } from "@/lib/storage";
import { createId } from "@/lib/id";

// Upload direct d'un justificatif (image ou PDF) vers R2.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { contentType, ext } = await req.json();
  const id = createId();
  const safeExt = (String(ext || "pdf").replace(/[^a-z0-9]/gi, "") || "pdf").toLowerCase();
  const key = keys.receipt(id, safeExt);
  const uploadUrl = await signedPutUrl(key, contentType || "application/pdf");

  return NextResponse.json({ id, ext: safeExt, key, uploadUrl });
}
