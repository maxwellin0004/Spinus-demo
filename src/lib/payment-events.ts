import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type BeginPaymentEventInput = {
  provider: string;
  eventType: string;
  eventKey: string;
  entityType?: string;
  entityId?: string;
  requestJson?: Prisma.InputJsonValue;
};

type CompletePaymentEventInput = {
  id: string;
  status: "SUCCESS" | "FAILED" | "IGNORED";
  responseJson?: Prisma.InputJsonValue;
  errorMessage?: string;
};

export async function beginPaymentProviderEvent(input: BeginPaymentEventInput) {
  const existing = await prisma.paymentProviderEvent.findUnique({
    where: { provider_eventKey: { provider: input.provider, eventKey: input.eventKey } },
  });
  if (existing) return { event: existing, duplicate: true as const };

  const event = await prisma.paymentProviderEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      eventKey: input.eventKey,
      entityType: input.entityType,
      entityId: input.entityId,
      requestJson: input.requestJson,
    },
  });
  return { event, duplicate: false as const };
}

export async function completePaymentProviderEvent(input: CompletePaymentEventInput) {
  await prisma.paymentProviderEvent.update({
    where: { id: input.id },
    data: {
      status: input.status,
      responseJson: input.responseJson,
      errorMessage: input.errorMessage,
      processedAt: new Date(),
    },
  });
}

export function paymentEventKey(...parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) => String(part ?? ""))
    .join(":")
    .replace(/\s+/g, "_")
    .slice(0, 512);
}
