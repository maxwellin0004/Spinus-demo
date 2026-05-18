type ExternalNotificationPayload = {
  userId?: string | null;
  role?: string;
  title: string;
  body: string;
  href?: string | null;
  event: string;
  channel?: "brand" | "creator" | "admin" | "payment" | "workflow";
};

export async function dispatchExternalNotification(payload: ExternalNotificationPayload) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const signal = AbortSignal.timeout(3000);
    await fetch(webhookUrl, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        ...(process.env.NOTIFICATION_WEBHOOK_SECRET ? { "x-tanglin-notification-secret": process.env.NOTIFICATION_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        ...payload,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
        sentAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("External notification dispatch failed", error);
  }
}
