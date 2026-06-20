function isAllowedDevOrigin(host: string): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export function isHostAllowed(host: string, originOrReferer: string | null): boolean {
  if (!originOrReferer) return false;
  try {
    const url = new URL(originOrReferer);
    return url.host === host || isAllowedDevOrigin(url.host);
  } catch {
    return false;
  }
}
