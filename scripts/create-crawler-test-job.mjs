import { PrismaClient, CrawlerJobType, CrawlerPlatform, CrawlerTargetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  let account = await prisma.socialAccount.findFirst({ where: { platform: "小红书" } });

  if (!account) {
    const creator = await prisma.creatorProfile.findFirst();
    if (!creator) throw new Error("No creator profile found");

    account = await prisma.socialAccount.create({
      data: {
        creatorId: creator.id,
        platform: "小红书",
        accountName: "mock_xhs_account",
        accountUrl: "https://www.xiaohongshu.com/user/profile/mock-user",
        followers: 1000,
        avgViews: 100,
        submittedFollowers: 1000,
        submittedAvgViews: 100,
        contentType: "图文",
        country: "China",
        language: "中文",
        verificationNote: "端到端联调账号",
      },
    });
  }

  const job = await prisma.crawlerJob.create({
    data: {
      type: CrawlerJobType.FETCH_SOCIAL_ACCOUNT,
      platform: CrawlerPlatform.XIAOHONGSHU,
      targetType: CrawlerTargetType.SOCIAL_ACCOUNT,
      targetId: account.id,
      targetUrl: account.accountUrl,
      socialAccountId: account.id,
    },
  });

  console.log(JSON.stringify({ jobId: job.id, accountId: account.id, targetUrl: account.accountUrl }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
