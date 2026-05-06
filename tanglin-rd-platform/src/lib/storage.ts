import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function saveUploadedFile(file: File, folder = "uploads") {
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const filename = `${Date.now()}-${safeName}`;
  const relativeDir = path.join("uploads", folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), bytes);
  return `/${relativeDir}/${filename}`.replaceAll("\\", "/");
}
