import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { parseBuffer } from "music-metadata";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";

// ffmpeg-static fournit un binaire ffmpeg embarque, ce qui permet au
// transcodage de fonctionner en serverless (Vercel) ou l'on ne peut pas
// installer ffmpeg soi-meme. En local, si un ffmpeg systeme existe, ce
// chemin reste valide aussi.
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

// Transcodage simple V1 : a l'upload, on genere une version streaming
// MP3 320 kbps. Le WAV master reste intact et prive.
// (En V1.5 : deporter ce travail dans un worker asynchrone.)
export async function transcodeToMp3(wavBuffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inPath = join(tmpdir(), `${id}.wav`);
  const outPath = join(tmpdir(), `${id}.mp3`);
  await writeFile(inPath, wavBuffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inPath)
        .audioCodec("libmp3lame")
        .audioBitrate(320)
        .format("mp3")
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outPath);
    });
    return await readFile(outPath);
  } finally {
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

export async function extractDurationSec(buffer: Buffer): Promise<number | null> {
  try {
    const meta = await parseBuffer(buffer, "audio/wav");
    return meta.format.duration ? Math.round(meta.format.duration) : null;
  } catch {
    return null;
  }
}

// Waveform pre-calculee : ~200 pics normalises 0..1 pour un rendu leger
// cote client (important pour les connexions mobiles africaines).
export async function computeWaveform(
  wavBuffer: Buffer,
  buckets = 200
): Promise<number[] | null> {
  try {
    const meta = await parseBuffer(wavBuffer, "audio/wav");
    const bits = meta.format.bitsPerSample ?? 16;
    if (bits !== 16) return null; // approx simple : on ne gere que le PCM 16 bits ici

    // On saute l'entete WAV (44 octets standard) et on lit les echantillons.
    const dataStart = 44;
    const samples = (wavBuffer.length - dataStart) / 2;
    const step = Math.max(1, Math.floor(samples / buckets));
    const peaks: number[] = [];
    let peak = 0;
    let count = 0;

    for (let i = dataStart; i + 1 < wavBuffer.length; i += 2) {
      const s = Math.abs(wavBuffer.readInt16LE(i)) / 32768;
      if (s > peak) peak = s;
      count++;
      if (count >= step) {
        peaks.push(Math.round(peak * 1000) / 1000);
        peak = 0;
        count = 0;
      }
    }
    return peaks.length ? peaks : null;
  } catch {
    return null;
  }
}
