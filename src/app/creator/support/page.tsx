import { UserRole } from "@prisma/client";
import { SupportCenterPage } from "@/components/support-center-page";

export default async function CreatorSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ticket?: string }>;
}) {
  const { error, ticket } = await searchParams;
  return <SupportCenterPage role={UserRole.CREATOR} error={error} focusedTicketId={ticket} />;
}
