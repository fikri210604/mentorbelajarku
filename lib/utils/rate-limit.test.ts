import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("mengizinkan request hingga batas lalu memblokir", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    const options = { key, limit: 3, windowMs: 60_000 };

    expect(checkRateLimit(options).allowed).toBe(true);
    expect(checkRateLimit(options).allowed).toBe(true);
    expect(checkRateLimit(options).allowed).toBe(true);

    const blocked = checkRateLimit(options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("menghitung sisa kuota", () => {
    const key = `test-remaining-${Date.now()}-${Math.random()}`;
    const first = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    expect(first.remaining).toBe(1);
  });
});
