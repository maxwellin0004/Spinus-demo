export const V1_PLATFORMS = ["小红书", "抖音", "视频号", "B站", "微博"] as const;

export const V1_CONTENT_TYPES = ["短视频", "图文", "直播预告", "直播切片", "长视频", "微博图文"] as const;

export const V1_CATEGORIES = [
  "美妆护肤",
  "食品饮料",
  "服饰配饰",
  "数码家电",
  "App/小程序",
  "AI/工具软件",
  "本地生活",
  "教育课程",
  "母婴亲子",
  "健身运动",
  "家居好物",
  "金融/保险",
  "医疗/健康",
  "其他",
] as const;

export const V1_COUNTRIES = ["中国大陆", "中国香港", "中国澳门", "中国台湾", "新加坡", "马来西亚", "其他"] as const;

export const V1_LANGUAGES = ["中文", "英文", "粤语", "其他"] as const;

export const V1_CAMPAIGN_TEMPLATES = [
  {
    key: "xiaohongshu_seed",
    name: "小红书图文种草",
    title: "小红书新品种草",
    objective: "曝光/收藏",
    cta: "评论区或主页链接了解产品",
    industry: "美妆护肤",
    brief: "请围绕真实使用场景做自然种草，说明产品解决的问题、使用前后的感受，以及适合的人群。表达要具体、真实、可验证。",
    tasks: [
      { platform: "小红书", contentType: "图文", slotsTotal: 10, rewardAmount: 40, minimumFollowers: 1000, platformRequirement: "标题自然，正文包含真实体验、使用场景和广告披露。" },
    ],
  },
  {
    key: "douyin_short_video",
    name: "抖音短视频测评",
    title: "抖音短视频测评",
    objective: "曝光/点击",
    cta: "点击主页链接领取试用",
    industry: "App/小程序",
    brief: "请用短视频展示产品核心卖点，前 3 秒说明痛点，中段展示使用过程，结尾给出明确行动引导。",
    tasks: [
      { platform: "抖音", contentType: "短视频", slotsTotal: 6, rewardAmount: 80, minimumFollowers: 3000, platformRequirement: "前 3 秒说明痛点，展示真实使用过程，结尾包含广告披露和 CTA。" },
    ],
  },
  {
    key: "bilibili_review",
    name: "B站深度体验",
    title: "B站深度体验推广",
    objective: "认知/转化",
    cta: "查看简介链接领取优惠",
    industry: "数码家电",
    brief: "请围绕真实体验做较完整的功能讲解，包含适合人群、核心优点、使用限制和购买/试用建议。",
    tasks: [
      { platform: "B站", contentType: "长视频", slotsTotal: 3, rewardAmount: 200, minimumFollowers: 5000, platformRequirement: "视频需要包含真实体验过程、优缺点说明、广告披露和简介区链接。" },
    ],
  },
  {
    key: "weibo_launch",
    name: "微博新品扩散",
    title: "微博新品发布扩散",
    objective: "曝光/互动",
    cta: "转发并点击链接了解活动",
    industry: "食品饮料",
    brief: "请围绕新品发布或活动节点做轻量扩散，文案要清晰说明卖点、活动利益点和参与方式。",
    tasks: [
      { platform: "微博", contentType: "微博图文", slotsTotal: 12, rewardAmount: 30, minimumFollowers: 1000, platformRequirement: "微博正文包含产品名、活动利益点、指定话题和广告披露。" },
    ],
  },
] as const;
