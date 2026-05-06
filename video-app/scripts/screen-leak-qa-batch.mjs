import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";

const defaultCompositions = [
  "minimal-psych-explainer-preview",
  "comic-habit-spiral-preview",
  "comic-emotional-scroll-preview",
  "tech-archive-explainer-preview",
  "social-post-preview",
  "future-income-tracks-preview",
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

const runProcess = (command, args, options = {}) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
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
    child.on("error", (error) => {
      resolve({code: 1, stdout, stderr: error.message});
    });
    child.on("close", (code) => {
      resolve({code: code ?? 1, stdout, stderr});
    });
  });
};

const readJson = (filePath) => {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const compositions = String(args.compositions || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const targets = compositions.length ? compositions : defaultCompositions;
  const outputDir = path.resolve(args["output-dir"] || path.join("renders", "screen-leak-qa-batch"));
  const summaryPath = path.resolve(args.report || path.join(outputDir, "summary.json"));
  const frames = args.frames || "90,300,560";
  const results = [];

  mkdirSync(outputDir, {recursive: true});

  for (const composition of targets) {
    const compositionDir = path.join(outputDir, composition);
    const reportPath = path.join(compositionDir, "report.json");
    const childArgs = [
      path.join("scripts", "screen-leak-qa.mjs"),
      "--composition",
      composition,
      "--output-dir",
      compositionDir,
      "--report",
      reportPath,
      "--frames",
      frames,
    ];
    if (args["no-ocr"] || args["skip-ocr"]) childArgs.push("--no-ocr");
    if (args.ocr) childArgs.push("--ocr", args.ocr);

    const result = await runProcess(process.execPath, childArgs, {cwd: process.cwd()});
    const report = readJson(reportPath);
    results.push({
      composition,
      status: report?.status || (result.code === 0 ? "passed" : "error"),
      code: result.code,
      reportPath,
      textLeakCount: report?.textLeaks?.length || 0,
      ocrLeakCount: report?.ocrLeaks?.length || 0,
      warningCount: report?.warnings?.length || 0,
      error: result.code === 0 ? "" : (result.stderr || result.stdout || "").trim(),
    });
  }

  const summary = {
    version: "screen-leak-qa-batch-v1",
    frames,
    outputDir,
    total: results.length,
    passed: results.filter((item) => item.status === "passed").length,
    failed: results.filter((item) => item.status === "failed").length,
    errors: results.filter((item) => item.status === "error").length,
    results,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

  if (summary.failed || summary.errors) {
    console.error(`Screen QA batch failed: failed=${summary.failed} errors=${summary.errors}`);
    process.exit(2);
  }
  console.log(`Screen QA batch passed: ${summary.passed}/${summary.total}`);
};

main().catch((error) => {
  console.error(error?.message || String(error));
  process.exit(1);
});
