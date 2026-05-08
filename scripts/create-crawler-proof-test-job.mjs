import { PrismaClient, CrawlerJobType, CrawlerPlatform, CrawlerTargetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function toCrawlerPlatform(platform) {
  if (platform === "小红书") return CrawlerPlatform.XIAOHONGSHU;
  if (platform === "抖音") return CrawlerPlatform.DOUYIN;
  return null;
}

async function main() {
  const proof = await prisma.proof.findFirst({
    where: { platform: { in: ["小红书", "抖音"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!proof) throw new Error("No 小红书/抖音 proof found. Submit a creator post link first.");

  const platform = toCrawlerPlatform(proof.platform);
  const job = await prisma.crawlerJob.create({
    data: {
      type: CrawlerJobType.FETCH_POST_METRICS,
      platform,
      targetType: CrawlerTargetType.PROOF,
      targetId: proof.id,
      targetUrl: proof.resolvedPostUrl ?? proof.postUrl,
      proofId: proof.id,
    },
  });

  console.log(JSON.stringify({ jobId: job.id, proofId: proof.id, targetUrl: job.targetUrl }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
