import { UserRole } from "@prisma/client";
import { generateCreatorContent } from "@/lib/ai";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await requireRole(UserRole.CREATOR);
  const body = await request.json();
  const application = await prisma.taskApplication.findFirst({
    where: { id: String(body.applicationId), creator: { userId: session.userId } },
    include: { task: { include: { campaign: true } } },
  });
  if (!application) return Response.json({ error: "Not found" }, { status: 404 });
  const content = await generateCreatorContent({
    campaign: {
      title: application.task.campaign.title,
      brief: application.task.campaign.brief,
      mustInclude: application.task.campaign.mustInclude,
      mustNotInclude: application.task.campaign.mustNotInclude,
      hashtags: application.task.campaign.hashtags,
      cta: application.task.campaign.cta,
    },
    platform: application.task.platform,
    mode: String(body.mode ?? "教程教学型"),
  });
  return Response.json(content);
}
