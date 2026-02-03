import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import FileUploader from "./FileUploader";
import useFetch from "../hooks/useFetch";
import toast from "react-hot-toast";

// -------- mocks --------
const mockUseFetch = jest.fn();

jest.mock("../hooks/useFetch", () => ({
    __esModule: true,
    default: (...args: any[]) => mockUseFetch(...args),
}));

jest.mock("./Loader", () => ({
    __esModule: true,
    default: ({ loading }: { loading: boolean }) => (
        <div data-testid="loader">{loading ? "loading" : "not-loading"}</div>
    ),
}));

jest.mock("react-hot-toast", () => ({
    __esModule: true,
    default: { success: jest.fn(), error: jest.fn() },
    success: jest.fn(),
    error: jest.fn(),
}));

// A lightweight FormData mock that lets us inspect appended fields
class MockFormData {
    public entries: Array<{ key: string; value: any }> = [];
    append(key: string, value: any) {
        this.entries.push({ key, value });
    }
}
const originalFormData = global.FormData;

beforeEach(() => {
    jest.clearAllMocks();

    // Safe default return for useFetch (prevents destructuring issues)
    mockUseFetch.mockReturnValue({
        loading: false,
        error: null,
        data: null,
        fetchData: jest.fn(),
    });

    // Patch global FormData for assertions
    global.FormData = MockFormData as any;
});

afterEach(() => {
    // restore FormData
    global.FormData = originalFormData;
});

