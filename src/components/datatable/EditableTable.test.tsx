// EditableTable.test.tsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useDispatch, useSelector } from "react-redux";

import { EditableTable } from "./EditableTable";
import { startEditing } from "../../store/slices/editSlice";
import useFetch from "../../hooks/useFetch";

let latestAgGridProps: any;
let mockGridApi: any;
let mockState: any;

jest.mock("lucide-react", () => ({
    SearchIcon: () => <span data-testid="search-icon">search</span>,
    ArrowLeft: () => <span data-testid="arrow-left">back</span>,
}));

jest.mock("ag-grid-react", () => ({
    AgGridReact: (props: any) => {
        latestAgGridProps = props;

        return (
            <div data-testid="ag-grid-react">
                <div>Mock AG Grid</div>

                <button onClick={() => props.onGridReady?.({ api: mockGridApi })}>
                    Fire Grid Ready
                </button>

                <button onClick={() => props.onFirstDataRendered?.({ api: mockGridApi })}>
                    Fire First Data Rendered
                </button>

                <button
                    onClick={() =>
                        props.onCellValueChanged?.({
                            data: {
                                id: 42,
                                "First Names": "John",
                                "Last Names": "Doe",
                            },
                            colDef: { field: "Parents Names" },
                            oldValue: "",
                            newValue: "New Parent",
                        })
                    }
                >
                    Fire Cell Value Changed
                </button>

                <button
                    onClick={() =>
                        props.onCellValueChanged?.({
                            data: {
                                id: 42,
                                "First Names": "John",
                                "Last Names": "Doe",
                            },
                            colDef: { field: "Parents Names" },
                            oldValue: "",
                            newValue: "Another Parent",
                        })
                    }
                >
                    Fire Duplicate Cell Change
                </button>
            </div>
        );
    },
}));

