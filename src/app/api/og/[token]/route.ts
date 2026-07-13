import { NextRequest } from "next/server";
import { previewImageKey } from "@/lib/share";
import { getObjectStream } from "@/lib/storage";

// Image d'apercu (link preview WhatsApp, Instagram, Facebook, iMessage…).
// Publique par nature — les robots des reseaux ne peuvent pas s'authentifier.
// On ne divulgue que l'image liee a un token de partage valide.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const key = await previewImageKey(token);
  if (!key) {
    // Repli : logo XOL (sert le fichier statique).
    return Response.redirect(
      new URL("/brand/xol-square.jpg", process.env.NEXT_PUBLIC_APP_URL ?? "https://xolmusic.space"),
      302
    );
  }

  try {
    const { body, contentType } = await getObjectStream(key);
    return new Response(body as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType ?? "image/jpeg",
        // Cache long : les crawlers reviennent, et l'image d'un lien change peu.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return Response.redirect(
      new URL("/brand/xol-square.jpg", process.env.NEXT_PUBLIC_APP_URL ?? "https://xolmusic.space"),
      302
    );
  }
}
