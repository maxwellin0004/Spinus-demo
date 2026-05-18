import { UserRole } from "@prisma/client";
import { SupportCenterPage } from "@/components/support-center-page";

export default async function BrandSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ticket?: string }>;
}) {
  const { error, ticket } = await searchParams;
  return <SupportCenterPage role={UserRole.BRAND} error={error} focusedTicketId={ticket} />;
}
