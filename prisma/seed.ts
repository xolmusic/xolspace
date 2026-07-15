import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Attention : on utilise || et non ?? — une variable definie mais VIDE
  // doit aussi basculer sur la valeur de secours, sinon on cree un compte
  // avec un email vide (inutilisable).
  const email = (process.env.ADMIN_EMAIL || "gwen@xolmusic.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "change-moi";
  const passwordHash = await bcrypt.hash(password, 10);

  if (!email) throw new Error("ADMIN_EMAIL invalide.");

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "XOL Music" },
  });

  console.log(`Compte admin pret : ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
