import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { getCreatorTopTopics } from "@/lib/insights/queries";

export async function GET(request: Request) {
  await requireRole(UserRole.CREATOR);
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") ?? undefined;
  return Response.json({ topics: await getCreatorTopTopics(direction) });
}
