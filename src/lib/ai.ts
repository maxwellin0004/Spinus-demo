type GenerateInput = {
  campaign: {
    title: string;
    brief: string;
    mustInclude: string[];
    mustNotInclude: string[];
    hashtags: string[];
    cta: string;
  };
  platform: string;
  mode: string;
};

export type GeneratedContent = {
  title: string;
  script: string;
  caption: string;
  coverText: string;
  hashtags: string[];
  provider: "openai" | "mock";
};

export async function generateCreatorContent(input: GenerateInput): Promise<GeneratedContent> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "你是合规的创作者商业内容策划助手。请用简体中文返回严格 JSON，字段包括 title、script、caption、coverText、hashtags。",
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
        return {
          title: parsed.title ?? mockContent(input).title,
          script: parsed.script ?? mockContent(input).script,
          caption: parsed.caption ?? mockContent(input).caption,
          coverText: parsed.coverText ?? mockContent(input).coverText,
          hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : input.campaign.hashtags,
          provider: "openai",
        };
      }
    } catch {
      // Fall through to deterministic mock for local development.
    }
  }

  return mockContent(input);
}

function mockContent(input: GenerateInput): GeneratedContent {
  const include = input.campaign.mustInclude.slice(0, 3).join(", ");
  const avoid = input.campaign.mustNotInclude.slice(0, 2).join(" / ");
  return {
    title: `${input.campaign.title}：${input.mode}创作角度`,
    script: `开场：很多人把这个产品讲得太抽象。请在 ${input.platform} 内容里展示真实工作流：先说痛点，再演示 ${include}，最后强调发布前需要人工确认。语气务实，避免 ${avoid}。行动引导：${input.campaign.cta}`,
    caption: `${input.campaign.brief.slice(0, 160)}... ${input.campaign.cta}`,
    coverText: "真实 AI 工作流，不讲空话",
    hashtags: input.campaign.hashtags.length ? input.campaign.hashtags : ["#CreatorCampaign", "#AIWorkflow"],
    provider: "mock",
  };
}
