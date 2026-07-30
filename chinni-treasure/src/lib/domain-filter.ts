import { Prisma } from "@prisma/client";

function stripPort(host: string): string {
  return host.split(":")[0].toLowerCase();
}

export function getHostFromRequest(request: Request): string | null {
  return request.headers.get("host");
}

export function domainFilterWhere(hostname: string | null): Prisma.ProductWhereInput {
  if (!hostname) return {};

  const h = stripPort(hostname);
  return {
    OR: [
      { visibleHostnames: null },
      { visibleHostnames: "" },
      { visibleHostnames: { contains: h, mode: "insensitive" } },
    ],
  };
}
