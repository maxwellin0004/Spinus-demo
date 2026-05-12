type TikHubRequestOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export class TikHubError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "TikHubError";
    this.status = status;
    this.payload = payload;
  }
}

function getBaseUrl() {
  return (process.env.TIKHUB_BASE_URL || "https://api.tikhub.io").replace(/\/$/, "");
}

function getApiKey() {
  return process.env.TIKHUB_API_KEY?.trim();
}

export function hasTikHubConfig() {
  return Boolean(getApiKey());
}

export async function tikhubRequest<T>(path: string, options: TikHubRequestOptions = {}): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new TikHubError("TIKHUB_API_KEY is not configured.", 401, null);
  }

  const url = new URL(`${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new TikHubError(`TikHub request failed: ${response.status}`, response.status, payload);
  }

  return payload as T;
}
