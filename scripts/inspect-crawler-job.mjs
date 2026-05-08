import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const jobId = process.argv[2];
if (!jobId) {
  console.error("Usage: node scripts/inspect-crawler-job.mjs <jobId>");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const job = await prisma.crawlerJob.findUnique({
    where: { id: jobId },
    include: {
      socialSnapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
      postSnapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  console.log(JSON.stringify(job, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
