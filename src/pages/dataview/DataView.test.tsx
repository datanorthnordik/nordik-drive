import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

let mockSelectedFile: any = null;
let mockData: any = null;
let mockLoading = false;
let mockError: any = null;

const mockFetchData = jest.fn();

jest.mock("../../hooks/useFetch", () => ({
  __esModule: true,
  default: () => ({
    loading: mockLoading,
    error: mockError,
    fetchData: mockFetchData,
    data: mockData,
  }),
}));

jest.mock("react-redux", () => ({
  __esModule: true,
  useSelector: (selector: any) => selector({ file: { selectedFile: mockSelectedFile } }),
}));

jest.mock("../../components/Loader", () => ({
  __esModule: true,
  default: ({ loading }: any) => <div data-testid="loader">{loading ? "loading" : "idle"}</div>,
}));

jest.mock("../../components/datatable/DataTable", () => ({
  __esModule: true,
  default: ({ rowData }: any) => <div data-testid="grid">{JSON.stringify(rowData)}</div>,
}));

const Page = require("./DataView").default;

describe("DataView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedFile = null;
    mockData = null;
    mockLoading = false;
    mockError = null;
  });

  test("does not call fetchData when no selectedFile; passes empty rowData to grid", async () => {
    render(<Page />);

    expect(mockFetchData).not.toHaveBeenCalled();
    expect(await screen.findByTestId("grid")).toHaveTextContent("[]");
  });

  test("calls fetchData when selectedFile exists with filename + version", async () => {
    mockSelectedFile = { filename: "abc.xlsx", version: "2" };

    render(<Page />);

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledWith(null, { filename: "abc.xlsx", version: "2" });
    });
  });

  test("maps api data to rowData by spreading row_data and injecting id, then passes to DataGrid", async () => {
    mockData = [
      { id: 10, row_data: { name: "A", age: 1 } },
      { id: 11, row_data: { name: "B", age: 2 } },
    ];

    render(<Page />);

    const expected = [
      { name: "A", age: 1, id: 10 },
      { name: "B", age: 2, id: 11 },
    ];

    expect(await screen.findByTestId("grid")).toHaveTextContent(JSON.stringify(expected));
  });
});
