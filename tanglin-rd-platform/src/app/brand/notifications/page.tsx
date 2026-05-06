import { UserRole } from "@prisma/client";
import { NotificationsPage } from "@/components/notifications-page";

export default function BrandNotificationsPage() {
  return <NotificationsPage role={UserRole.BRAND} />;
}
