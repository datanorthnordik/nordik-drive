// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const originalWarn = console.warn;
const originalError = console.error;

function shouldIgnoreMuiOutOfRange(msg: string) {
  return (
    msg.includes("MUI: You have provided an out-of-range value") &&
    msg.includes("for the select component")
  );
}

beforeAll(() => {
  jest.spyOn(console, "warn").mockImplementation((...args: any[]) => {
    const msg = String(args[0] ?? "");
    if (shouldIgnoreMuiOutOfRange(msg)) return;
    originalWarn(...args);
  });

  // Some environments send this MUI warning through console.error
  jest.spyOn(console, "error").mockImplementation((...args: any[]) => {
    const msg = String(args[0] ?? "");
    if (shouldIgnoreMuiOutOfRange(msg)) return;
    originalError(...args);
  });
});

afterAll(() => {
  (console.warn as unknown as jest.Mock).mockRestore?.();
  (console.error as unknown as jest.Mock).mockRestore?.();
});


// ✅ Prevent CRA/Jest from trying to parse axios ESM in node_modules
jest.mock("axios", () => {
  const mockAxiosInstance = {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return {
    __esModule: true,
    default: {
      ...mockAxiosInstance,
      create: jest.fn(() => mockAxiosInstance),
    },
  };
});

