import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * Vitest Setup File
 * ------------------
 * Global test setup for all unit/integration tests.
 * Extends Vitest matchers with jest-dom assertions.
 */

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

