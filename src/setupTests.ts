// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import "@testing-library/jest-dom";

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

