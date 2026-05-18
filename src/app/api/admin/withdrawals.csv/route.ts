import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdminPermission("payment.view");
  const withdrawals = await prisma.withdrawalRequest.findMany({ where: { isDemo: false }, include: { creator: true }, orderBy: { createdAt: "desc" } });
  const rows = [
    ["creator", "amount", "currency", "method", "status", "admin_note", "created_at"],
    ...withdrawals.map((request) => [
      request.creator.displayName,
      request.amount,
      request.currency,
      request.payoutMethod,
      request.status,
      request.adminNote ?? "",
      request.createdAt.toISOString(),
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="withdrawals.csv"`,
    },
  });
}
