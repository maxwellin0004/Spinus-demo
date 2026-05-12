import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getBrandInsightAnalysis } from "@/lib/insights/analysis-queries";

export async function GET() {
  await requireRole(UserRole.BRAND);
  return Response.json(await getBrandInsightAnalysis());
}
