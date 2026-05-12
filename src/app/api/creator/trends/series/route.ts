import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorTrendSeries } from "@/lib/insights/queries";

export async function GET() {
  await requireRole(UserRole.CREATOR);
  return Response.json({ data: await getCreatorTrendSeries(7) });
}
