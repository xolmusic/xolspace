import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectStream } from "@/lib/storage";

// Streaming de la version MP3 pour la previsualisation dans le back-office.
// Reservee aux admins. Ne sert jamais le WAV master.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { kind, id } = await params;
  let streamKey: string | null = null;

  if (kind === "track") {
    const t = await prisma.track.findUnique({ where: { id } });
    streamKey = t?.streamKey ?? null;
  } else if (kind === "demo") {
    const d = await prisma.demo.findUnique({ where: { id } });
    streamKey = d?.streamKey ?? null;
  }

  if (!streamKey) return new Response("Not found", { status: 404 });

  try {
    const { body, contentLength } = await getObjectStream(streamKey);
    return new Response(body as unknown as ReadableStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
        ...(contentLength ? { "Content-Length": String(contentLength) } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
