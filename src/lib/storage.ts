import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

// Cloudflare R2, compatible S3 : zero frais de sortie.
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
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return {
    body: res.Body as Readable,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

export async function deleteObject(key: string) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// URL signee pour ECRIRE (upload direct navigateur -> R2). Le fichier ne
// transite jamais par Vercel : c'est ce qui contourne la limite des 4,5 Mo.
export async function signedPutUrl(
  key: string,
  contentType: string,
  expiresInSec = 600
) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSec }
  );
}

// URL signee pour LIRE (lecture audio, images). Courte duree, non
// repartageable durablement. Le navigateur lit directement depuis R2.
export async function signedGetUrl(key: string, expiresInSec = 3600) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSec }
  );
}

export const keys = {
  artistPhoto: (artistId: string, ext: string) =>
    `artists/${artistId}/photo.${ext}`,
  projectCover: (projectId: string, ext: string) =>
    `projects/${projectId}/cover.${ext}`,
  trackAudio: (trackId: string) => `audio/tracks/${trackId}.mp3`,
  epkPhoto: (photoId: string, ext: string) => `epk/photos/${photoId}.${ext}`,
};
