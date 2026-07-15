import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const COOKIE = "xol_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me"
);

export type Session = { adminId: string; email: string };

export async function verifyPassword(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;
  return admin;
}

export async function createSession(adminId: string, email: string) {
  const token = await new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { adminId: payload.adminId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// Hash utilitaire — mots de passe admin et mots de passe de liens de partage.
export function hash(plain: string) {
  return bcrypt.hash(plain, 10);
}
export function compare(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed);
}

// --- Roles ---
// Le role est toujours relu en base (et non depuis le jeton de session) :
// un changement de droits est ainsi effectif immediatement.
export async function getCurrentAdmin() {
  const session = await getSession();
  if (!session) return null;
  return prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, role: true },
  });
}

export async function isSuperAdmin(): Promise<boolean> {
  const admin = await getCurrentAdmin();
  return admin?.role === "SUPER_ADMIN";
}
