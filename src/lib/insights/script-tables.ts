export type ScriptSourceType = "TOPIC_RECOMMENDATION" | "CASE_STUDY";
export type ScriptGenerationStatus = "GENERATING" | "READY" | "FAILED";
export type ScriptGenerationMode = "AI" | "FALLBACK";

export type ScriptTable = {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
};

export type ScriptTableGroupKey = "graphicTables" | "videoTables" | "caseAnalysisTables";

export type ScriptTableValidation = {
  ok: boolean;
  groupKey: ScriptTableGroupKey;
  tableCount: number;
  rowCount: number;
  issues: string[];
};

export type ScriptGenerationView = {
  id: string;
  sourceType: ScriptSourceType;
  sourceKey: string;
  sourceTitle: string;
  platform: string | null;
  status: ScriptGenerationStatus;
  generationMode: ScriptGenerationMode;
  model: string | null;
  userInstruction: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
  updatedAt: string;
  graphicTables: ScriptTable[];
  videoTables: ScriptTable[];
  caseAnalysisTables: ScriptTable[];
  plainText: string;
};

function stringValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function normalizeScriptTables(value: unknown): ScriptTable[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const columns = Array.isArray(record.columns) ? record.columns.map(stringValue).filter(Boolean) : [];
      const rows = Array.isArray(record.rows)
        ? record.rows
            .map((row) => {
              if (!Array.isArray(row)) return null;
              const normalized = row.map(stringValue);
              return normalized.length > 0 ? normalized : null;
            })
            .filter((row): row is string[] => Boolean(row))
        : [];

      if (columns.length === 0 || rows.length === 0) return null;
      return {
        id: stringValue(record.id) || `table_${index + 1}`,
        title: stringValue(record.title) || `表格 ${index + 1}`,
        columns,
        rows: rows.map((row) => {
          if (row.length === columns.length) return row;
          if (row.length > columns.length) return row.slice(0, columns.length);
          return [...row, ...Array.from({ length: columns.length - row.length }, () => "")];
        }),
      };
    })
    .filter((item): item is ScriptTable => Boolean(item));
}

const REQUIRED_TABLE_COUNTS: Record<ScriptTableGroupKey, number> = {
  graphicTables: 6,
  videoTables: 10,
  caseAnalysisTables: 10,
};

const REQUIRED_TABLE_KEYWORDS: Record<ScriptTableGroupKey, string[]> = {
  graphicTables: ["策略", "封面", "分页", "图片生成提示词", "发布", "合规"],
  videoTables: ["结构", "口播", "分镜", "素材", "字幕", "音频", "动画", "Remotion", "发布", "合规"],
  caseAnalysisTables: ["基础", "标题", "Hook", "结构", "视觉", "布局", "图层", "动画", "字幕", "素材"],
};

function tableContainsKeyword(table: ScriptTable, keyword: string) {
  const text = `${table.id} ${table.title} ${table.columns.join(" ")}`.toLowerCase();
  return text.includes(keyword.toLowerCase());
}

function findTableByKeywords(tables: ScriptTable[], keywords: string[]) {
  return tables.find((table) => keywords.some((keyword) => tableContainsKeyword(table, keyword)));
}

function findColumnIndex(table: ScriptTable, keywords: string[]) {
  return table.columns.findIndex((column) => keywords.some((keyword) => column.toLowerCase().includes(keyword.toLowerCase())));
}

function nonEmptyCellLength(value: string | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return 0;
  return text.length;
}

function rowDetailScore(table: ScriptTable, row: string[]) {
  return row
    .map((cell, index) => (index === 0 && table.columns.length > 2 ? "" : cell))
    .join("")
    .replace(/\s+/g, "")
    .length;
}

function hasPlaceholderCells(table: ScriptTable) {
  return table.rows.some((row) =>
    row.some((cell) => /^(string|todo|待补充|示例|xxx|[-_]+)$/i.test(cell.trim()) || /^(内容|文案|画面|提示词|评论引导)$/.test(cell.trim())),
  );
}

