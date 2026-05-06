import { UserRole } from "@prisma/client";
import { NotificationsPage } from "@/components/notifications-page";

export default function CreatorNotificationsPage() {
  return <NotificationsPage role={UserRole.CREATOR} />;
}
