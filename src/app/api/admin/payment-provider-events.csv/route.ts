import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function jsonText(value: unknown) {
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function GET() {
  await requireAdminPermission("payment.view");
  const events = await prisma.paymentProviderEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const rows = [
    [
      "provider",
      "event_type",
      "event_key",
      "entity_type",
      "entity_id",
      "status",
      "error_message",
      "request_json",
      "response_json",
      "processed_at",
      "created_at",
    ],
    ...events.map((event) => [
      event.provider,
      event.eventType,
      event.eventKey,
      event.entityType ?? "",
      event.entityId ?? "",
      event.status,
      event.errorMessage ?? "",
      jsonText(event.requestJson),
      jsonText(event.responseJson),
      event.processedAt?.toISOString() ?? "",
      event.createdAt.toISOString(),
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payment-provider-events.csv"`,
    },
  });
}
