import crypto from "node:crypto";

function encryptionKey() {
  const secret = process.env.PAYMENT_CONFIG_SECRET || process.env.AUTH_SECRET;
  if (!secret || secret === "local-dev-secret-change-me") {
    throw new Error("PAYMENT_CONFIG_SECRET or a strong AUTH_SECRET is required for encrypted payment settings.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const [version, ivBase64, tagBase64, encryptedBase64] = value.split(":");
  if (version !== "v1" || !ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Unsupported encrypted secret format.");
  }
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedBase64, "base64")), decipher.final()]).toString("utf8");
}
