import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import TopControlsBar from "./TopControlBar";
import * as XLSX from "xlsx";
import { useDispatch } from "react-redux";
import { clearSelectedFile } from "../../store/auth/fileSlice";

jest.mock("../NIAChatTrigger", () => ({
  __esModule: true,
  default: ({ setOpen }: { setOpen: (v: boolean) => void }) => (
    <button onClick={() => setOpen(true)}>NIA Trigger</button>
  ),
}));

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
}));

jest.mock("../../store/auth/fileSlice", () => ({
  clearSelectedFile: jest.fn(),
}));

jest.mock("xlsx", () => ({
  utils: {
    json_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

type GridNode = { data?: any };

function createGridApi({
  allNodes = [{ data: { id: 1 } }, { data: { id: 2 } }],
  filteredNodes = allNodes,
}: {
  allNodes?: GridNode[];
  filteredNodes?: GridNode[];
} = {}) {
  const listeners: Record<string, () => void> = {};

  return {
    listeners,
    forEachNode: jest.fn((cb: (node: GridNode) => void) => {
      allNodes.forEach(cb);
    }),
    forEachNodeAfterFilterAndSort: jest.fn((cb: (node: GridNode) => void) => {
      filteredNodes.forEach(cb);
    }),
    addEventListener: jest.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    removeEventListener: jest.fn((event: string) => {
      delete listeners[event];
    }),
  };
}

describe("TopControlsBar", () => {
  const mockDispatch = jest.fn();

  const mockedUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
  const mockedClearSelectedFile =
    clearSelectedFile as jest.MockedFunction<typeof clearSelectedFile>;
  const mockedJsonToSheet =
    XLSX.utils.json_to_sheet as jest.MockedFunction<typeof XLSX.utils.json_to_sheet>;
  const mockedBookNew =
    XLSX.utils.book_new as jest.MockedFunction<typeof XLSX.utils.book_new>;

  const defaultProps = (
    overrides: Partial<React.ComponentProps<typeof TopControlsBar>> = {}
  ): React.ComponentProps<typeof TopControlsBar> => ({
    isMobile: false,
    gridApi: createGridApi(),
    searchText: "",
    setSearchText: jest.fn(),
    matchesCount: 3,
    currentMatchIndex: 0,
    onNavigateMatch: jest.fn(),
    isRecording: false,
    setIsRecording: jest.fn(),
    recognitionRef: { current: null },
    onSearch: jest.fn(),
    fontSize: 16,
    onZoomChange: jest.fn(),
    setNiaOpen: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseDispatch.mockReturnValue(mockDispatch);

    mockedClearSelectedFile.mockReturnValue({
      type: "file/clearSelectedFile",
    } as ReturnType<typeof clearSelectedFile>);

    mockedJsonToSheet.mockReturnValue({
      mocked: "worksheet",
    } as any);

    mockedBookNew.mockReturnValue({
      mocked: "workbook",
    } as any);
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it("renders main controls and computes results + total records text", () => {
    const gridApi = createGridApi({
      allNodes: [{ data: { id: 1 } }, { data: null }, { data: { id: 2 } }],
    });

    render(<TopControlsBar {...defaultProps({ gridApi })} />);

    expect(screen.getByRole("button", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search records...")).toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
    expect(screen.getByText("TOTAL: 2 RECORDS")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ZOOM IN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ZOOM OUT" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();

    expect(gridApi.addEventListener).toHaveBeenCalledWith(
      "modelUpdated",
      expect.any(Function)
    );
    expect(gridApi.addEventListener).toHaveBeenCalledWith(
      "rowDataUpdated",
      expect.any(Function)
    );
  });

  it("removes grid listeners on unmount", () => {
    const gridApi = createGridApi();
    const { unmount } = render(<TopControlsBar {...defaultProps({ gridApi })} />);

    unmount();

    expect(gridApi.removeEventListener).toHaveBeenCalledWith(
      "modelUpdated",
      expect.any(Function)
    );
    expect(gridApi.removeEventListener).toHaveBeenCalledWith(
      "rowDataUpdated",
      expect.any(Function)
    );
  });

  it("clicking Files dispatches clearSelectedFile and goes back in history", () => {
    const backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});

    render(<TopControlsBar {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Files" }));

    const action = mockedClearSelectedFile.mock.results[0]?.value;

    expect(mockedClearSelectedFile).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(action);
    expect(backSpy).toHaveBeenCalledTimes(1);

    backSpy.mockRestore();
  });

  it("updates search text, searches on Enter, and searches on search button click", () => {
    const setSearchText = jest.fn();
    const onSearch = jest.fn();

    render(
      <TopControlsBar
        {...defaultProps({
          searchText: "old",
          setSearchText,
          onSearch,
        })}
      />
    );

    const input = screen.getByPlaceholderText("Search records...");

    fireEvent.change(input, { target: { value: "heart" } });
    expect(setSearchText).toHaveBeenCalledWith("heart");

    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(onSearch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalledTimes(2);
  });

  it("disables result navigation when there are no matches", () => {
    render(<TopControlsBar {...defaultProps({ matchesCount: 0 })} />);

    const navButton = screen.getByRole("button", { name: "Result navigation" });
    expect(navButton).toBeDisabled();
    expect(screen.getByText("0 results")).toBeInTheDocument();
  });

  it("navigates to previous on upper-half click and next on lower-half click", () => {
    const onNavigateMatch = jest.fn();

    render(<TopControlsBar {...defaultProps({ onNavigateMatch })} />);

    const navButton = screen.getByRole("button", { name: "Result navigation" });

    jest.spyOn(navButton, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 10,
      left: 0,
      right: 46,
      bottom: 56,
      width: 46,
      height: 46,
      toJSON: () => {},
    } as DOMRect);

    fireEvent.click(navButton, { clientY: 15 });
    expect(onNavigateMatch).toHaveBeenCalledWith("prev");

    fireEvent.click(navButton, { clientY: 50 });
    expect(onNavigateMatch).toHaveBeenCalledWith("next");
  });

  it("opens NIA from the compact indicator by click and keyboard", () => {
    const setNiaOpen = jest.fn();

    render(<TopControlsBar {...defaultProps({ setNiaOpen })} />);

    const niaIndicator = screen.getByRole("button", { name: "Talk to NIA" });

    fireEvent.click(niaIndicator);
    expect(setNiaOpen).toHaveBeenCalledWith(true);

    fireEvent.keyDown(niaIndicator, { key: "Enter", code: "Enter" });
    expect(setNiaOpen).toHaveBeenCalledWith(true);

    fireEvent.keyDown(niaIndicator, { key: " ", code: "Space" });
    expect(setNiaOpen).toHaveBeenCalledWith(true);
  });

  it("zooms in and out with bounds applied", () => {
    const onZoomChange = jest.fn();

    const { rerender } = render(
      <TopControlsBar {...defaultProps({ fontSize: 16, onZoomChange })} />
    );

    fireEvent.click(screen.getByRole("button", { name: "ZOOM IN" }));
    expect(onZoomChange).toHaveBeenCalledWith(18);

    fireEvent.click(screen.getByRole("button", { name: "ZOOM OUT" }));
    expect(onZoomChange).toHaveBeenCalledWith(14);

    rerender(<TopControlsBar {...defaultProps({ fontSize: 28, onZoomChange })} />);
    fireEvent.click(screen.getByRole("button", { name: "ZOOM IN" }));
    expect(onZoomChange).toHaveBeenCalledWith(28);

    rerender(<TopControlsBar {...defaultProps({ fontSize: 12, onZoomChange })} />);
    fireEvent.click(screen.getByRole("button", { name: "ZOOM OUT" }));
    expect(onZoomChange).toHaveBeenCalledWith(12);
  });

  it("downloads filtered data when filtered rows differ from total rows", async () => {
    const gridApi = createGridApi({
      allNodes: [{ data: { id: 1 } }, { data: { id: 2 } }, { data: { id: 3 } }],
      filteredNodes: [{ data: { id: 2 } }],
    });

    render(<TopControlsBar {...defaultProps({ gridApi })} />);

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(mockedJsonToSheet).toHaveBeenCalledWith([{ id: 2 }]);
    });

    const worksheet = mockedJsonToSheet.mock.results[0]?.value;
    const workbook = mockedBookNew.mock.results[0]?.value;

    expect(mockedBookNew).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(workbook, worksheet, "Data");
    expect(XLSX.writeFile).toHaveBeenCalledWith(workbook, "filtered_data.xlsx");
  });

  it("downloads all data when no filter is applied", async () => {
    const nodes = [{ data: { id: 1 } }, { data: { id: 2 } }];
    const gridApi = createGridApi({
      allNodes: nodes,
      filteredNodes: nodes,
    });

    render(<TopControlsBar {...defaultProps({ gridApi })} />);

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(mockedJsonToSheet).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
    });

    const workbook = mockedBookNew.mock.results[0]?.value;

    expect(XLSX.writeFile).toHaveBeenCalledWith(workbook, "all_data.xlsx");
  });

  it("does nothing on download when gridApi is missing", () => {
    render(<TopControlsBar {...defaultProps({ gridApi: null })} />);

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(mockedJsonToSheet).not.toHaveBeenCalled();
    expect(mockedBookNew).not.toHaveBeenCalled();
    expect(XLSX.writeFile).not.toHaveBeenCalled();
  });

  it("shows total records as 0 when gridApi is missing", () => {
    render(<TopControlsBar {...defaultProps({ gridApi: null })} />);

    expect(screen.getByText("TOTAL: 0 RECORDS")).toBeInTheDocument();
  });

  it("shows alert when speech recognition is not supported", () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    render(<TopControlsBar {...defaultProps()} />);

    fireEvent.click(screen.getByRole("button", { name: "Start voice search" }));

    expect(alertSpy).toHaveBeenCalledWith("Speech recognition not supported.");
    alertSpy.mockRestore();
  });

  it("starts voice recognition, updates search from transcript, and stops on end", () => {
    const setSearchText = jest.fn();
    const onSearch = jest.fn();
    const setIsRecording = jest.fn();
    const recognitionRef = { current: null as any };

    let recognitionInstance: any;

    class MockSpeechRecognition {
      lang = "";
      interimResults = false;
      maxAlternatives = 0;
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = jest.fn();

      constructor() {
        recognitionInstance = this;
      }
    }

    (window as any).SpeechRecognition = MockSpeechRecognition;

    render(
      <TopControlsBar
        {...defaultProps({
          setSearchText,
          onSearch,
          setIsRecording,
          recognitionRef,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start voice search" }));

    expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
    expect(setIsRecording).toHaveBeenCalledWith(true);
    expect(recognitionRef.current).toBe(recognitionInstance);

    recognitionInstance.onresult?.({
      results: [[{ transcript: "survivor records" }]],
    });

    expect(setSearchText).toHaveBeenCalledWith("survivor records");
    expect(onSearch).toHaveBeenCalledWith("survivor records");

    recognitionInstance.onend?.();
    expect(setIsRecording).toHaveBeenCalledWith(false);
  });

  it("prefers webkitSpeechRecognition when SpeechRecognition is unavailable", () => {
    const setIsRecording = jest.fn();
    const recognitionRef = { current: null as any };

    let recognitionInstance: any;

    class MockWebkitSpeechRecognition {
      lang = "";
      interimResults = false;
      maxAlternatives = 0;
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = jest.fn();

      constructor() {
        recognitionInstance = this;
      }
    }

    (window as any).webkitSpeechRecognition = MockWebkitSpeechRecognition;

    render(
      <TopControlsBar
        {...defaultProps({
          setIsRecording,
          recognitionRef,
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Start voice search" }));

    expect(recognitionInstance.start).toHaveBeenCalledTimes(1);
    expect(setIsRecording).toHaveBeenCalledWith(true);
    expect(recognitionRef.current).toBe(recognitionInstance);
  });

  it("stops active voice recognition when stop button is clicked", () => {
    const stop = jest.fn();
    const setIsRecording = jest.fn();

    render(
      <TopControlsBar
        {...defaultProps({
          isRecording: true,
          setIsRecording,
          recognitionRef: { current: { stop } },
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Stop voice search" }));

    expect(stop).toHaveBeenCalledTimes(1);
    expect(setIsRecording).toHaveBeenCalledWith(false);
  });

  it("recomputes total records when grid events fire", () => {
    const gridApi = createGridApi({
      allNodes: [{ data: { id: 1 } }],
    });

    render(<TopControlsBar {...defaultProps({ gridApi })} />);

    expect(screen.getByText("TOTAL: 1 RECORDS")).toBeInTheDocument();

    gridApi.forEachNode.mockImplementation((cb: (node: GridNode) => void) => {
      [{ data: { id: 1 } }, { data: { id: 2 } }].forEach(cb);
    });

    act(() => {
      gridApi.listeners.modelUpdated?.();
    });

    expect(screen.getByText("TOTAL: 2 RECORDS")).toBeInTheDocument();
  });
});
