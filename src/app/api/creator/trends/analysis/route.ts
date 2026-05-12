import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";

export async function GET() {
  await requireRole(UserRole.CREATOR);
  return Response.json(await getCreatorInsightAnalysis());
}
