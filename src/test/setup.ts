import '@testing-library/jest-dom/vitest';
import {cleanup, configure} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

// Full-suite runs execute in parallel workers; async assertions that finish
// inside the default 1000ms budget can still time out under CPU contention.
configure({asyncUtilTimeout: 5000});

// jsdom leaves window.scrollTo unimplemented; navigation resets the scroll
// offset to the top of every clicked page, so give it a no-op.
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});
