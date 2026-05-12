-- CreateTable
CREATE TABLE "InsightTopic" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT NOT NULL,
    "sourceKey" TEXT,
    "heatValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "growthRate" DOUBLE PRECISION,
    "stage" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightContent" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceContentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "publishTime" TIMESTAMP(3),
    "contentUrl" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "collectCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "keyword" TEXT,
    "topicId" TEXT,
    "heatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightComment" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceCommentId" TEXT,
    "contentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT,
    "painPoint" TEXT,
    "riskTag" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightCreator" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceAuthorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "contentTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avgEngagement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightCollectionRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "platform" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "keyword" TEXT,
    "requestPayload" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InsightCollectionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InsightTopic_source_topic_date_key" ON "InsightTopic"("source", "topic", "date");
CREATE INDEX "InsightTopic_topic_date_idx" ON "InsightTopic"("topic", "date");
CREATE INDEX "InsightTopic_source_date_idx" ON "InsightTopic"("source", "date");
CREATE INDEX "InsightTopic_heatScore_idx" ON "InsightTopic"("heatScore");

-- CreateIndex
CREATE UNIQUE INDEX "InsightContent_platform_sourceContentId_key" ON "InsightContent"("platform", "sourceContentId");
CREATE INDEX "InsightContent_platform_keyword_idx" ON "InsightContent"("platform", "keyword");
CREATE INDEX "InsightContent_topicId_idx" ON "InsightContent"("topicId");
CREATE INDEX "InsightContent_heatScore_idx" ON "InsightContent"("heatScore");
CREATE INDEX "InsightContent_publishTime_idx" ON "InsightContent"("publishTime");

-- CreateIndex
CREATE UNIQUE INDEX "InsightComment_platform_sourceCommentId_contentId_key" ON "InsightComment"("platform", "sourceCommentId", "contentId");
CREATE INDEX "InsightComment_contentId_idx" ON "InsightComment"("contentId");
CREATE INDEX "InsightComment_sentiment_idx" ON "InsightComment"("sentiment");
CREATE INDEX "InsightComment_painPoint_idx" ON "InsightComment"("painPoint");

-- CreateIndex
CREATE UNIQUE INDEX "InsightCreator_platform_sourceAuthorId_key" ON "InsightCreator"("platform", "sourceAuthorId");
CREATE INDEX "InsightCreator_platform_category_idx" ON "InsightCreator"("platform", "category");

-- CreateIndex
CREATE INDEX "InsightCollectionRun_status_startedAt_idx" ON "InsightCollectionRun"("status", "startedAt");
CREATE INDEX "InsightCollectionRun_source_jobType_idx" ON "InsightCollectionRun"("source", "jobType");

-- AddForeignKey
ALTER TABLE "InsightContent" ADD CONSTRAINT "InsightContent_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "InsightTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightComment" ADD CONSTRAINT "InsightComment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "InsightContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
