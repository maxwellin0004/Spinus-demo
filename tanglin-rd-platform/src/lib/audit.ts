import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  beforeJson?: Prisma.InputJsonValue;
  afterJson?: Prisma.InputJsonValue;
};

export async function audit(input: AuditInput) {
  const session = await getSession();
  await prisma.auditLog.create({
    data: {
      actorUserId: session?.userId,
      actorRole: session?.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson,
    },
  });
}
