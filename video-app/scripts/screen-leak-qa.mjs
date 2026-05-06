import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";

const DEFAULT_FRAME_COUNT = 6;
const DEFAULT_OCR_COMMAND = process.env.SCREEN_QA_OCR_COMMAND || "tesseract";

const screenLeakPatterns = [
  {id: "internal-labels", pattern: /Context|Sentiment|Consequence|Core\s*Mechanism/i},
  {id: "prompt-stage-labels", pattern: /\b(?:RISK|FIRST|THEN|ACTION)\b/i},
  {id: "case-placeholder", pattern: /\bCase\s*\d+\b/i},
  {id: "render-metadata", pattern: /new_signals|codex-job|xiaohongshu|renderCompositionId|templateId/i},
  {id: "workspace-path", pattern: /Output\s*->|data[\\/]+jobs|video-app[\\/]+public|[A-Z]:[\\/]|Users[\\/]/i},
  {
    id: "make-video-request",
    pattern: /\u751f\u6210(?:\u4e00\u4e2a|\u4e00\u6761|\u4e00\u6bb5)?\s*\d*\s*(?:\u79d2|\u5206\u949f)?\s*(?:\u7ad6\u5c4f|\u6a2a\u5c4f)?[^\u3002\uff1b;\n]{0,24}(?:\u89c6\u9891|\u77ed\u89c6\u9891)/,
  },
  {id: "platform-request", pattern: /\u5e73\u53f0\s*(?:\u662f|:|\uff1a)/},
  {id: "tone-request", pattern: /\u8bed\u6c14\s*(?:\u8981|\u662f|:|\uff1a)/},
  {
    id: "account-style",
    pattern: /\u8d26\u53f7\u4eba\u8bbe|\u5f53\u524d\u8d26\u53f7\u98ce\u683c|\u5f53\u524d\u6a21\u677f|\u8868\u8fbe\u98ce\u683c/,
  },
];

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
};

const readJson = (filePath) => {
  if (!filePath || !existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
};

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const clipText = (value, max = 110) => {
  const text = normalizeText(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const collectTextLeaks = ({jobPrompt, props}) => {
  const leaks = [];
  const promptFragments = normalizeText(jobPrompt)
    .split(/[\u3002\uff1b;\n]/)
    .map(normalizeText)
    .filter((fragment) => fragment.length >= 10);

  const visit = (value, pathLabel) => {
    if (typeof value === "string") {
      const text = normalizeText(value);
      if (!text) return;
      for (const rule of screenLeakPatterns) {
        if (rule.pattern.test(text)) {
          leaks.push({source: "props", rule: rule.id, path: pathLabel, text: clipText(text)});
          break;
        }
      }
      const promptMatch = promptFragments.find((fragment) => text.includes(fragment.slice(0, Math.min(fragment.length, 28))));
      if (promptMatch) {
        leaks.push({source: "props", rule: "prompt-fragment", path: pathLabel, text: clipText(text)});
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pathLabel}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, child]) => visit(child, `${pathLabel}.${key}`));
    }
  };

  visit(props?.data, "props.data");
  visit(
    (props?.audio?.subtitles || []).map((subtitle) => ({text: subtitle?.text || ""})),
    "props.audio.subtitles",
  );
  return leaks;
};

const deriveFrames = (props, explicitFrames) => {
  if (explicitFrames) {
    return explicitFrames
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((value) => Number.isFinite(value) && value >= 0);
  }

  const timeline = props?.timeline && typeof props.timeline === "object" ? props.timeline : null;
  if (!timeline) return [15, 90, 180, 300, 450, 600];

  let cursor = 0;
  const frames = [];
  for (const duration of Object.values(timeline)) {
    const numericDuration = Number(duration);
    if (!Number.isFinite(numericDuration) || numericDuration <= 0) continue;
    frames.push(Math.max(0, Math.round(cursor + numericDuration / 2)));
    cursor += numericDuration;
  }
  if (cursor > 0) frames.push(Math.max(0, cursor - 30));

  const stride = Math.max(1, Math.ceil(frames.length / DEFAULT_FRAME_COUNT));
  return [...new Set(frames.filter((_, index) => index % stride === 0).slice(0, DEFAULT_FRAME_COUNT))];
};

