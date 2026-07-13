import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { signedPutUrl, keys } from "@/lib/storage";
import { createId } from "@/lib/id";

// Upload direct d'une photo EPK vers R2 (meme principe que l'audio).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { contentType, ext } = await req.json();
  const id = createId();
  const safeExt = (String(ext || "jpg").replace(/[^a-z0-9]/gi, "") || "jpg").toLowerCase();
  const key = keys.epkPhoto(id, safeExt);
  const uploadUrl = await signedPutUrl(key, contentType || "image/jpeg");

  return NextResponse.json({ id, ext: safeExt, key, uploadUrl });
}
