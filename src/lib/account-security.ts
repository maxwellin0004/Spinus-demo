import crypto from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_FAILURE_WINDOW_MINUTES = 15;
export const PASSWORD_RESET_TTL_MINUTES = 30;
export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export function securityHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function issuePlainToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function normalizedSecurityEmail(email: string) {
  return email.trim().toLowerCase();
}

export function securityEntityForEmail(email: string) {
  return securityHash(normalizedSecurityEmail(email));
}

export function passwordResetPath(token: string) {
  return `/auth/reset-password?token=${encodeURIComponent(token)}`;
}

export function emailVerificationPath(token: string) {
  return `/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export async function createPasswordResetToken(prisma: PrismaClient, userId: string) {
  const token = issuePlainToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: securityHash(token),
      expiresAt,
    },
  });
  return { token, expiresAt, path: passwordResetPath(token) };
}

export async function createEmailVerificationToken(prisma: PrismaClient, userId: string) {
  const token = issuePlainToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: securityHash(token),
      expiresAt,
    },
  });
  return { token, expiresAt, path: emailVerificationPath(token) };
}
