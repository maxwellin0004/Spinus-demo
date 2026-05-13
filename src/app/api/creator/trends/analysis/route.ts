import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";

export async function GET(request: Request) {
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? undefined;
  return Response.json(await getCreatorInsightAnalysis(direction));
}
