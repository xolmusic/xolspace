import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

// Cloudflare R2 est compatible avec l'API S3 : zero frais de sortie,
// ce qui est decisif pour de l'audio ecoute en streaming.
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET ?? "xol-catalog";

export async function putObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getObjectStream(key: string) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  return {
    body: res.Body as Readable,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export async function deleteObject(key: string) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// URL signee courte duree — utilisee UNIQUEMENT en interne (admin) pour
// previsualiser un master. Jamais renvoyee a une page publique.
export async function signedGetUrl(key: string, expiresInSec = 300) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSec }
  );
}

// Conventions de nommage des cles R2
export const keys = {
  artistPhoto: (artistId: string, ext: string) =>
    `artists/${artistId}/photo.${ext}`,
  projectCover: (projectId: string, ext: string) =>
    `projects/${projectId}/cover.${ext}`,
  trackMaster: (trackId: string) => `masters/tracks/${trackId}.wav`,
  trackStream: (trackId: string) => `streams/tracks/${trackId}.mp3`,
  demoMaster: (demoId: string) => `masters/demos/${demoId}.wav`,
  demoStream: (demoId: string) => `streams/demos/${demoId}.mp3`,
};
