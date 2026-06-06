// fallow-ignore-next-line unused-files
export function createNextRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  },
): Request {
  const { method = "GET", body, headers } = options ?? {};
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {
      Host: "localhost:3000",
      Origin: "http://localhost:3000",
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { ...init.headers, "Content-Type": "application/json" };
  }
  return new Request(`http://localhost:3000${url}`, init);
}
