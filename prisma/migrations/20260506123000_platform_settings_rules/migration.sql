ALTER TABLE "PlatformSettings"
ADD COLUMN "riskIndustryKeywords" TEXT[] DEFAULT ARRAY['金融','医疗','医美','保健','投资','教育','减肥','母婴']::TEXT[] NOT NULL,
ADD COLUMN "riskIndustryPrompt" TEXT NOT NULL DEFAULT '该行业容易涉及效果承诺、资质证明或监管要求。请确认 brief 不包含夸大承诺，并准备必要资质。';
