import { refreshCreatorTrendDailySnapshots } from "@/lib/insights/creator-daily-snapshots";
import { verifyInsightsToken } from "@/lib/insights/collector";

function json(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

export async function POST(request: Request) {
  if (!verifyInsightsToken(request)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = (await request.json().catch(() => null)) as { force?: boolean } | null;
    const result = await refreshCreatorTrendDailySnapshots({ force: body?.force === true });
    return json({ ok: true, ...result });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
}
