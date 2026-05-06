import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole, UserStatus, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "tanglin_session";

type Session = {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "local-dev-secret-change-me");
}

export function roleHome(role: UserRole) {
  if (role === UserRole.ADMIN) return "/admin";
  if (role === UserRole.BRAND) return "/brand";
  return "/creator";
}

export async function signSession(user: Pick<User, "id" | "email" | "role" | "status">) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function createSession(user: Pick<User, "id" | "email" | "role" | "status">) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: payload.role as UserRole,
      status: payload.status as UserStatus,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  return session;
}

export async function requireRole(roles: UserRole | UserRole[]) {
  const session = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.role)) redirect("/403");
  if (session.status === UserStatus.FROZEN) redirect("/403");
  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    include: { brandProfile: true, creatorProfile: { include: { wallet: true } } },
  });
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
