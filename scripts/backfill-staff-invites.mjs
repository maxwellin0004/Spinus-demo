import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AdminLevel, PrismaClient } from "@prisma/client";
import { randomInt } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function candidate() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[randomInt(alphabet.length)];
  }
  return code;
}

async function uniqueCode() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const code = candidate();
    const exists = await prisma.invitationCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Unable to generate a unique invite code.");
}

async function main() {
  const staffProfiles = await prisma.adminProfile.findMany({
    where: {
      level: AdminLevel.STAFF,
      invitationCodes: { none: {} },
    },
    include: { user: true },
  });

  for (const profile of staffProfiles) {
    const invite = await prisma.invitationCode.create({
      data: {
        adminProfileId: profile.id,
        code: await uniqueCode(),
        active: true,
      },
    });
    console.log(`created ${invite.code} for ${profile.user.email}`);
  }

  console.log(`backfilled ${staffProfiles.length} staff invite code(s)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
