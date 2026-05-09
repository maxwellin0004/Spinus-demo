import Link from "next/link";
import { UserRole } from "@prisma/client";
import { markNotificationReadAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { zhText } from "@/lib/i18n";

export async function NotificationsPage({ role }: { role: UserRole }) {
  const session = await requireRole(role);
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Notifications" title="Inbox" />
      {notifications.length === 0 ? <EmptyState title="No records yet" body="Records will appear here when the workflow starts." /> : null}
      {notifications.map((notification) => (
        <Card key={notification.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{notification.title}</h2>
                {notification.unread ? <StatusBadge>unread</StatusBadge> : null}
              </div>
              <p className="mt-2 text-stone-600">{notification.body}</p>
              <p className="mt-2 text-sm text-stone-500">{shortDate(notification.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              {notification.href ? (
                <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold" href={notification.href}>
                  {zhText("Open")}
                </Link>
              ) : null}
              {notification.unread ? (
                <form action={markNotificationReadAction.bind(null, notification.id)}>
                  <SubmitButton pendingLabel="Marking..." variant="ghost">Mark read</SubmitButton>
                </form>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
