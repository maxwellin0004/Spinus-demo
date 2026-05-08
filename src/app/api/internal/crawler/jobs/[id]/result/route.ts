import { completeCrawlerJob, crawlerJson, parseCrawlerResult, verifyCrawlerToken } from "@/lib/crawler";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCrawlerToken(request)) {
    return crawlerJson({ error: "Unauthorized" }, 401);
  }

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return crawlerJson({ error: "Invalid JSON body" }, 400);
  }

  const parsed = parseCrawlerResult(body);
  if (!parsed.success) {
    return crawlerJson({ error: "Invalid crawler result", issues: parsed.error.flatten() }, 400);
  }

  const result = await completeCrawlerJob(id, parsed.data);
  return crawlerJson(result.body, result.status);
}