function addPromptQualityIssues(groupKey: ScriptTableGroupKey, tables: ScriptTable[], issues: string[]) {
  for (const table of tables) {
    if (hasPlaceholderCells(table)) {
      issues.push(`${table.title} 存在占位词或过短泛词，请改成完整、具体、可执行的内容。`);
      break;
    }
  }

  if (groupKey === "graphicTables") {
    const pageTable = findTableByKeywords(tables, ["分页"]);
    if (!pageTable || pageTable.rows.length < 6) {
      issues.push("图文分页脚本表至少需要 6 页，覆盖封面、痛点、核心观点、步骤/体验、证据、总结/互动。");
    } else {
      const weakRows = pageTable.rows.filter((row) => rowDetailScore(pageTable, row) < 70);
      if (weakRows.length > 0) issues.push("图文分页脚本表存在过短行；每页要写清页面目标、画面建议、页面文案、排版建议和互动目的。");
    }

    const promptTable = findTableByKeywords(tables, ["图片生成提示词"]);
    if (!promptTable || promptTable.rows.length < 5) {
      issues.push("图片生成提示词表至少需要 5 行，并与图文分页主要页面对齐。");
    } else {
      const positiveIndex = findColumnIndex(promptTable, ["正向", "imagePrompt", "提示词"]);
      const negativeIndex = findColumnIndex(promptTable, ["负向", "negative"]);
      const weakPositiveRows = positiveIndex >= 0 ? promptTable.rows.filter((row) => nonEmptyCellLength(row[positiveIndex]) < 50) : promptTable.rows;
      const weakNegativeRows = negativeIndex >= 0 ? promptTable.rows.filter((row) => nonEmptyCellLength(row[negativeIndex]) < 24) : promptTable.rows;
      if (weakPositiveRows.length > 1) issues.push("图片生成正向提示词太短，需要写清主体、场景、构图、光线、风格和留白。");
      if (weakNegativeRows.length > 1) issues.push("图片生成负向提示词太短，需要写清不要文字乱码、水印、品牌露出、低清晰度等限制。");
    }
  }

  if (groupKey === "videoTables") {
    const voiceTable = findTableByKeywords(tables, ["口播"]);
    if (!voiceTable || voiceTable.rows.length < 6) {
      issues.push("口播脚本表至少需要 6 段，并覆盖 hook、痛点、判断、步骤、证据和 CTA。");
    } else {
      const textIndex = findColumnIndex(voiceTable, ["text", "口播", "内容"]);
      const weakRows = textIndex >= 0 ? voiceTable.rows.filter((row) => nonEmptyCellLength(row[textIndex]) < 22) : voiceTable.rows.filter((row) => rowDetailScore(voiceTable, row) < 60);
      if (weakRows.length > 1) issues.push("口播脚本不是完整可录制句子；每段 text 需要是可直接 TTS/录音的完整话术。");
    }

    const storyboardTable = findTableByKeywords(tables, ["分镜"]);
    if (!storyboardTable || storyboardTable.rows.length < 6) {
      issues.push("分镜画面表至少需要 6 个镜头或段落。");
    } else {
      const weakRows = storyboardTable.rows.filter((row) => rowDetailScore(storyboardTable, row) < 85);
      if (weakRows.length > 1) issues.push("分镜画面表存在过短行；需要写清主体、构图、屏幕文字、运动方式、转场和素材 slot。");
    }

    const remotionTable = findTableByKeywords(tables, ["Remotion"]);
    if (!remotionTable || remotionTable.rows.length < 4) {
      issues.push("Remotion 映射表至少需要 4 行，包含 sceneId、组件名、输入字段、动画 preset 和素材 slot。");
    }
  }

  if (groupKey === "caseAnalysisTables") {
    const visualTable = findTableByKeywords(tables, ["视觉", "逐镜头"]);
    const layoutTable = findTableByKeywords(tables, ["布局"]);
    if (!visualTable || visualTable.rows.length < 4) issues.push("爆款拆解需要至少 4 行逐镜头视觉观察。");
    if (!layoutTable || layoutTable.rows.length < 4) issues.push("爆款拆解需要至少 4 行逐镜头布局分析。");
    const hasEvidenceLanguage = tables.some((table) => /观察|事实|推断|证据|estimated|none/i.test(`${table.columns.join(" ")} ${table.rows.flat().join(" ")}`));
    if (!hasEvidenceLanguage) issues.push("爆款拆解需要区分观察事实、模板推断和证据等级，证据不足时写 estimated 或 none。");
  }
}

