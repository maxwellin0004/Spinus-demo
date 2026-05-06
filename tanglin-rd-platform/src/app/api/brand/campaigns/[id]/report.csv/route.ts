import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: { proofs: { include: { creator: true, submission: { include: { draft: true } } } } },
  });
  if (!campaign) return new Response("Forbidden", { status: 403 });

  const rows = [
    ["content", "creator", "platform", "post_url", "views", "likes", "comments", "shares", "saves", "clicks", "conversions"],
    ...campaign.proofs.map((proof) => [
      proof.submission.draft.title,
      proof.creator.displayName,
      proof.platform,
      proof.postUrl,
      proof.views,
      proof.likes,
      proof.comments,
      proof.shares,
      proof.saves,
      proof.clicks,
      proof.conversions,
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${campaign.title.replace(/[^a-z0-9-]/gi, "-")}-report.csv"`,
    },
  });
}
