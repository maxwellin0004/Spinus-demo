import { randomInt } from "node:crypto";
import { AdminLevel, type Prisma } from "@prisma/client";

const INVITE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INVITE_PATTERN = /^[A-Z0-9]{4,6}$/;

type Db = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase();
}

export function isValidInviteCode(value: string) {
  return INVITE_PATTERN.test(normalizeInviteCode(value));
}

export function inviteValidationMessage() {
  return "邀请码只能使用 4-6 位英文字母或数字。";
}

export function generateInviteCodeCandidate(length = 6) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueInviteCode(db: Db) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const code = generateInviteCodeCandidate();
    const exists = await db.invitationCode.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Unable to generate a unique invite code.");
}

export function registerInviteUrl(code: string) {
  return `/auth/register?invite=${encodeURIComponent(code)}`;
}

export async function findActiveInvitation(code: string, db: Db) {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return null;
  return db.invitationCode.findUnique({
    where: { code: normalized },
    include: { adminProfile: { include: { user: true } } },
  });
}

export async function ensureStaffInviteCode({
  db,
  adminProfileId,
  createdById,
}: {
  db: Db;
  adminProfileId: string;
  createdById?: string | null;
}) {
  const existing = await db.invitationCode.findFirst({
    where: { adminProfileId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return db.invitationCode.create({
    data: {
      adminProfileId,
      code: await generateUniqueInviteCode(db),
      active: true,
      createdById: createdById ?? null,
    },
  });
}

export async function applyInviteCodeChange({
  db,
  adminProfileId,
  code,
  active,
  note,
  createdById,
}: {
  db: Db;
  adminProfileId: string;
  code: string;
  active: boolean;
  note: string;
  createdById?: string | null;
}) {
  const normalized = normalizeInviteCode(code);
  if (!isValidInviteCode(normalized)) {
    throw new Error(inviteValidationMessage());
  }

  const existing = await db.invitationCode.findUnique({ where: { code: normalized } });
  if (existing && existing.adminProfileId !== adminProfileId) {
    throw new Error("该邀请码已被其他 BD 使用，历史邀请码不能复用。");
  }

  if (active) {
    await db.invitationCode.updateMany({
      where: { adminProfileId, code: { not: normalized }, active: true },
      data: { active: false, deactivatedAt: new Date() },
    });
  }

  if (existing) {
    return db.invitationCode.update({
      where: { id: existing.id },
      data: {
        active,
        note: note || null,
        deactivatedAt: active ? null : existing.deactivatedAt ?? new Date(),
      },
    });
  }

  await db.invitationCode.updateMany({
    where: { adminProfileId, active: true },
    data: { active: false, deactivatedAt: new Date() },
  });
  return db.invitationCode.create({
    data: {
      adminProfileId,
      code: normalized,
      active,
      note: note || null,
      createdById: createdById ?? null,
      deactivatedAt: active ? null : new Date(),
    },
  });
}

export async function applyAdminLevelInviteRules({
  db,
  adminProfileId,
  previousLevel,
  nextLevel,
  createdById,
}: {
  db: Db;
  adminProfileId: string;
  previousLevel: AdminLevel;
  nextLevel: AdminLevel;
  createdById?: string | null;
}) {
  if (previousLevel === AdminLevel.STAFF && nextLevel === AdminLevel.FOUNDER) {
    await db.invitationCode.updateMany({
      where: { adminProfileId, active: true },
      data: { active: false, deactivatedAt: new Date() },
    });
    return;
  }

  if (previousLevel === AdminLevel.FOUNDER && nextLevel === AdminLevel.STAFF) {
    const existing = await db.invitationCode.findFirst({ where: { adminProfileId } });
    if (!existing) {
      await ensureStaffInviteCode({ db, adminProfileId, createdById });
    }
  }
}
