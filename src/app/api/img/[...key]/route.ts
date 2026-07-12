import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getObjectStream } from "@/lib/storage";

// Sert les images (photos artistes, covers projets) pour le back-office.
// Reservee aux admins connectes. Les pages publiques utilisent la route
// dediee /api/s/... qui verifie le lien de partage.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { key } = await params;
  const objectKey = key.join("/");
  try {
    const { body, contentType } = await getObjectStream(objectKey);
    return new Response(body as unknown as ReadableStream, {
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
