import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function cleanPathPart(value: string) {
  return value
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .join("/");
}

function safeFilename(file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const random = crypto.randomUUID();
  return `${Date.now()}-${random}-${safeName}`;
}

function publicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when STORAGE_PROVIDER=s3`);
  return value;
}

async function saveLocal(bytes: Buffer, file: File, folder: string) {
  const filename = safeFilename(file);
  const relativeDir = path.join("uploads", cleanPathPart(folder));
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), bytes);
  return `/${relativeDir}/${filename}`.replaceAll("\\", "/");
}

async function saveS3(bytes: Buffer, file: File, folder: string) {
  const bucket = requireEnv("S3_BUCKET");
  const endpoint = requireEnv("S3_ENDPOINT");
  const publicBaseUrl = requireEnv("S3_PUBLIC_BASE_URL");
  const key = `uploads/${cleanPathPart(folder)}/${safeFilename(file)}`;
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bytes,
    ContentType: file.type || "application/octet-stream",
  }));

  return publicUrl(publicBaseUrl, key);
}

export async function saveUploadedFile(file: File, folder = "uploads") {
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (process.env.STORAGE_PROVIDER === "s3") return saveS3(bytes, file, folder);
  return saveLocal(bytes, file, folder);
}
