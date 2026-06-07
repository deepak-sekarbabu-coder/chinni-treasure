import { z } from "zod";
import { ApiErrorSchema } from "@/src/lib/api-schemas";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class ValidationError extends ApiError {
  issues: z.ZodIssue[];

  constructor(message: string, status: number, body: unknown, issues: z.ZodIssue[]) {
    super(message, status, body);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export class NetworkError extends Error {
  cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

interface RequestOptions<TResponse> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  schema?: z.ZodType<TResponse>;
  signal?: AbortSignal;
  responseType?: "json" | "blob";
}

function buildHeaders(options: RequestOptions<unknown>): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }
  return headers;
}

async function readErrorBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  const parsed = ApiErrorSchema.safeParse(body);
  if (parsed.success) {
    return parsed.data.error || parsed.data.message || fallback;
  }
  return fallback;
}

export async function apiFetch<TResponse = unknown>(
  url: string,
  options: RequestOptions<TResponse> = {},
): Promise<TResponse> {
  const { method = "GET", body, schema, signal, responseType = "json" } = options;
  const init: RequestInit = {
    method,
    headers: buildHeaders(options),
    credentials: "same-origin",
  };
  if (signal) init.signal = signal;
  if (body !== undefined) {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new NetworkError("Network request failed", err);
  }

  if (!res.ok) {
    const errBody = await readErrorBody(res);
    const message = extractErrorMessage(errBody, res.statusText || "Request failed");
    throw new ApiError(message, res.status, errBody);
  }

  if (responseType === "blob") {
    return (await res.blob()) as unknown as TResponse;
  }

  if (res.status === 204) {
    return undefined as TResponse;
  }

  const text = await res.text();
  if (!text) return undefined as TResponse;

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError("Invalid JSON response", res.status, text);
  }

  if (schema) {
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError(
        "Response failed schema validation",
        res.status,
        json,
        parsed.error.issues,
      );
    }
    return parsed.data as TResponse;
  }

  return json as TResponse;
}
