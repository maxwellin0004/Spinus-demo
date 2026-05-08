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
    include: {
      tasks: { include: { applications: true } },
      submissions: {
        include: {
          creator: true,
          draft: true,
          proofs: { include: { postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } }, orderBy: { createdAt: "desc" } },
          application: { include: { task: true, selectedSocialAccount: { include: { metricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 } } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!campaign) return new Response("Forbidden", { status: 403 });

  const summaryRows = [
    ["section", "metric", "value"],
    ["campaign", "title", campaign.title],
    ["campaign", "status", campaign.status],
    ["campaign", "currency", campaign.currency],
    ["campaign", "escrow_amount", campaign.escrowAmount],
    ["campaign", "submissions", campaign.submissions.length],
    ["campaign", "published_links", campaign.submissions.reduce((sum, submission) => sum + submission.proofs.length, 0)],
    [],
  ];

  const detailRows = [
    ["kol", "platform", "account", "draft_title", "submission_status", "publication_status", "settlement_status", "settlement_amount", "post_url", "proof_status", "proof_rejection", "follower_snapshot", "view_count", "like_count", "favorite_count", "comment_count", "share_count", "author_match_status", "metrics_fetched_at", "submitted_at", "updated_at"],
    ...campaign.submissions.flatMap((submission) => {
      if (!submission.proofs.length) {
        const accountSnapshot = submission.application.selectedSocialAccount?.metricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
        return [[
          submission.creator.displayName,
          submission.application.task.platform,
          submission.application.selectedSocialAccount?.accountName ?? "",
          submission.draft.title,
          submission.status,
          submission.publicationStatus,
          submission.settlementStatus,
          submission.settlementAmount ?? "",
          "",
          "",
          "",
          accountSnapshot?.followerCount ?? "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          submission.submittedAt.toISOString(),
          submission.updatedAt.toISOString(),
        ]];
      }
      return submission.proofs.map((proof) => {
        const accountSnapshot = submission.application.selectedSocialAccount?.metricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
        const postSnapshot = proof.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
        return [
          submission.creator.displayName,
          submission.application.task.platform,
          submission.application.selectedSocialAccount?.accountName ?? "",
          submission.draft.title,
          submission.status,
          submission.publicationStatus,
          submission.settlementStatus,
          submission.settlementAmount ?? "",
          proof.postUrl,
          `${proof.verificationStatus}/${proof.publicationStatus}`,
          proof.rejectionReason ? `${proof.rejectionReason}: ${proof.rejectionNote ?? ""}` : "",
          accountSnapshot?.followerCount ?? "",
          postSnapshot?.viewCount ?? "",
          postSnapshot?.likeCount ?? "",
          postSnapshot?.favoriteCount ?? "",
          postSnapshot?.commentCount ?? "",
          postSnapshot?.shareCount ?? "",
          postSnapshot?.authorMatchStatus ?? "",
          postSnapshot?.fetchedAt.toISOString() ?? "",
          proof.createdAt.toISOString(),
          proof.updatedAt.toISOString(),
        ];
      });
    }),
  ];

  const csv = [...summaryRows, ...detailRows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${campaign.title.replace(/[^a-z0-9-]/gi, "-")}-v1-report.csv"`,
    },
  });
}
