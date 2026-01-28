require("@testing-library/jest-dom");
import "jest-styled-components";


const originalWarn = console.warn;
const originalError = console.error;

function shouldIgnoreMuiOutOfRange(msg) {
  return (
    msg.includes("MUI: You have provided an out-of-range value") &&
    msg.includes("for the select component")
  );
}

beforeAll(() => {
  jest.spyOn(console, "warn").mockImplementation((...args) => {
    const msg = String(args[0] ?? "");
    if (shouldIgnoreMuiOutOfRange(msg)) return;
    originalWarn(...args);
  });

  jest.spyOn(console, "error").mockImplementation((...args) => {
    const msg = String(args[0] ?? "");
    if (shouldIgnoreMuiOutOfRange(msg)) return;
    originalError(...args);
  });
});

afterAll(() => {
  console.warn.mockRestore?.();
  console.error.mockRestore?.();
});
