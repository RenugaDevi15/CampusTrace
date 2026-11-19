import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Provide scrollTo stub for jsdom
if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}
