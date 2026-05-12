import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getBrandCompetitors } from "@/lib/insights/queries";

export async function GET() {
  await requireRole(UserRole.BRAND);
  return Response.json({ competitors: await getBrandCompetitors() });
}