jest.mock("react-redux", () => ({
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));

jest.mock("../../store/slices/editSlice", () => ({
    startEditing: jest.fn(),
}));

jest.mock("../CommunityFilter/CommunityFilter", () => ({
    __esModule: true,
    default: ({ onClose }: { onClose: () => void }) => (
        <div data-testid="community-filter">
            <div>Mock Community Filter</div>
            <button onClick={onClose}>Close Community Filter</button>
        </div>
    ),
}));

jest.mock("../../hooks/useFetch", () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe("EditableTable", () => {
    const mockDispatch = jest.fn();
    const mockFetchData = jest.fn();

    const mockedUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
    const mockedUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
    const mockedStartEditing =
        startEditing as unknown as jest.MockedFunction<typeof startEditing>;
    const mockedUseFetch = useFetch as jest.MockedFunction<typeof useFetch>;

    const sampleData = [
        {
            id: 42,
            "First Names": "John",
            "Last Names": "Doe",
            "First Nation/Community": "Batchewana",
            "Parents Names": "",
            lat: 46.5,
        },
        {
            id: 43,
            "First Names": "Jane",
            "Last Names": "Smith",
            "First Nation/Community": "Garden River",
            "Parents Names": "Existing Value",
            latitude: 46.6,
        },
    ];

    const renderComponent = (overrides?: Partial<React.ComponentProps<typeof EditableTable>>) => {
        const props: React.ComponentProps<typeof EditableTable> = {
            data: sampleData,
            onClose: jest.fn(),
            ...overrides,
        };

        return {
            ...render(<EditableTable {...props} />),
            props,
        };
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockGridApi = {
            setGridOption: jest.fn(),
            setQuickFilter: jest.fn(),
            refreshCells: jest.fn(),
            resetRowHeights: jest.fn(),
            sizeColumnsToFit: jest.fn(),
            startEditingCell: jest.fn(),
            stopEditing: jest.fn(),
        };

        latestAgGridProps = undefined;

        mockState = {
            file: {
                selectedCommunities: [],
                selectedFile: {
                    id: 99,
                    filename: "survivors.xlsx",
                },
            },
        };

        mockedUseDispatch.mockReturnValue(mockDispatch);

        mockedUseSelector.mockImplementation((selector: any) => selector(mockState));

        mockedStartEditing.mockReturnValue({
            type: "edit/startEditing",
        } as any);

        mockedUseFetch.mockReturnValue({
            data: null,
            loading: false,
            error: null,
            fetchData: mockFetchData,
        } as any);

        jest.spyOn(console, "log").mockImplementation(() => { });
    });

    afterEach(() => {
        (console.log as jest.Mock).mockRestore?.();
    });

    it("renders header controls, grid, and disables Save Changes initially", () => {
        renderComponent();

        expect(
            screen.getByRole("button", { name: /back to table/i })
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /show filter/i })
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /zoom in/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();

        expect(screen.getByTestId("ag-grid-react")).toBeInTheDocument();
    });

    it("builds grid columnDefs correctly and excludes blocked fields", () => {
        renderComponent();

        const fields = latestAgGridProps.columnDefs.map((c: any) => c.field);

        expect(fields).toContain("First Names");
        expect(fields).toContain("Last Names");
        expect(fields).toContain("First Nation/Community");
        expect(fields).toContain("Parents Names");

        expect(fields).not.toContain("id");
        expect(fields).not.toContain("lat");
        expect(fields).not.toContain("latitude");

        const parentsCol = latestAgGridProps.columnDefs.find(
            (c: any) => c.field === "Parents Names"
        );

        expect(parentsCol).toBeTruthy();
        expect(parentsCol.editable({ value: "" })).toBe(true);
        expect(parentsCol.editable({ value: "Existing Value" })).toBe(false);
        expect(parentsCol.editable({ value: 0 })).toBe(false);

        expect(
            parentsCol.suppressKeyboardEvent({
                event: { key: "Backspace" },
                value: "Existing Value",
            })
        ).toBe(true);

        expect(
            parentsCol.suppressKeyboardEvent({
                event: { key: "Delete" },
                value: "",
            })
        ).toBe(false);
    });

    it("calls onClose when Back to Table is clicked", () => {
        const { props } = renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /back to table/i }));

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("toggles the community filter open and closed", () => {
        renderComponent();

        expect(screen.queryByTestId("community-filter")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /show filter/i }));
        expect(screen.getByTestId("community-filter")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /hide filter/i })
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /close community filter/i }));
        expect(screen.queryByTestId("community-filter")).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /show filter/i })
        ).toBeInTheDocument();
    });

    it("sets gridApi on grid ready, sizes columns, updates quick filter text, and searches", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire grid ready/i }));

        expect(mockGridApi.sizeColumnsToFit).toHaveBeenCalledTimes(1);

        fireEvent.change(screen.getByPlaceholderText("Search..."), {
            target: { value: "John" },
        });

        expect(mockGridApi.setGridOption).toHaveBeenCalledWith(
            "quickFilterText",
            "John"
        );

        const searchButton = screen.getByTestId("search-icon").closest("button");
        expect(searchButton).toBeTruthy();

        fireEvent.click(searchButton!);

        expect(mockGridApi.setQuickFilter).toHaveBeenCalledWith("John");
    });

    it("calls sizeColumnsToFit on first data rendered", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire first data rendered/i }));

        expect(mockGridApi.sizeColumnsToFit).toHaveBeenCalledTimes(1);
    });

    it("zooms in and out and refreshes the grid", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire grid ready/i }));

        fireEvent.click(screen.getByRole("button", { name: /zoom in/i }));
        expect(mockGridApi.refreshCells).toHaveBeenCalledWith({ force: true });
        expect(mockGridApi.resetRowHeights).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /zoom out/i }));
        expect(mockGridApi.refreshCells).toHaveBeenCalledTimes(2);
        expect(mockGridApi.resetRowHeights).toHaveBeenCalledTimes(2);
    });

    it("passes external filter callbacks that work case-insensitively", () => {
        mockState = {
            file: {
                selectedCommunities: ["batchewana", " rankin "],
                selectedFile: {
                    id: 99,
                    filename: "survivors.xlsx",
                },
            },
        };

        renderComponent();

        expect(latestAgGridProps.isExternalFilterPresent()).toBe(true);

        expect(
            latestAgGridProps.doesExternalFilterPass({
                data: { "First Nation/Community": "Batchewana" },
            })
        ).toBe(true);

        expect(
            latestAgGridProps.doesExternalFilterPass({
                data: { "First Nation/Community": "RANKIN" },
            })
        ).toBe(true);

        expect(
            latestAgGridProps.doesExternalFilterPass({
                data: { "First Nation/Community": "Garden River" },
            })
        ).toBe(false);
    });

    it("starts editing only for empty cells and blocks edit keys for non-empty cells", () => {
        renderComponent();

        latestAgGridProps.onCellClicked({
            colDef: { field: "Parents Names" },
            data: { "Parents Names": "" },
            value: "",
            api: mockGridApi,
            rowIndex: 0,
            column: { getId: () => "Parents Names" },
        });

        expect(mockGridApi.startEditingCell).toHaveBeenCalledWith({
            rowIndex: 0,
            colKey: "Parents Names",
        });

        latestAgGridProps.onCellClicked({
            colDef: { field: "Parents Names" },
            data: { "Parents Names": "Already filled" },
            value: "Already filled",
            api: mockGridApi,
            rowIndex: 1,
            column: { getId: () => "Parents Names" },
        });

        expect(mockGridApi.stopEditing).toHaveBeenCalledWith(true);

        const preventDefault = jest.fn();

        latestAgGridProps.onCellKeyDown({
            event: { key: "Delete", preventDefault },
            colDef: { field: "Parents Names" },
            data: { "Parents Names": "Already filled" },
            value: "Already filled",
            api: mockGridApi,
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(mockGridApi.stopEditing).toHaveBeenCalledWith(true);
    });

    it("records an edit, opens confirm dialog, dispatches, converts payload, and sends request", () => {
        const { props } = renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire cell value changed/i }));

        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).not.toBeDisabled();

        fireEvent.click(saveButton);

        expect(screen.getByText(/please review your changes:/i)).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Parents Names:")).toBeInTheDocument();
        expect(screen.getByText("From: (empty)")).toBeInTheDocument();
        expect(screen.getByText("To: New Parent")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: /confirm & send for approval/i })
        );

        const action = mockedStartEditing.mock.results[0]?.value;

        expect(mockedStartEditing).toHaveBeenCalledWith(
            expect.objectContaining({
                "row-42-field-Parents Names": expect.objectContaining({
                    name: "John Doe",
                    field: "Parents Names",
                    oldValue: "",
                    newValue: "New Parent",
                }),
            })
        );

        expect(mockDispatch).toHaveBeenCalledWith(action);

        expect(mockFetchData).toHaveBeenCalledWith({
            changes: {
                42: {
                    row_id: 42,
                    field_name: "Parents Names",
                    old_value: "",
                    new_value: "New Parent",
                },
            },
            file_id: 99,
            filename: "survivors.xlsx",
        });

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("does not overwrite an existing edit for the same cell", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire cell value changed/i }));
        fireEvent.click(screen.getByRole("button", { name: /fire duplicate cell change/i }));

        fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

        expect(screen.getByText("To: New Parent")).toBeInTheDocument();
        expect(screen.queryByText("To: Another Parent")).not.toBeInTheDocument();
    });

    it("closes the confirm dialog when Cancel is clicked", () => {
        renderComponent();

        fireEvent.click(screen.getByRole("button", { name: /fire cell value changed/i }));
        fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

        expect(screen.getByText(/please review your changes:/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

        expect(screen.getByRole("dialog", { hidden: true })).not.toBeVisible();
    });
});