import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { UserRole } from "@prisma/client";
import { creatorRegisterUrl } from "@/lib/creator-marketing";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const posterTemplatePath = path.join(process.cwd(), "public", "creator-share-poster-template.png");

async function readTemplateDataUrl() {
  const buffer = await fs.readFile(posterTemplatePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== UserRole.CREATOR) {
    return new Response("Unauthorized", { status: 401 });
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!creator) {
    return new Response("Creator not found", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const registerUrl = creatorRegisterUrl(creator.shareCode, origin);
  const [posterTemplateDataUrl, qrCodeDataUrl] = await Promise.all([
    readTemplateDataUrl(),
    QRCode.toDataURL(registerUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    }),
  ]);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="941" height="1672" viewBox="0 0 941 1672" fill="none">
      <image href="${posterTemplateDataUrl}" width="941" height="1672" />
      <rect x="681" y="1328" width="182" height="182" rx="12" fill="#ffffff" />
      <image href="${qrCodeDataUrl}" x="695" y="1342" width="154" height="154" />
    </svg>
  `.trim();

  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      ...(download ? { "Content-Disposition": `attachment; filename="creator-share-poster-${creator.shareCode}.svg"` } : {}),
    },
  });
}
