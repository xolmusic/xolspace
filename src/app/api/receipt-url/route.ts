import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { signedPutUrl, keys } from "@/lib/storage";
import { createId } from "@/lib/id";

// Upload direct d'un justificatif (image ou PDF) vers R2.
export async function POST(req: NextRequest) {
  // Piece comptable : super admin uniquement.
  const admin = await getCurrentAdmin();
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  if (admin.role !== "SUPER_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const { contentType, ext } = await req.json();
  const id = createId();
  const safeExt = (String(ext || "pdf").replace(/[^a-z0-9]/gi, "") || "pdf").toLowerCase();
  const key = keys.receipt(id, safeExt);
  const uploadUrl = await signedPutUrl(key, contentType || "application/pdf");

  return NextResponse.json({ id, ext: safeExt, key, uploadUrl });
}
