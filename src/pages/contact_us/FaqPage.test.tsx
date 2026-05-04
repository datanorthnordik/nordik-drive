import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}), { virtual: true });

const FaqPage = require("./FaqPage").default;

describe("FaqPage", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders faq content and the first expanded answer", () => {
    render(<FaqPage />);

    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /which browser should i use for the best experience\?/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/for the best experience, we recommend using google chrome/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/still need help\?/i)).toBeInTheDocument();
  });

  test("opens another faq answer when a different question is selected", async () => {
    const user = userEvent.setup();
    render(<FaqPage />);

    await user.click(
      screen.getByRole("button", {
        name: /the website is not loading properly\. what should i do\?/i,
      })
    );

    expect(
      screen.getByText(/try refreshing the page, closing and reopening your browser/i)
    ).toBeInTheDocument();
  });

  test("navigates back to contact us from both page actions", async () => {
    const user = userEvent.setup();
    render(<FaqPage />);

    await user.click(screen.getByRole("button", { name: /back to contact us/i }));
    await user.click(screen.getByRole("button", { name: /go to contact us/i }));

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "/contact-us");
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "/contact-us");
  });
});
