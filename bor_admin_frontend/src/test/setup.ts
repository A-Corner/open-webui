// Import Jest DOM matchers for expect extensions like .toBeInTheDocument()
import '@testing-library/jest-dom';

// MSW (Mock Service Worker) setup - Optional, but good for full API mocking.
// If you're using MSW, uncomment and set up your handlers and server.
// import { server } from './mocks/server'; // Adjust path to your MSW server setup

// Establish API mocking before all tests.
// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
// afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
// afterAll(() => server.close());


// --- Global Mocks / Setup ---

// Mock localStorage (Vitest/jsdom doesn't always provide a fully functional one)
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock IntersectionObserver (often used by UI libraries for effects like infinite scroll, lazy load)
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock window.matchMedia (used by Ant Design and other UI libraries for responsive design)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.electronAPI (if your components try to access it)
Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {
    send: vi.fn(),
    receive: vi.fn(),
    // Add other methods your app uses if any
  }
});

// Mock BroadcastChannel
const mockBroadcastChannel = vi.fn(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
  onmessage: null,
  onmessageerror: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
Object.defineProperty(window, 'BroadcastChannel', { value: mockBroadcastChannel });


// Clean up DOM after each test
import { cleanup } from '@testing-library/react';
afterEach(() => {
  cleanup();
});

// If using Ant Design, you might need to mock createRange as jsdom doesn't implement it fully
if (typeof document.createRange === 'undefined') {
  document.createRange = () => {
    const range = new Range();
    range.getBoundingClientRect = vi.fn();
    range.getClientRects = () => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: vi.fn(),
    });
    return range;
  };
}

console.log('Vitest setup file loaded.');
