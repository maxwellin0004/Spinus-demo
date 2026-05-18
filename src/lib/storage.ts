import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const defaultAllowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "video/mp4",
  "video/quicktime",
]);

const defaultAllowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv", ".mp4", ".mov"]);
const defaultMaxBytes = Number(process.env.UPLOAD_MAX_BYTES || 50 * 1024 * 1024);

type UploadOptions = {
  maxBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
};

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

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".bin";
}

function safeGeneratedFilename(name: string, mimeType: string) {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "generated-image";
  return `${Date.now()}-${crypto.randomUUID()}-${base}${extensionFromMimeType(mimeType)}`;
}

function validateUpload(file: File, options: UploadOptions = {}) {
  const maxBytes = options.maxBytes ?? defaultMaxBytes;
  if (file.size > maxBytes) {
    throw new Error(`Uploaded file is too large. Maximum size is ${Math.floor(maxBytes / 1024 / 1024)} MB.`);
  }

  const allowedMimeTypes = new Set(options.allowedMimeTypes ?? [...defaultAllowedMimeTypes]);
  const allowedExtensions = new Set((options.allowedExtensions ?? [...defaultAllowedExtensions]).map((item) => item.toLowerCase()));
  const extension = path.extname(file.name).toLowerCase();
  const mimeType = file.type || "application/octet-stream";
  if (!allowedMimeTypes.has(mimeType) || !allowedExtensions.has(extension)) {
    throw new Error("Uploaded file type is not allowed.");
  }
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

async function saveLocalBytes(bytes: Buffer, mimeType: string, folder: string, name: string) {
  const filename = safeGeneratedFilename(name, mimeType);
  const relativeDir = path.join("uploads", cleanPathPart(folder));
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, filename), bytes);
  return `/${relativeDir}/${filename}`.replaceAll("\\", "/");
}

async function saveS3Bytes(bytes: Buffer, mimeType: string, folder: string, name: string) {
  const bucket = requireEnv("S3_BUCKET");
  const endpoint = requireEnv("S3_ENDPOINT");
  const publicBaseUrl = requireEnv("S3_PUBLIC_BASE_URL");
  const key = `uploads/${cleanPathPart(folder)}/${safeGeneratedFilename(name, mimeType)}`;
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
    ContentType: mimeType,
  }));

  return publicUrl(publicBaseUrl, key);
}

export async function saveUploadedFile(file: File, folder = "uploads", options: UploadOptions = {}) {
  if (!file || file.size === 0) return null;
  validateUpload(file, options);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (process.env.STORAGE_PROVIDER === "s3") return saveS3(bytes, file, folder);
  return saveLocal(bytes, file, folder);
}

export async function saveGeneratedImage(bytes: Buffer, mimeType = "image/png", folder = "generated-images", name = "generated-image") {
  if (!bytes.length) throw new Error("Generated image is empty.");
  if (bytes.length > defaultMaxBytes) {
    throw new Error(`Generated image is too large. Maximum size is ${Math.floor(defaultMaxBytes / 1024 / 1024)} MB.`);
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
    throw new Error("Generated image type is not allowed.");
  }
  if (process.env.STORAGE_PROVIDER === "s3") return saveS3Bytes(bytes, mimeType, folder, name);
  return saveLocalBytes(bytes, mimeType, folder, name);
}