describe("FileUploader", () => {
    test("renders initial UI and shows 'No files selected'", () => {
        const setNewFile = jest.fn();
        render(<FileUploader setNewFile={setNewFile} />);

        expect(screen.getByText("Document Upload")).toBeInTheDocument();
        expect(screen.getByText("Selected Files")).toBeInTheDocument();
        expect(screen.getByText("No files selected")).toBeInTheDocument();
        expect(screen.getByTestId("loader")).toHaveTextContent("not-loading");
    });

    test("clicking 'Select Files from Device' triggers inputRef.click (backup picker)", () => {
        const setNewFile = jest.fn();
        const { container } = render(<FileUploader setNewFile={setNewFile} />);

        // Grab hidden input by id used in component
        const input = container.querySelector("#archival-file-input") as HTMLInputElement;
        expect(input).toBeTruthy();

        const clickSpy = jest.spyOn(input, "click");

        fireEvent.click(screen.getByRole("button", { name: "Select Files from Device" }));
        expect(clickSpy).toHaveBeenCalled();
    });

    test("selecting files shows preview items and upload button", async () => {
        const setNewFile = jest.fn();
        const { container } = render(<FileUploader setNewFile={setNewFile} />);

        const input = container.querySelector("#archival-file-input") as HTMLInputElement;

        const file1 = new File(["a"], "a.csv", { type: "text/csv" });
        const file2 = new File(["b"], "b.xlsx", {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file1, file2] } });
        });

        // Now the right panel should show the submit button
        expect(screen.getByRole("button", { name: "Upload Files" })).toBeInTheDocument();

        // Two "File name" fields (one per file)
        const nameFields = screen.getAllByLabelText("File name");
        expect(nameFields).toHaveLength(2);

        // Two remove buttons (×)
        const removeButtons = screen.getAllByRole("button", { name: "×" });
        expect(removeButtons).toHaveLength(2);
    });

    test("removing a file updates the list", async () => {
        const setNewFile = jest.fn();
        const { container } = render(<FileUploader setNewFile={setNewFile} />);

        const input = container.querySelector("#archival-file-input") as HTMLInputElement;

        const file1 = new File(["a"], "a.csv", { type: "text/csv" });
        const file2 = new File(["b"], "b.csv", { type: "text/csv" });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file1, file2] } });
        });

        expect(screen.getAllByLabelText("File name")).toHaveLength(2);

        // Remove first file
        const removeButtons = screen.getAllByRole("button", { name: "×" });
        await act(async () => {
            fireEvent.click(removeButtons[0]);
        });

        expect(screen.getAllByLabelText("File name")).toHaveLength(1);
    });

    test("submitting with empty file name shows validation error", async () => {
        const setNewFile = jest.fn();
        const fetchData = jest.fn();

        mockUseFetch.mockReturnValue({
            loading: false,
            error: null,
            data: null,
            fetchData,
        });

        const { container } = render(<FileUploader setNewFile={setNewFile} />);

        const input = container.querySelector("#archival-file-input") as HTMLInputElement;
        const file1 = new File(["a"], "a.csv", { type: "text/csv" });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file1] } });
        });

        // submit without filling "File name"
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Upload Files" }));
        });

        expect(await screen.findByText("File name is required")).toBeInTheDocument();

        // fetchData should not be called
        expect(fetchData).not.toHaveBeenCalled();
    });

    test("submitting with valid data calls fetchData with FormData including files + fields", async () => {
        const setNewFile = jest.fn();
        const fetchData = jest.fn();

        mockUseFetch.mockReturnValue({
            loading: false,
            error: null,
            data: null,
            fetchData,
        });

        const { container } = render(<FileUploader setNewFile={setNewFile} />);

        const input = container.querySelector("#archival-file-input") as HTMLInputElement;
        const file1 = new File(["a"], "a.csv", { type: "text/csv" });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file1] } });
        });

        // Fill filename
        const nameField = screen.getByLabelText("File name");
        await act(async () => {
            fireEvent.change(nameField, { target: { value: "My Display Name" } });
        });

        // Toggle both checkboxes
        fireEvent.click(screen.getByLabelText("Mark as Confidential"));
        fireEvent.click(screen.getByLabelText("Enable Community Filter"));

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Upload Files" }));
        });

        expect(fetchData).toHaveBeenCalledTimes(1);

        const formDataArg = fetchData.mock.calls[0][0] as MockFormData;
        expect(formDataArg).toBeInstanceOf(MockFormData);

        // Assert FormData append calls
        const entries = formDataArg.entries;

        // file appended
        expect(entries.some((e) => e.key === "files" && e.value === file1)).toBe(true);

        // filenames appended
        expect(entries.some((e) => e.key === "filenames" && e.value === "My Display Name")).toBe(true);

        // private + community_filter appended as strings
        expect(entries.some((e) => e.key === "private" && e.value === "true")).toBe(true);
        expect(entries.some((e) => e.key === "community_filter" && e.value === "true")).toBe(true);
    });

    test("when data arrives, shows success toast, calls setNewFile with newfile*, and clears selected files", async () => {
        const setNewFile = jest.fn();
        const fetchData = jest.fn();

        // Mutable data simulation
        let current = { loading: false, error: null as any, data: null as any };

        mockUseFetch.mockImplementation(() => ({
            loading: current.loading,
            error: current.error,
            data: current.data,
            fetchData,
        }));

        const { container, rerender } = render(<FileUploader setNewFile={setNewFile} />);

        // select one file to ensure clearing happens
        const input = container.querySelector("#archival-file-input") as HTMLInputElement;
        const file1 = new File(["a"], "a.csv", { type: "text/csv" });

        await act(async () => {
            fireEvent.change(input, { target: { files: [file1] } });
        });

        expect(screen.getAllByLabelText("File name")).toHaveLength(1);

        // simulate server response data
        current = { ...current, data: { message: "Uploaded!" } };

        await act(async () => {
            rerender(<FileUploader setNewFile={setNewFile} />);
        });

        // toast called
        expect((toast as any).success).toHaveBeenCalledWith("Uploaded!");

        // setNewFile called with "newfile<number>"
        expect(setNewFile).toHaveBeenCalled();
        const arg = setNewFile.mock.calls[0][0] as string;
        expect(arg.startsWith("newfile")).toBe(true);

        // files cleared => No files selected visible again
        expect(screen.getByText("No files selected")).toBeInTheDocument();
    });

    test("when error exists, shows error toast", async () => {
        const setNewFile = jest.fn();
        const fetchData = jest.fn();

        let current = { loading: false, error: null as any, data: null as any };
        mockUseFetch.mockImplementation(() => ({
            loading: current.loading,
            error: current.error,
            data: current.data,
            fetchData,
        }));

        const { rerender } = render(<FileUploader setNewFile={setNewFile} />);

        current = { ...current, error: "Upload failed" };

        await act(async () => {
            rerender(<FileUploader setNewFile={setNewFile} />);
        });

        expect((toast as any).error).toHaveBeenCalledWith("Upload failed");
    });

    test("passes loading state into Loader", () => {
        const setNewFile = jest.fn();

        mockUseFetch.mockReturnValue({
            loading: true,
            error: null,
            data: null,
            fetchData: jest.fn(),
        });

        render(<FileUploader setNewFile={setNewFile} />);
        expect(screen.getByTestId("loader")).toHaveTextContent("loading");
    });
});
