import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { getPublicAppUrl } from "@/lib/public-url";

const CREATOR_SHARE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Db = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

export function generateCreatorShareCodeCandidate(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += CREATOR_SHARE_ALPHABET[randomInt(CREATOR_SHARE_ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueCreatorShareCode(db: Db) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const code = generateCreatorShareCodeCandidate();
    const exists = await db.creatorProfile.findUnique({ where: { shareCode: code } });
    if (!exists) return code;
  }
  throw new Error("Unable to generate a unique creator share code.");
}

export function creatorRegisterUrl(shareCode: string, baseUrl?: string) {
  const origin = (baseUrl || getPublicAppUrl()).replace(/\/$/, "");
  return `${origin}/auth/register?role=CREATOR&ref=${encodeURIComponent(shareCode)}`;
}

export function normalizeCreatorShareCode(value: string) {
  return value.trim().toUpperCase();
}
