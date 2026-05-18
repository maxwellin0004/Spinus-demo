import { AdminLevel, Prisma } from "@prisma/client";
import { dispatchExternalNotification } from "@/lib/external-notifications";

type NotificationTx = Prisma.TransactionClient;

export async function notifyPaymentAdmins(
  tx: NotificationTx,
  {
    brandId,
    title,
    body,
    href = "/admin/payments",
  }: {
    brandId?: string | null;
    title: string;
    body: string;
    href?: string;
  },
) {
  const [brand, paymentAdmins] = await Promise.all([
    brandId
      ? tx.brandProfile.findUnique({
          where: { id: brandId },
          select: { responsibleAdmin: { select: { userId: true } } },
        })
      : null,
    tx.adminProfile.findMany({
      where: {
        OR: [{ level: AdminLevel.FOUNDER }, { permissions: { has: "payment.manage" } }, { permissions: { has: "payment.view" } }],
      },
      select: { userId: true },
    }),
  ]);
  const userIds = new Set(paymentAdmins.map((admin) => admin.userId));
  if (brand?.responsibleAdmin?.userId) userIds.add(brand.responsibleAdmin.userId);
  if (!userIds.size) return;

  await tx.notification.createMany({
    data: Array.from(userIds).map((userId) => ({
      userId,
      title,
      body,
      href,
    })),
  });
  await Promise.all(
    Array.from(userIds).map((userId) =>
      dispatchExternalNotification({
        userId,
        role: "ADMIN",
        event: "payment.admin_notification",
        channel: "payment",
        title,
        body,
        href,
      }),
    ),
  );
}

export async function notifyBrand(
  tx: NotificationTx,
  {
    brandId,
    title,
    body,
    href = "/brand/billing",
  }: {
    brandId: string;
    title: string;
    body: string;
    href?: string;
  },
) {
  const brand = await tx.brandProfile.findUnique({
    where: { id: brandId },
    select: { userId: true },
  });
  if (!brand?.userId) return;

  await tx.notification.create({
    data: {
      userId: brand.userId,
      title,
      body,
      href,
    },
  });
  await dispatchExternalNotification({
    userId: brand.userId,
    role: "BRAND",
    event: "payment.brand_notification",
    channel: "payment",
    title,
    body,
    href,
  });
}
