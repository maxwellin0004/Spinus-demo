import { staticFile } from "remotion";

export type TechArchiveEvidence = {
  label: string;
  title: string;
  detail: string;
};

export type TechArchiveMediaCard = {
  imageSrc: string;
  label: string;
  caption: string;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
};

export type DuckPose = "question" | "archive" | "point" | "power" | "present";

export type TechArchiveChapter = {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  evidence: readonly TechArchiveEvidence[];
  mediaCards: readonly TechArchiveMediaCard[];
  duckPose: DuckPose;
};

const duckQuestion = staticFile("images/tech-archive/duck-ai/duck-question.png");
const duckArchive = staticFile("images/tech-archive/duck-ai/duck-archive.png");
const duckPoint = staticFile("images/tech-archive/duck-ai/duck-point.png");
const duckPower = staticFile("images/tech-archive/duck-ai/duck-power.png");
const duckPresent = staticFile("images/tech-archive/duck-ai/duck-present.png");

const usbCLaptop = staticFile("images/tech-archive/usb-c-laptop.jpg");
const legacyUsbConnectors = staticFile("images/tech-archive/legacy-usb-connectors.jpg");
const multiUsbCharger = staticFile("images/tech-archive/multi-usb-charger.jpg");
const euCommonCharger = staticFile("images/tech-archive/eu-common-charger.jpg");
const threePortUsbCharger = staticFile("images/tech-archive/three-port-usb-charger.png");

export const duckPoseMap: Record<DuckPose, string> = {
  question: duckQuestion,
  archive: duckArchive,
  point: duckPoint,
  power: duckPower,
  present: duckPresent,
};

