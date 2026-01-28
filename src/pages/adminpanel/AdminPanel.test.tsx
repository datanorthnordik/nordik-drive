import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import useFetch from "../../hooks/useFetch";

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: () => jest.fn(),
}));

jest.mock("../../store/auth/fileSlice", () => ({
  __esModule: true,
  setFiles: (payload: any) => ({ type: "setFiles", payload }),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../../components/FileUploader", () => ({
  __esModule: true,
  default: () => <div>uploader</div>,
}));

jest.mock("../../components/UploadedFiles", () => ({
  __esModule: true,
  default: () => <div>uploaded</div>,
}));

jest.mock("../../components/Wrappers", () => ({
  __esModule: true,
  AdminPanelWrapper: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../../constants/colors", () => ({
  __esModule: true,
  color_primary: "#A61D33",
  header_height: "5.5rem",
  header_mobile_height: "3.5rem",
}));

const AdminPanel = require("./AdminPanel").default;
const useFetchMock = useFetch as unknown as jest.Mock;

function mockUseFetchReturn(opts: { loading?: boolean; data?: any }) {
  useFetchMock.mockReturnValue({
    loading: opts.loading ?? false,
    data: opts.data ?? null,
    error: null,
    fetchData: jest.fn(),
  });
}

describe("AdminPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates top offset when resizing across mobile breakpoint", async () => {
    mockUseFetchReturn({ loading: false, data: null });

    Object.defineProperty(window, "innerWidth", { writable: true, value: 1200 });

    render(<AdminPanel />);

    const workspace = screen.getByTestId("admin-workspace");

    await waitFor(() => {
      expect(workspace).toHaveStyle({ top: "5.5rem" });
    });

    act(() => {
      (window as any).innerWidth = 700;
      window.dispatchEvent(new Event("resize"));
    });

    await waitFor(() => {
      expect(workspace).toHaveStyle({ top: "3.5rem" });
    });
  });
});
