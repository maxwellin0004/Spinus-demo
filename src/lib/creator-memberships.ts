export type CreatorMembershipTier = {
  slug: "growth" | "pro";
  badge: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  theme: string;
  ribbon: string;
  audience: string;
  promise: string;
  benefits: string[];
  outcomes: string[];
};

export const creatorMembershipTiers: CreatorMembershipTier[] = [
  {
    slug: "growth",
    badge: "年度成长会员",
    title: "一年成长会员",
    subtitle: "适合认真做账号、长期成长、接商单的大学生",
    priceLabel: "¥1999 / 年",
    theme: "from-[#0f2f8f] via-[#2150d0] to-[#5ca9ff]",
    ribbon: "一年陪跑 稳步成长",
    audience: "想建立个人内容影响力，拿到第一批真实合作机会的校园 KOC。",
    promise: "系统化陪跑、选题方向、成长复盘和上单入口一起给到。",
    benefits: [
      "1 年账号孵化陪跑",
      "每月 1 次账号诊断",
      "每月 15-20 个选题方向",
      "内部上单系统基础权限",
      "达人标签入库与优先推荐",
      "品牌合作机会与项目实践证明",
      "社群打卡监督",
      "运营课程与资源库持续更新",
      "成长保障计划",
    ],
    outcomes: ["定位更清晰", "内容能力提升", "商业合作机会", "副业变现", "实习 / 简历加分"],
  },
  {
    slug: "pro",
    badge: "Campus Creator Pro",
    title: "高阶孵化会员",
    subtitle: "适合已有基础粉丝或内容能力，想快速商业化的大学生",
    priceLabel: "¥6999 / 年",
    theme: "from-[#3e0b75] via-[#6c24c8] to-[#b04bff]",
    ribbon: "专属资源 快速变现",
    audience: "已经开始做个人 IP，希望把影响力和商业合作同步放大的创作者。",
    promise: "给到更密集的一对一服务、更深的品牌资源和更明确的商业化路径。",
    benefits: [
      "个人 IP 深度定位",
      "专属运营导师 1 对 1 服务",
      "每月 4 条重点内容共创",
      "内部上单系统高级权限",
      "专属资源优先推荐",
      "推荐信与实习证明",
      "优先参与品牌项目",
      "成长保障与专属服务",
      "商业变现加速",
      "个人品牌影响力打造",
    ],
    outcomes: ["稳定输出", "真实项目经历", "可变现内容", "个人品牌影响力", "副业收入与职业竞争力"],
  },
];

export function getCreatorMembershipTier(slug?: string | null) {
  return creatorMembershipTiers.find((tier) => tier.slug === slug) ?? creatorMembershipTiers[0];
}
