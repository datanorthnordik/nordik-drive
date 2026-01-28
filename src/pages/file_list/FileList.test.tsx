import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useFetch from "../../hooks/useFetch";
import { setSelectedFile } from "../../store/auth/fileSlice";

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({ __esModule: true, useNavigate: () => mockNavigate }),
  { virtual: true }
);

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockDispatch = jest.fn();
let mockSelectedFile: any = null;

jest.mock("react-redux", () => ({
  __esModule: true,
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector({ file: { selectedFile: mockSelectedFile } }),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => (loading ? <div data-testid="loader">loading</div> : null),
}));

jest.mock("../../components/models/PasswordModal", () => ({
  __esModule: true,
  default: ({ open, closePasswordModal }: any) =>
    open ? (
      <div data-testid="password-modal">
        <button onClick={() => closePasswordModal(true)}>ok</button>
        <button onClick={() => closePasswordModal(false)}>cancel</button>
      </div>
    ) : null,
}));

const FileList = require("./FileList").default;

const useFetchMock = useFetch as unknown as jest.Mock;

function mockUseFetchReturn(opts: { loading?: boolean; data?: any; fetchData?: jest.Mock }) {
  useFetchMock.mockReturnValue({
    loading: opts.loading ?? false,
    data: opts.data ?? null,
    fetchData: opts.fetchData ?? jest.fn(),
  });
}

describe("FileList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedFile = null;
    mockNavigate.mockClear();
  });

  test("calls fetchData on mount", async () => {
    const fetchData = jest.fn();
    mockUseFetchReturn({ fetchData, data: { files: [] } });

    render(<FileList />);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalled();
    });
  });

  test("renders public and confidential sections when files exist", async () => {
    mockUseFetchReturn({
      data: {
        files: [
          { filename: "PublicFile.pdf", version: "1", private: false, community_filter: false, id: 1 },
          { filename: "SecretFile.pdf", version: "1", private: true, community_filter: false, id: 2 },
        ],
      },
    });

    render(<FileList />);

    expect(await screen.findByText(/Community Records$/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Records \(Confidential\)/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /PublicFile\.pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /SecretFile\.pdf/i })).toBeInTheDocument();
  });

  test("clicking a PUBLIC file dispatches selection and navigates to /dataview", async () => {
    mockUseFetchReturn({
      data: {
        files: [{ filename: "PublicFile.pdf", version: "3", private: false, community_filter: true, id: 10 }],
      },
    });

    const user = userEvent.setup();
    render(<FileList />);

    await user.click(screen.getByRole("button", { name: /PublicFile\.pdf/i }));

    expect(mockDispatch).toHaveBeenCalledWith(
      setSelectedFile({
        selected: { filename: "PublicFile.pdf", id: 10, version: "3", community_filter: true },
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dataview");
    expect(screen.queryByTestId("password-modal")).not.toBeInTheDocument();
  });

  test("clicking a CONFIDENTIAL file opens password modal; ok navigates to /dataview", async () => {
    mockUseFetchReturn({
      data: {
        files: [{ filename: "SecretFile.pdf", version: "1", private: true, community_filter: false, id: 22 }],
      },
    });

    const user = userEvent.setup();
    render(<FileList />);

    await user.click(screen.getByRole("button", { name: /SecretFile\.pdf/i }));

    expect(screen.getByTestId("password-modal")).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith(
      setSelectedFile({
        selected: { filename: "SecretFile.pdf", id: 22, version: "1", community_filter: false },
      })
    );
    expect(mockNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /ok/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/dataview");
  });

  test("confidential cancel clears selection and closes modal", async () => {
    mockUseFetchReturn({
      data: {
        files: [{ filename: "SecretFile.pdf", version: "1", private: true, community_filter: false, id: 22 }],
      },
    });

    const user = userEvent.setup();
    render(<FileList />);

    await user.click(screen.getByRole("button", { name: /SecretFile\.pdf/i }));
    expect(screen.getByTestId("password-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockDispatch).toHaveBeenCalledWith(setSelectedFile({ selected: null }));
  });
});
