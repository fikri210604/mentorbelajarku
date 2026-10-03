import { describe, it, expect } from "vitest";
import {
  estimateBase64Bytes,
  detectImageMimeFromMagicBytes,
  validateImageDataUrl,
} from "./image-validation";

describe("estimateBase64Bytes", () => {
  it("menghitung ukuran mendekati byte asli", () => {
    // 3 byte -> 4 karakter base64 tanpa padding
    expect(estimateBase64Bytes("AAAA")).toBe(3);
  });

  it("menghormati padding", () => {
    expect(estimateBase64Bytes("AA==")).toBe(1);
    expect(estimateBase64Bytes("AAA=")).toBe(2);
  });
});

describe("detectImageMimeFromMagicBytes", () => {
  it("mendeteksi JPEG", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageMimeFromMagicBytes(jpeg)).toBe("image/jpeg");
  });

  it("mendeteksi PNG", () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from([0x00]),
    ]);
    expect(detectImageMimeFromMagicBytes(png)).toBe("image/png");
  });

  it("mendeteksi WEBP", () => {
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP"),
    ]);
    expect(detectImageMimeFromMagicBytes(webp)).toBe("image/webp");
  });

  it("menolak konten bukan gambar", () => {
    expect(detectImageMimeFromMagicBytes(Buffer.from("hello world"))).toBeNull();
  });
});

describe("validateImageDataUrl", () => {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  it("menerima data-URL PNG yang sah", () => {
    const dataUrl = `data:image/png;base64,${pngSignature.toString("base64")}`;
    const result = validateImageDataUrl(dataUrl);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mimeType).toBe("image/png");
  });

  it("menolak data-URL yang menyamar sebagai PNG tetapi bukan gambar", () => {
    const fake = Buffer.from("bukan gambar asli").toString("base64");
    const result = validateImageDataUrl(`data:image/png;base64,${fake}`);
    expect(result.ok).toBe(false);
  });

  it("menolak payload yang melebihi batas", () => {
    const big = Buffer.alloc(2048, 0x00);
    const dataUrl = `data:image/png;base64,${big.toString("base64")}`;
    const result = validateImageDataUrl(dataUrl, 1024);
    expect(result.ok).toBe(false);
  });

  it("menolak format data-URL yang tidak didukung", () => {
    expect(validateImageDataUrl("data:text/plain;base64,aGVsbG8=").ok).toBe(false);
  });
});
