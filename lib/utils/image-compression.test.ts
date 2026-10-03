import { describe, it, expect } from 'vitest';
import { formatBytes, dataUrlToBlob } from './image-compression';

describe('formatBytes', () => {
  it('memformat 0 byte', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('memformat kilobyte dengan presisi default', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('memformat megabyte', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(4.8 * 1024 * 1024)).toBe('4.8 MB');
  });
});

describe('dataUrlToBlob', () => {
  it('mengonversi data URL base64 ke Blob', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const blob = dataUrlToBlob(dataUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });
});