const runProcess = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const needsShell = process.platform === "win32" && /\.(cmd|bat)$/i.test(command);
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: needsShell,
      windowsHide: true,
      env: {...process.env, ...(options.env || {})},
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }
      const error = new Error(stderr.trim() || stdout.trim() || `${command} exited with code ${code}`);
      error.code = code;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
};

const renderStill = async ({composition, propsPath, frame, outputPath, npxCommand}) => {
  const args = ["remotion", "still", "src/index.ts", composition, outputPath, `--frame=${frame}`];
  if (propsPath) args.push(`--props=${propsPath}`);
  await runProcess(npxCommand, args, {cwd: process.cwd()});
};

const runOcr = async ({imagePath, ocrCommand}) => {
  const result = await runProcess(ocrCommand, [imagePath, "stdout", "-l", "chi_sim+eng", "--psm", "6"], {
    cwd: process.cwd(),
  });
  return normalizeText(result.stdout);
};

const collectOcrLeaks = (text, frame) => {
  if (!text) return [];
  const leaks = [];
  for (const rule of screenLeakPatterns) {
    if (rule.pattern.test(text)) {
      leaks.push({source: "ocr", rule: rule.id, frame, text: clipText(text)});
    }
  }
  return leaks;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const composition = args.composition || "codex-job-preview";
  const propsPath = args.props ? path.resolve(args.props) : "";
  const outputDir = path.resolve(args["output-dir"] || path.join("renders", "screen-leak-qa", composition));
  const reportPath = path.resolve(args.report || path.join(outputDir, "report.json"));
  const npxCommand = args.npx || (process.platform === "win32" ? "npx.cmd" : "npx");
  const ocrCommand = args.ocr || DEFAULT_OCR_COMMAND;
  const skipOcr = Boolean(args["no-ocr"] || args["skip-ocr"]);
  const props = readJson(propsPath) || {};
  const frames = deriveFrames(props, args.frames);
  const report = {
    version: "screen-leak-qa-v1",
    composition,
    propsPath,
    outputDir,
    frames,
    status: "passed",
    warnings: [],
    textLeaks: collectTextLeaks({jobPrompt: args.prompt || "", props}),
    ocrLeaks: [],
    images: [],
    createdAt: new Date().toISOString(),
  };

  mkdirSync(outputDir, {recursive: true});

  for (const frame of frames) {
    const imagePath = path.join(outputDir, `${composition}-frame-${String(frame).padStart(5, "0")}.png`);
    await renderStill({composition, propsPath, frame, outputPath: imagePath, npxCommand});
    const imageRecord = {frame, path: imagePath, ocrText: ""};
    if (skipOcr) {
      imageRecord.ocrSkipped = true;
      imageRecord.ocrSkipReason = "disabled";
    } else {
      try {
        const ocrText = await runOcr({imagePath, ocrCommand});
        imageRecord.ocrText = ocrText;
        report.ocrLeaks.push(...collectOcrLeaks(ocrText, frame));
      } catch (error) {
        if (error.code === "ENOENT") {
          report.warnings.push(`OCR unavailable: ${ocrCommand}`);
          imageRecord.ocrSkipped = true;
        } else {
          report.warnings.push(`OCR failed at frame ${frame}: ${error.message}`);
          imageRecord.ocrFailed = true;
        }
      }
    }
    report.images.push(imageRecord);
  }

  if (report.textLeaks.length || report.ocrLeaks.length) {
    report.status = "failed";
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  if (report.status === "failed") {
    const leak = report.ocrLeaks[0] || report.textLeaks[0];
    console.error(`Screen visual QA failed: ${leak.rule} at ${leak.path || `frame ${leak.frame}`}: ${leak.text}`);
    process.exit(2);
  }

  const warningSummary = report.warnings.length ? ` warnings=${report.warnings.length}` : "";
  console.log(`Screen visual QA passed: frames=${frames.length}${warningSummary}`);
};

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exit(1);
});
