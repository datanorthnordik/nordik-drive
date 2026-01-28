import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("../../components/Links", () => ({
  __esModule: true,
  WebLink: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("../../constants/constants", () => ({
  __esModule: true,
  contact: {
    address: "123 Example Address",
    street: "Example Street",
    telephone: "+1 111-222-3333",
    email: "admin@example.com",
  },
}));

const ContactUs = require("./ContactUs").default;

describe("ContactUs", () => {
  const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

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

  test("renders main content", () => {
    render(<ContactUs />);

    expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /join here/i })).toHaveLength(2);

    expect(screen.getByText("123 Example Address")).toBeInTheDocument();
    expect(screen.getByText("Example Street")).toBeInTheDocument();
    expect(screen.getByText(/t:\s*\+1 111-222-3333/i)).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
  });

  test("clicking email opens mailto link", async () => {
    const user = userEvent.setup();
    render(<ContactUs />);

    await user.click(screen.getByText("admin@example.com"));
    expect(openSpy).toHaveBeenCalledWith("mailto:admin@example.com");
  });

  test("JOIN HERE (CSAA) opens correct link in new tab", async () => {
    const user = userEvent.setup();
    render(<ContactUs />);

    const joinButtons = screen.getAllByRole("button", { name: /join here/i });
    await user.click(joinButtons[0]);

    expect(openSpy).toHaveBeenCalledWith(
      "https://childrenofshingwauk.org/contact-us/",
      "_blank",
      "noopener,noreferrer"
    );
  });

  test("JOIN HERE (NORDIK) opens correct link in new tab", async () => {
    const user = userEvent.setup();
    render(<ContactUs />);

    const joinButtons = screen.getAllByRole("button", { name: /join here/i });
    await user.click(joinButtons[1]);

    expect(openSpy).toHaveBeenCalledWith(
      "https://forms.monday.com/forms/1b4f6c260a6c3f24010ae7e9d5414a5c?r=use1",
      "_blank",
      "noopener,noreferrer"
    );
  });

  test("renders external WebLink anchors", () => {
    render(<ContactUs />);

    const cssa = screen.getByRole("link", { name: /cssa\?/i });
    expect(cssa).toHaveAttribute("href", "https://childrenofshingwauk.org/");

    const nordik = screen.getByRole("link", { name: /nordik institute\?/i });
    expect(nordik).toHaveAttribute("href", "https://nordikinstitute.com/");
  });
});
