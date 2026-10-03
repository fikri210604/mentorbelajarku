import { randomUUID } from "crypto";

/**
 * Menghasilkan request/correlation ID untuk logging terstruktur dan
 * penelusuran error di server tanpa membocorkan detail ke client.
 */
export function getRequestId(request?: Request): string {
  const headerId = request?.headers.get("x-request-id");
  if (headerId && headerId.length <= 128) return headerId;
  return randomUUID();
}

/**
 * Logging error terstruktur dengan request ID.
 */
export function logServerError(scope: string, err: unknown, requestId?: string): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      requestId: requestId ?? null,
      detail,
      at: new Date().toISOString(),
    })
  );
}
