import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorTopTopics } from "@/lib/insights/queries";

export async function GET() {
  await requireRole(UserRole.CREATOR);
  return Response.json({ topics: await getCreatorTopTopics() });
}