export function validateScriptTables(groupKey: ScriptTableGroupKey, tables: ScriptTable[]): ScriptTableValidation {
  const issues: string[] = [];
  const expectedCount = REQUIRED_TABLE_COUNTS[groupKey];
  if (tables.length === 0) {
    issues.push(`缺少 ${groupKey} 表格数组，或数组为空。`);
  }
  if (tables.length > 0 && tables.length < expectedCount) {
    issues.push(`${groupKey} 至少应包含 ${expectedCount} 张表，当前只有 ${tables.length} 张。`);
  }

  tables.forEach((table, index) => {
    if (!table.id.trim()) issues.push(`第 ${index + 1} 张表缺少 id。`);
    if (!table.title.trim()) issues.push(`第 ${index + 1} 张表缺少 title。`);
    if (table.columns.length === 0) issues.push(`第 ${index + 1} 张表缺少 columns。`);
    if (table.rows.length === 0) issues.push(`第 ${index + 1} 张表缺少 rows。`);
    const hasColumnMismatch = table.rows.some((row) => row.length !== table.columns.length);
    if (hasColumnMismatch) issues.push(`第 ${index + 1} 张表存在列数不一致的行，已尝试补齐或截断。`);
  });

  const missingKeywords = REQUIRED_TABLE_KEYWORDS[groupKey].filter((keyword) => !tables.some((table) => tableContainsKeyword(table, keyword)));
  if (missingKeywords.length > 0) {
    issues.push(`缺少这些核心表模块：${missingKeywords.join("、")}。`);
  }

  addPromptQualityIssues(groupKey, tables, issues);

  return {
    ok: issues.length === 0,
    groupKey,
    tableCount: tables.length,
    rowCount: tables.reduce((sum, table) => sum + table.rows.length, 0),
    issues,
  };
}

export function findTablesPayload(value: unknown, groupKey: ScriptTableGroupKey): unknown {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record[groupKey])) return record[groupKey];

  const aliases: Record<ScriptTableGroupKey, string[]> = {
    graphicTables: ["graphic_tables", "graphics", "graphic", "tables"],
    videoTables: ["video_tables", "videos", "video", "tables"],
    caseAnalysisTables: ["case_analysis_tables", "caseTables", "case", "analysisTables", "tables"],
  };
  for (const key of aliases[groupKey]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = (candidate as Record<string, unknown>)[groupKey];
      if (Array.isArray(nested)) return nested;
    }
  }
  return undefined;
}

export function validationSummary(validation: ScriptTableValidation) {
  if (validation.ok) return `校验通过：${validation.tableCount} 张表，${validation.rowCount} 行。`;
  return `校验未通过：${validation.issues.join("；")}`;
}

export function tablesToPlainText(groups: Array<{ title: string; tables: ScriptTable[] }>) {
  return groups
    .filter((group) => group.tables.length > 0)
    .map((group) => {
      const body = group.tables
        .map((table) => {
          const header = table.columns.join("\t");
          const rows = table.rows.map((row) => row.join("\t")).join("\n");
          return [`## ${table.title}`, header, rows].filter(Boolean).join("\n");
        })
        .join("\n\n");
      return [`# ${group.title}`, body].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function sourceTypeLabel(sourceType: ScriptSourceType) {
  return sourceType === "CASE_STUDY" ? "爆款案例" : "选题推荐";
}