export const techArchiveData = {
  templateId: "tech_archive_explainer",
  topic: "USB-C 为什么能统一接口",
  kicker: "TECH ARCHIVE / CONNECTOR HISTORY",
  hook: {
    leftMetric: "1 个口",
    rightMetric: "充电 / 数据 / 显示 / 扩展",
    question: "为什么一个小小的 USB-C，最后能逼着整个行业统一接口？",
    answer:
      "它不是单纯换了一个形状，而是把协议、功率、生态和监管压力都压进了同一个接口里。",
    mediaCards: [
      {
        imageSrc: usbCLaptop,
        label: "现在的接口",
        caption: "同一个 Type-C 口，开始承担充电、数据传输和显示输出。",
        objectPosition: "center center",
      },
      {
        imageSrc: multiUsbCharger,
        label: "过去的混乱",
        caption: "接口和充电头越做越多，用户体验和配件管理成本一起上升。",
      },
    ],
    duckPose: "question" as DuckPose,
  },
  chapters: [
    {
      id: "messy_ports",
      year: "2000s",
      title: "先是接口混战",
      subtitle: "手机、相机、MP3、掌机，各有各的线，连接能力被切得很碎。",
      evidence: [
        {
          label: "旧接口",
          title: "Mini / Micro / 专有 DC 口并存",
          detail: "设备越多，线越多，用户需要记住不同接口和不同充电头的组合。",
        },
        {
          label: "问题",
          title: "充电、数据、扩展各说各话",
          detail: "接口更像零散配件，不像统一基础设施。",
        },
      ],
      mediaCards: [
        {
          imageSrc: legacyUsbConnectors,
          label: "接口样本",
          caption: "旧时代的 USB 家族和专有连接器长相不同、能力也不同。",
          objectFit: "contain",
          objectPosition: "center center",
        },
        {
          imageSrc: multiUsbCharger,
          label: "配件负担",
          caption: "接口越碎片化，用户需要维护的线材和充电器就越多。",
        },
      ],
      duckPose: "archive",
    },
    {
      id: "standard_push",
      year: "2014",
      title: "真正的变化，是标准开始说同一种语言",
      subtitle: "USB-C 不只是可正反插，它把接口形态和协议扩展开始绑在一起。",
      evidence: [
        {
          label: "协议",
          title: "USB-C + USB PD 成为一组系统",
          detail: "连接器形态、功率协商和功能扩展被放进同一套规则里。",
        },
        {
          label: "体验",
          title: "用户第一次明显感到接口统一带来的好处",
          detail: "不用再试方向，不用反复猜测这根线到底能做什么。",
        },
      ],
      mediaCards: [
        {
          imageSrc: usbCLaptop,
          label: "统一接口",
          caption: "Type-C 成为跨设备的共同入口，开始脱离单一手机配件定位。",
        },
        {
          imageSrc: threePortUsbCharger,
          label: "能力叠加",
          caption: "用户逐渐习惯一个充电器适配更多设备的逻辑。",
          objectFit: "contain",
          objectPosition: "center center",
        },
      ],
      duckPose: "point",
    },
    {
      id: "power_jump",
      year: "2017-2021",
      title: "功率升级，把它推成主接口",
      subtitle: "当充电功率和扩展能力一起上涨，Type-C 才真正从手机口进入 PC 和桌面生态。",
      evidence: [
        {
          label: "供电",
          title: "从手机快充走向笔记本和显示器",
          detail: "高功率协商让接口第一次具备跨设备级别的统一价值。",
        },
        {
          label: "生态",
          title: "厂商开始减少私有充电线",
          detail: "统一接口降低了配件 SKU、售后和仓储复杂度。",
        },
      ],
      mediaCards: [
        {
          imageSrc: usbCLaptop,
          label: "进入电脑",
          caption: "接口能力越强，越容易成为高频设备的默认入口。",
        },
        {
          imageSrc: threePortUsbCharger,
          label: "高功率扩展",
          caption: "多口充电器和扩展坞出现后，Type-C 开始承接桌面工作流。",
          objectFit: "contain",
          objectPosition: "center center",
        },
      ],
      duckPose: "power",
    },
    {
      id: "regulation",
      year: "2024+",
      title: "最后一推，来自监管和环保压力",
      subtitle: "当监管、环保和消费者便利站到一起，统一接口就不再只是厂商偏好。",
      evidence: [
        {
          label: "监管",
          title: "通用充电器规则压实了统一趋势",
          detail: "减少电子垃圾、降低重复购买，让接口问题不再只是技术部门的内部选择。",
        },
        {
          label: "结论",
          title: "接口变成公共规则",
          detail: "谁能接入共同生态，谁就更容易被消费者和市场接受。",
        },
      ],
      mediaCards: [
        {
          imageSrc: euCommonCharger,
          label: "外部推动",
          caption: "统一接口从工程选择，进一步变成市场规则和消费者预期。",
        },
        {
          imageSrc: multiUsbCharger,
          label: "环保背景",
          caption: "减少重复充电头和重复线材，本质上是在压低电子垃圾总量。",
        },
      ],
      duckPose: "present",
    },
  ],
  close: {
    title: "所以 USB-C 的胜利，不是因为它更小，而是因为它把体验、标准、功率和规则压进了一个口里。",
    body:
      "真正统一行业的，从来不是一个漂亮形状，而是这个形状背后能不能承接协议、生态、成本和监管四种力量。",
    tags: ["科技史", "接口统一", "标准战争", "产品演进"],
    mediaCards: [
      {
        imageSrc: usbCLaptop,
        label: "统一入口",
        caption: "接口一旦变成基础设施，产品设计就会围绕它重构。",
      },
      {
        imageSrc: euCommonCharger,
        label: "规则完成闭环",
        caption: "当外部规则确认它的价值，标准就从选项变成默认。",
      },
    ],
    duckPose: "present" as DuckPose,
  },
} as const;

export const techArchiveSubtitles = [
  { startFrame: 0, endFrame: 150, text: "为什么一个小小的 USB-C，最后能逼着整个行业统一接口？" },
  { startFrame: 151, endFrame: 300, text: "答案不是它更好看，而是它把形态、协议、功率和监管压力压进了同一个口里。" },
  { startFrame: 301, endFrame: 510, text: "在更早的时候，设备接口长期处在混战状态，用户要面对一堆不同的线和不同的充电头。" },
  { startFrame: 511, endFrame: 720, text: "USB-C 真正厉害的地方，是把可正反插、数据、供电和扩展，放进同一套标准语言里。" },
  { startFrame: 721, endFrame: 960, text: "当功率继续抬升，它就不再只是手机接口，而是开始进入笔记本、显示器和桌面扩展生态。" },
  { startFrame: 961, endFrame: 1230, text: "最后，监管和环保目标进一步压实了统一趋势，让通用接口从技术选择变成市场规则。" },
  { startFrame: 1231, endFrame: 1500, text: "所以 USB-C 的胜利，本质上是体验、标准、生态和规则一起推动出来的结果。" },
];
