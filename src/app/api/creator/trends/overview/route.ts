import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorTrendsOverview } from "@/lib/insights/queries";

export async function GET() {
  await requireRole(UserRole.CREATOR);
  return Response.json(await getCreatorTrendsOverview());
}
