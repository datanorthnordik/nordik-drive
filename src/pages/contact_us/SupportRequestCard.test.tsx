import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import SupportRequestCard from "./SupportRequestCard";

const mockUseSelector = jest.fn();
const mockApiRequest = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => mockUseSelector(selector),
}));

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  apiRequest: (...args: any[]) => mockApiRequest(...args),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

describe("SupportRequestCard", () => {
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:preview"),
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSelector.mockImplementation((selector: any) =>
      selector({
        auth: {
          user: {
            firstname: "Athul",
            lastname: "Narayanan",
            email: "athul@example.com",
          },
        },
      })
    );
  });

  test("prefills the user details and renders support copy", () => {
    render(<SupportRequestCard />);

    expect(screen.getByText(/ask a question or report an issue/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toHaveValue("Athul Narayanan");
    expect(screen.getByLabelText(/email address/i)).toHaveValue("athul@example.com");
    expect(screen.getByRole("button", { name: /send request/i })).toBeInTheDocument();
  });

  test("rejects unsupported screenshot files", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<SupportRequestCard />);

    const invalidFile = new File(["pdf"], "notes.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/attach a screenshot/i), invalidFile);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /please attach a png, jpg, or webp screenshot/i
    );
    expect(screen.queryByText("notes.pdf")).not.toBeInTheDocument();
  });

  test("submits the request with screenshot metadata and resets the message fields", async () => {
    const user = userEvent.setup();
    mockApiRequest.mockResolvedValue({
      message: "Support request received successfully.",
    });

    render(<SupportRequestCard />);

    await user.type(screen.getByLabelText(/^subject$/i), "Search page shows a blank result");
    await user.type(
      screen.getByLabelText(/how can we help\?/i),
      "When I search by family name, the page loads but no rows are shown."
    );

    const screenshot = new File(["image"], "search-issue.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/attach a screenshot/i), screenshot);

    expect(await screen.findByText("search-issue.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /send request/i }));

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledTimes(1));

    const [url, method, body] = mockApiRequest.mock.calls[0];
    expect(url).toMatch(/support-requests$/);
    expect(method).toBe("POST");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("request_type")).toBe("question");
    expect((body as FormData).get("requester_name")).toBe("Athul Narayanan");
    expect((body as FormData).get("requester_email")).toBe("athul@example.com");
    expect((body as FormData).get("subject")).toBe("Search page shows a blank result");
    expect((body as FormData).get("message")).toBe(
      "When I search by family name, the page loads but no rows are shown."
    );

    const uploadedFile = (body as FormData).get("screenshot") as File;
    expect(uploadedFile).toBeInstanceOf(File);
    expect(uploadedFile.name).toBe("search-issue.png");

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith("Support request received successfully.")
    );

    expect(screen.getByLabelText(/^subject$/i)).toHaveValue("");
    expect(screen.getByLabelText(/how can we help\?/i)).toHaveValue("");
    expect(screen.queryByText("search-issue.png")).not.toBeInTheDocument();
    expect(
      screen.getByText(/support request received successfully\./i)
    ).toBeInTheDocument();
  });
});
