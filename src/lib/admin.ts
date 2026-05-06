import { AdminDataScope, AdminLevel, UserRole, type AdminProfile } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ADMIN_PERMISSIONS = [
  "staff.manage",
  "account.create",
  "account.freeze",
  "account.reset_password",
  "campaign.manage",
  "content.review",
  "proof.review",
  "payment.manage",
  "compliance.manage",
  "reports.view",
  "audit.view",
  "demo.manage",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type AdminContext = {
  userId: string;
  email: string;
  role: UserRole;
  profile: AdminProfile;
};

export async function getAdminContext(): Promise<AdminContext> {
  const session = await requireRole(UserRole.ADMIN);
  let profile = await prisma.adminProfile.findUnique({ where: { userId: session.userId } });

  if (!profile) {
    const existingProfiles = await prisma.adminProfile.count();
    const isFounder = existingProfiles === 0 || session.email === "admin@test.com";
    profile = await prisma.adminProfile.create({
      data: {
        userId: session.userId,
        displayName: session.email.split("@")[0] || "Admin",
        level: isFounder ? AdminLevel.FOUNDER : AdminLevel.STAFF,
        permissions: isFounder ? [...ADMIN_PERMISSIONS] : ["account.create", "campaign.manage", "content.review", "proof.review", "reports.view"],
        dataScope: isFounder ? AdminDataScope.ALL : AdminDataScope.ASSIGNED,
        teamName: isFounder ? "创始人办公室" : null,
      },
    });
  }

  return { ...session, role: UserRole.ADMIN, profile };
}

export function isFounder(profile: AdminProfile) {
  return profile.level === AdminLevel.FOUNDER;
}

export function hasAdminPermission(profile: AdminProfile, permission: AdminPermission) {
  return isFounder(profile) || profile.permissions.includes(permission);
}

export async function requireAdminPermission(permission: AdminPermission) {
  const context = await getAdminContext();
  if (!hasAdminPermission(context.profile, permission)) redirect("/403");
  return context;
}

export function scopeOptions(profile: AdminProfile) {
  const options = [{ value: "MINE", label: "我负责的客户" }];
  if (profile.dataScope === AdminDataScope.TEAM || profile.dataScope === AdminDataScope.ALL || isFounder(profile)) {
    options.push({ value: "TEAM", label: "团队客户" });
  }
  if (profile.dataScope === AdminDataScope.ALL || isFounder(profile)) {
    options.push({ value: "ALL", label: "全部客户" });
  }
  return options;
}

export function resolveAdminScope(profile: AdminProfile, requested?: string) {
  const allowed = scopeOptions(profile).map((item) => item.value);
  if (requested && allowed.includes(requested)) return requested;
  if (profile.dataScope === AdminDataScope.ALL || isFounder(profile)) return "ALL";
  if (profile.dataScope === AdminDataScope.TEAM) return "TEAM";
  return "MINE";
}

export function brandScopeWhere(profile: AdminProfile, requested?: string) {
  const scope = resolveAdminScope(profile, requested);
  if (scope === "MINE") return { responsibleAdminId: profile.id };
  if (scope === "TEAM") {
    return profile.teamName
      ? { responsibleAdmin: { teamName: profile.teamName } }
      : { responsibleAdminId: profile.id };
  }
  return {};
}

export function creatorScopeWhere(profile: AdminProfile, requested?: string) {
  const scope = resolveAdminScope(profile, requested);
  if (scope === "MINE") return { responsibleAdminId: profile.id };
  if (scope === "TEAM") {
    return profile.teamName
      ? { responsibleAdmin: { teamName: profile.teamName } }
      : { responsibleAdminId: profile.id };
  }
  return {};
}

export function demoWhere(value?: string, canSeeDemo = false) {
  if (!canSeeDemo) return { isDemo: false };
  if (value === "include") return {};
  if (value === "only") return { isDemo: true };
  return { isDemo: false };
}
