// DataTable.test.tsx
import React from "react";
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

/* CSS imports used by the component */
jest.mock("ag-grid-community/styles/ag-grid.css", () => ({}));
jest.mock("ag-grid-community/styles/ag-theme-quartz.css", () => ({}));

/* ---------- shared mutable mocks ---------- */

let mockLatestAgGridProps: any;
let mockLatestTopProps: any;
let mockLatestSourceProps: any;
let mockLatestCommunityProps: any;
let mockLatestSmartProps: any;

let mockGridApi: any;
let mockDispatch: jest.Mock;

let mockFileState: any;
let mockAuthState: any;
let mockApiEntries: any;

let mockPhotoFetchState: any;
let mockDocFetchState: any;

let mockDescribeInFlight = false;

const mockSetCommunities = jest.fn();
const mockApiEnsure = jest.fn();

const mockApplyQuickFilter = jest.fn();
const mockFindMatches = jest.fn();
const mockScrollToMatch = jest.fn();

const mockExtractUrls = jest.fn();
const mockIsDocumentUrl = jest.fn();
const mockLinkLabel = jest.fn();
const mockNormalizeUrl = jest.fn();
const mockOpenInNewTab = jest.fn();

/* ---------- module mocks ---------- */

jest.mock("ag-grid-community", () => {
    const registerModules = jest.fn();

    return {
        CellStyleModule: { __name: "CellStyleModule" },
        ClientSideRowModelApiModule: { __name: "ClientSideRowModelApiModule" },
        ClientSideRowModelModule: { __name: "ClientSideRowModelModule" },
        ColumnApiModule: { __name: "ColumnApiModule" },
        ColumnAutoSizeModule: { __name: "ColumnAutoSizeModule" },
        DateFilterModule: { __name: "DateFilterModule" },
        EventApiModule: { __name: "EventApiModule" },
        ExternalFilterModule: { __name: "ExternalFilterModule" },
        ModuleRegistry: {
            registerModules,
        },
        NumberFilterModule: { __name: "NumberFilterModule" },
        QuickFilterModule: { __name: "QuickFilterModule" },
        RenderApiModule: { __name: "RenderApiModule" },
        RowApiModule: { __name: "RowApiModule" },
        RowSelectionModule: { __name: "RowSelectionModule" },
        RowStyleModule: { __name: "RowStyleModule" },
        ScrollApiModule: { __name: "ScrollApiModule" },
        TextEditorModule: { __name: "TextEditorModule" },
        TextFilterModule: { __name: "TextFilterModule" },
        TooltipModule: { __name: "TooltipModule" },
    };
});

jest.mock("ag-grid-react", () => ({
    AgGridReact: (props: any) => {
        mockLatestAgGridProps = props;
        return <div data-testid="ag-grid-react">Mock Grid</div>;
    },
}));

jest.mock("react-redux", () => ({
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));

jest.mock("../../constants/constants", () => ({
    colorSources: {
        SRC1: "#123456",
        SRC2: "#654321",
    },
}));

jest.mock("../../store/auth/fileSlice", () => ({
    setCommunities: (...args: any[]) => mockSetCommunities(...args),
}));

jest.mock("../../store/api/apiSlice", () => ({
    apiEnsure: (...args: any[]) => mockApiEnsure(...args),
}));

jest.mock("../../hooks/useFetch", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../models/DescribeEntry", () => ({
    useDescribeEntry: jest.fn(),
}));

jest.mock("../../lib/urlUtils", () => ({
    extractUrls: (...args: any[]) => mockExtractUrls(...args),
    isDocumentUrl: (...args: any[]) => mockIsDocumentUrl(...args),
    linkLabel: (...args: any[]) => mockLinkLabel(...args),
    normalizeUrl: (...args: any[]) => mockNormalizeUrl(...args),
    openInNewTab: (...args: any[]) => mockOpenInNewTab(...args),
}));

jest.mock("../../lib/gridSearch", () => ({
    applyQuickFilter: (...args: any[]) => mockApplyQuickFilter(...args),
    findMatches: (...args: any[]) => mockFindMatches(...args),
    scrollToMatch: (...args: any[]) => mockScrollToMatch(...args),
}));

jest.mock("../Wrappers", () => {
    const React = require("react");

    const GridWrapper = React.forwardRef(
        (
            {
                children,
                style,
            }: {
                children: React.ReactNode;
                style?: React.CSSProperties;
            },
            ref: any
        ) => (
            <div ref={ref} data-testid="grid-wrapper" style={style}>
                {children}
            </div>
        )
    );

    GridWrapper.displayName = "MockGridWrapper";

    const DataTableWrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="data-table-wrapper">{children}</div>
    );

    return {
        GridWrapper,
        DataTableWrapper,
    };
});

/* ---------- child component mocks ---------- */

jest.mock("../NIAChat", () => ({
    __esModule: true,
    default: ({ open }: any) => <div data-testid="nia-chat">nia:{String(open)}</div>,
}));

jest.mock("./add-info-dialog/AddInfoForm", () => ({
    __esModule: true,
    default: ({ row, file, onClose }: any) => (
        <div data-testid="add-info-form">
            <div data-testid="add-info-row">{JSON.stringify(row)}</div>
            <div data-testid="add-info-file">{JSON.stringify(file)}</div>
            <button onClick={onClose}>close-add-info</button>
        </div>
    ),
}));

jest.mock("./SmartSearchSuggestions", () => ({
    __esModule: true,
    default: (props: any) => {
        mockLatestSmartProps = props;
        return (
            <div data-testid="smart-search">
                <div data-testid="smart-query">{props.query}</div>
                <div data-testid="smart-results">{String(props.hasResults)}</div>
                <button onClick={() => props.onPick("picked value")}>pick-smart</button>
            </div>
        );
    },
}));

jest.mock("../photoview/URLDocumentViewer", () => ({
    __esModule: true,
    default: ({ open, url, title, onClose }: any) =>
        open ? (
            <div data-testid="doc-url-viewer">
                <div>{title}</div>
                <div>{url}</div>
                <button onClick={onClose}>close-doc-url</button>
            </div>
        ) : null,
}));

jest.mock("../../pages/viewers/DocumentViewer", () => ({
    __esModule: true,
    default: ({ open, docs, onClose }: any) =>
        open ? (
            <div data-testid="document-viewer">
                <div>docs:{docs.length}</div>
                <button onClick={onClose}>close-document-viewer</button>
            </div>
        ) : null,
}));

jest.mock("../../pages/viewers/PhotoViewer", () => ({
    __esModule: true,
    default: ({ open, photos, onClose }: any) =>
        open ? (
            <div data-testid="photo-viewer">
                <div>photos:{photos.length}</div>
                <button onClick={onClose}>close-photo-viewer</button>
            </div>
        ) : null,
}));

jest.mock("../Loader", () => ({
    __esModule: true,
    default: ({ loading, text }: any) =>
        loading ? <div data-testid="loader">{text}</div> : null,
}));

jest.mock("./TopControlBar", () => ({
    __esModule: true,
    default: (props: any) => {
        mockLatestTopProps = props;
        return (
            <div data-testid="top-controls-bar">
                <div data-testid="top-is-mobile">{String(props.isMobile)}</div>
                <div data-testid="top-match-count">{String(props.matchesCount)}</div>

                <button onClick={() => props.setSearchText("needle")}>set-search</button>
                <button onClick={() => props.onSearch()}>run-search</button>
                <button onClick={() => props.onNavigateMatch("next")}>next-match</button>
                <button onClick={() => props.onNavigateMatch("prev")}>prev-match</button>
                <button onClick={() => props.onZoomChange(props.fontSize + 2)}>zoom-in</button>
                <button onClick={() => props.setNiaOpen(true)}>open-nia</button>

                <button
                    onClick={() => {
                        props.recognitionRef.current = { stop: jest.fn() };
                        props.setIsRecording(true);
                    }}
                >
                    start-recording
                </button>
            </div>
        );
    },
}));

jest.mock("./SourceFilterBar", () => ({
    __esModule: true,
    default: (props: any) => {
        mockLatestSourceProps = props;
        return (
            <div data-testid="source-filter-bar">
                <div data-testid="available-sources">{props.availableSources.join("|")}</div>
                <div data-testid="current-source-filter">{String(props.sourceFilter)}</div>

                <button onClick={() => props.setSourceFilter(props.availableSources[0])}>
                    pick-first-source
                </button>
                <button onClick={() => props.setSourceFilter(null)}>clear-source</button>
            </div>
        );
    },
}));

jest.mock("./CommunityActionBar", () => ({
    __esModule: true,
    default: (props: any) => {
        mockLatestCommunityProps = props;
        return (
            <div data-testid="community-action-bar">
                <div data-testid="community-open">{String(props.filterOpen)}</div>

                <button onClick={() => props.setFilterOpen((p: boolean) => !p)}>
                    toggle-community-filter
                </button>
                <button onClick={props.onAddStudent}>add-student</button>
            </div>
        );
    },
}));

jest.mock("./CommunityFilterPanel", () => ({
    __esModule: true,
    default: ({ enabled, filterOpen, isMobile }: any) => (
        <div data-testid="community-filter-panel">
            enabled:{String(enabled)}|open:{String(filterOpen)}|mobile:{String(isMobile)}
        </div>
    ),
}));

jest.mock("./LinksDialog", () => ({
    __esModule: true,
    default: ({ open, title, urls, onClose }: any) =>
        open ? (
            <div data-testid="links-dialog">
                <div data-testid="links-title">{title}</div>
                <div data-testid="links-urls">{urls.join("|")}</div>
                <button onClick={onClose}>close-links</button>
            </div>
        ) : null,
}));

jest.mock("./DataGridStyles", () => ({
    __esModule: true,
    default: () => <div data-testid="data-grid-styles" />,
}));

jest.mock("./config-form-modal.tsx/ConfigFormModal", () => ({
    __esModule: true,
    default: ({ open, row, formConfig, onClose, requestGuardEnabled, currentUserEmail }: any) =>
        open ? (
            <div data-testid="config-form-modal">
                <div data-testid="cfg-row">{JSON.stringify(row)}</div>
                <div data-testid="cfg-form">{JSON.stringify(formConfig)}</div>
                <div data-testid="cfg-request-guard-enabled">{String(requestGuardEnabled)}</div>
                <div data-testid="cfg-current-user-email">{String(currentUserEmail ?? "")}</div>
                <button onClick={onClose}>close-config-form</button>
            </div>
        ) : null,
}));

jest.mock("lucide-react", () => ({
    MicIcon: () => <span data-testid="mic-icon">mic</span>,
}));

/* ---------- imports after mocks ---------- */

import { useDispatch, useSelector } from "react-redux";
import useFetch from "../../hooks/useFetch";
import { useDescribeEntry } from "../models/DescribeEntry";
import DataGrid from "./DataTable";

/* ---------- typed mock handles ---------- */

const mockedUseDispatch = useDispatch as unknown as jest.Mock;
const mockedUseSelector = useSelector as unknown as jest.Mock;
const mockedUseFetch = useFetch as unknown as jest.Mock;
const mockedUseDescribeEntry = useDescribeEntry as unknown as jest.Mock;

/* ---------- test helpers ---------- */

const mockBaseRows = [
    {
        id: 1,
        Name: "Alice (SRC1)",
        "First Nation/Community": "Garden River",
        Website: "https://site.test",
        DocLink: "https://site.test/file.pdf",
        MultiLinks: "https://a.test https://b.test/file.pdf",
        Photos: "yes",
        Documents: "yes",
    },
    {
        id: 2,
        Name: "Bob (SRC2)",
        "First Nation/Community": "Batchewana",
        Website: "plain text",
        DocLink: "",
        MultiLinks: "",
        Photos: "yes",
        Documents: "yes",
    },
    {
        id: 3,
        Name: "Carol",
        "First Nation/Community": "Garden River",
        Website: "",
        DocLink: "",
        MultiLinks: "",
        Photos: "yes",
        Documents: "yes",
    },
];

function renderComponent(rows = mockBaseRows) {
    return render(<DataGrid rowData={rows} />);
}

function getColumnByField(field: string) {
    return mockLatestAgGridProps.columnDefs.find(
        (c: any) => c.field === field || c.colId === field
    );
}

function renderCell(field: string, value: any, row = mockBaseRows[0]) {
    const col = getColumnByField(field);

    if (!col) {
        throw new Error(`Column not found: ${field}`);
    }

    const Renderer = col.cellRenderer;
    const props = {
        value,
        data: row,
        colDef: col,
        context: mockLatestAgGridProps.context,
    };

    return render(<Renderer {...props} />);
}

/* ---------- setup ---------- */

beforeEach(() => {
    mockLatestAgGridProps = undefined;
    mockLatestTopProps = undefined;
    mockLatestSourceProps = undefined;
    mockLatestCommunityProps = undefined;
    mockLatestSmartProps = undefined;

    mockDispatch = jest.fn();

    mockGridApi = {
        onFilterChanged: jest.fn(),
        getDisplayedRowCount: jest.fn(() => 0),
        getDisplayedRowAtIndex: jest.fn((i: number) => ({ data: mockBaseRows[i] })),
    };

    mockFileState = {
        selectedFile: {
            id: 55,
            filename: "students.csv",
            community_filter: false,
            describe: true,
        },
        selectedCommunities: [],
    };

    mockAuthState = {
        user: {
            id: 88,
            email: "owner@nordik.test",
        },
    };

    mockApiEntries = {};

    mockPhotoFetchState = {
        data: null,
        loading: false,
        error: null,
        fetchData: jest.fn(() => Promise.resolve()),
    };

    mockDocFetchState = {
        data: null,
        loading: false,
        error: null,
        fetchData: jest.fn(() => Promise.resolve()),
    };

    mockDescribeInFlight = false;

    mockedUseDispatch.mockReturnValue(mockDispatch);

    mockedUseSelector.mockImplementation((selector: any) =>
        selector({
            file: mockFileState,
            auth: mockAuthState,
            api: { entries: mockApiEntries },
        })
    );

    mockedUseFetch.mockImplementation((url: string) => {
        if (url.includes("/file/photos")) return mockPhotoFetchState;
        if (url.includes("/file/docs")) return mockDocFetchState;

        return {
            data: null,
            loading: false,
            error: null,
            fetchData: jest.fn(),
        };
    });

    mockedUseDescribeEntry.mockImplementation(() => ({
        describeColDef: {
            headerName: "Describe",
            field: "__describe",
            pinned: "left",
            width: 140,
            minWidth: 140,
            suppressSizeToFit: true,
            sortable: false,
            filter: false,
        },
        describeContext: {
            describeRow: jest.fn(),
        },
        describeModal: <div data-testid="describe-modal">Describe Modal</div>,
        describeInFlight: mockDescribeInFlight,
    }));

    mockSetCommunities.mockImplementation((payload: any) => ({
        type: "file/setCommunities",
        payload,
    }));

    mockApiEnsure.mockImplementation((payload: any) => ({
        type: "api/ensure",
        payload,
    }));

    mockSetCommunities.mockClear();
    mockApiEnsure.mockClear();
    mockApplyQuickFilter.mockClear();
    mockFindMatches.mockClear();
    mockScrollToMatch.mockClear();
    mockOpenInNewTab.mockClear();

    mockFindMatches.mockReturnValue([]);

    mockExtractUrls.mockImplementation((value: string) => {
        const urls = String(value).match(/https?:\/\/\S+/g);
        return urls || [];
    });

    mockIsDocumentUrl.mockImplementation((url: string) =>
        String(url).trim().endsWith(".pdf")
    );

    mockLinkLabel.mockImplementation((url: string) => `Label:${url}`);
    mockNormalizeUrl.mockImplementation((url: string) => String(url).trim());

    Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
    });

    const raf = (cb: FrameRequestCallback) => {
        cb(0);
        return 1;
    };

    (window as any).requestAnimationFrame = raf;
    (global as any).requestAnimationFrame = raf;

    document.body.style.overflow = "";
});

afterEach(() => {
    jest.useRealTimers();
});

/* ---------- tests ---------- */

describe("DataGrid", () => {
    it("renders baseline layout, grid, styles, and dispatches config fetch", () => {
        renderComponent();

        expect(screen.getByTestId("top-controls-bar")).toBeInTheDocument();
        expect(screen.getByTestId("smart-search")).toBeInTheDocument();
        expect(screen.getByTestId("ag-grid-react")).toBeInTheDocument();
        expect(screen.getByTestId("describe-modal")).toBeInTheDocument();
        expect(screen.getByTestId("data-grid-styles")).toBeInTheDocument();

        expect(mockApiEnsure).toHaveBeenCalledWith({
            key: "config_students.csv",
            url:
                "https://nordikdriveapi-724838782318.us-west1.run.app/api/config?file_name=students.csv",
            method: "GET",
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "api/ensure",
            })
        );
    });

    it("shows SourceFilterBar in fallback non-community mode and extracts only known sources", () => {
        renderComponent();

        expect(screen.getByTestId("source-filter-bar")).toBeInTheDocument();
        expect(screen.queryByTestId("community-action-bar")).not.toBeInTheDocument();
        expect(screen.getByTestId("available-sources")).toHaveTextContent("SRC1|SRC2");
    });

    it("shows community mode when enabled, dispatches unique sorted communities, and locks body scroll", async () => {
        mockFileState.selectedFile.community_filter = true;

        renderComponent();

        expect(screen.getByTestId("community-action-bar")).toBeInTheDocument();
        expect(screen.queryByTestId("source-filter-bar")).not.toBeInTheDocument();
        expect(screen.getByTestId("community-filter-panel")).toHaveTextContent("enabled:true");
        expect(document.body.style.overflow).toBe("hidden");

        await waitFor(() => {
            expect(mockSetCommunities).toHaveBeenCalledWith({
                communities: ["Batchewana", "Garden River"],
            });
        });

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "file/setCommunities",
            })
        );
    });

    it("toggles community filter closed and restores body overflow", async () => {
        mockFileState.selectedFile.community_filter = true;

        renderComponent();

        fireEvent.click(screen.getByText("toggle-community-filter"));

        await waitFor(() => {
            expect(screen.getByTestId("community-open")).toHaveTextContent("false");
        });

        expect(document.body.style.overflow).toBe("");
    });

    it("fallback add-student opens AddInfoForm with a blank row shape", async () => {
        mockFileState.selectedFile.community_filter = true;

        renderComponent();

        fireEvent.click(screen.getByText("add-student"));

        await waitFor(() => {
            expect(screen.getByTestId("add-info-form")).toBeInTheDocument();
        });

        const row = JSON.parse(screen.getByTestId("add-info-row").textContent || "{}");
        expect(row.id).toBe("");
        expect(row.Name).toBe("");
        expect(row["First Nation/Community"]).toBe("");
        expect(row.Website).toBe("");
    });

    it("Add Info cell renderer opens AddInfoForm with the clicked row", async () => {
        mockFileState.selectedFile.community_filter = true;

        renderComponent();

        const cell = renderCell("add_info", "", mockBaseRows[0]);

        fireEvent.click(cell.getByRole("button", { name: /add info/i }));

        await waitFor(() => {
            expect(screen.getByTestId("add-info-form")).toBeInTheDocument();
        });
        expect(screen.getByTestId("add-info-row")).toHaveTextContent('"id":1');
        expect(screen.getByTestId("add-info-row")).toHaveTextContent('"Name":"Alice (SRC1)"');
    });

    it("stores gridApi on onGridReady and changing sourceFilter triggers gridApi.onFilterChanged", async () => {
        renderComponent();

        act(() => {
            mockLatestAgGridProps.onGridReady({ api: mockGridApi });
        });

        fireEvent.click(screen.getByText("pick-first-source"));

        await waitFor(() => {
            expect(mockGridApi.onFilterChanged).toHaveBeenCalled();
        });
    });

    it("debounced search runs quick filter, computes matches, scrolls, and navigation moves to next + prev match", () => {
        jest.useFakeTimers();

        const m1 = { rowNode: { id: 1 }, colId: "Name" };
        const m2 = { rowNode: { id: 2 }, colId: "Website" };

        mockFindMatches.mockReturnValue([m1, m2]);
        mockGridApi.getDisplayedRowCount.mockReturnValue(0);

        renderComponent();

        act(() => {
            mockLatestAgGridProps.onGridReady({ api: mockGridApi });
        });

        fireEvent.click(screen.getByText("set-search"));

        act(() => {
            jest.advanceTimersByTime(500); // debounce timeout
        });

        act(() => {
            jest.advanceTimersByTime(20); // requestAnimationFrame callback
        });

        expect(mockApplyQuickFilter).toHaveBeenCalledWith(mockGridApi, "needle");
        expect(mockFindMatches).toHaveBeenCalledWith(mockGridApi, "needle");
        expect(mockScrollToMatch).toHaveBeenCalledWith(mockGridApi, m1);

        expect(screen.getByTestId("smart-query")).toHaveTextContent("needle");
        expect(screen.getByTestId("smart-results")).toHaveTextContent("false");
        expect(screen.getByTestId("top-match-count")).toHaveTextContent("2");

        fireEvent.click(screen.getByText("next-match"));
        expect(mockScrollToMatch).toHaveBeenLastCalledWith(mockGridApi, m2);

        fireEvent.click(screen.getByText("prev-match"));
        expect(mockScrollToMatch).toHaveBeenLastCalledWith(mockGridApi, m1);
    });

    it("SmartSearchSuggestions pick updates search and re-runs search immediately", () => {
        mockFindMatches.mockReturnValue([]);

        renderComponent();

        act(() => {
            mockLatestAgGridProps.onGridReady({ api: mockGridApi });
        });

        fireEvent.click(screen.getByText("pick-smart"));

        expect(mockApplyQuickFilter).toHaveBeenCalledWith(mockGridApi, "picked value");
        expect(screen.getByTestId("smart-query")).toHaveTextContent("picked value");
    });

    it("opens NIA and recorder overlay, then clicking recorder button stops recording", async () => {
        renderComponent();

        fireEvent.click(screen.getByText("open-nia"));
        await waitFor(() => {
            expect(screen.getByTestId("nia-chat")).toBeInTheDocument();
        });

        const listeningText = screen.getByText("Listening...");
        expect(listeningText).not.toBeVisible();

        fireEvent.click(screen.getByText("start-recording"));
        expect(listeningText).toBeVisible();

        const micButton = screen.getByTestId("mic-icon").parentElement;
        expect(micButton).toBeTruthy();

        fireEvent.click(micButton!);

        expect(listeningText).not.toBeVisible();
    });

    it("default text cell highlights search text and applies source background color", () => {
        renderComponent();

        act(() => {
            mockLatestTopProps.setSearchText("Ali");
        });

        const ui = renderCell("Name", "Alice (SRC1)", mockBaseRows[0]);

        const highlighted = within(ui.container).getByText("Ali");
        expect(highlighted).toHaveStyle("background-color: yellow");
        expect(ui.container.firstChild).toHaveStyle("background-color: #123456");
    });

    it("single website URL cell opens a website in a new tab", () => {
        renderComponent();

        const ui = renderCell("Website", "https://site.test", mockBaseRows[0]);

        fireEvent.click(ui.getByRole("button", { name: /view website/i }));

        expect(mockOpenInNewTab).toHaveBeenCalledWith("https://site.test");
    });

    it("single document URL cell opens the document URL viewer and can close", async () => {
        renderComponent();

        const ui = renderCell("DocLink", "https://site.test/file.pdf", mockBaseRows[0]);

        fireEvent.click(ui.getByRole("button", { name: /view document/i }));

        expect(mockNormalizeUrl).toHaveBeenCalledWith("https://site.test/file.pdf");
        expect(mockLinkLabel).toHaveBeenCalledWith("https://site.test/file.pdf");

        await waitFor(() => {
            expect(screen.getByTestId("doc-url-viewer")).toBeInTheDocument();
        });
        expect(screen.getByTestId("doc-url-viewer")).toHaveTextContent(
            "Label:https://site.test/file.pdf"
        );

        fireEvent.click(screen.getByText("close-doc-url"));

        await waitFor(() => {
            expect(screen.queryByTestId("doc-url-viewer")).not.toBeInTheDocument();
        });
    });

    it("multiple URLs open LinksDialog and it can close", async () => {
        renderComponent();

        const ui = renderCell(
            "MultiLinks",
            "https://a.test https://b.test/file.pdf",
            mockBaseRows[0]
        );

        fireEvent.click(ui.getByRole("button", { name: /view links/i }));

        expect(screen.getByTestId("links-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("links-title")).toHaveTextContent("MultiLinks");
        expect(screen.getByTestId("links-urls")).toHaveTextContent(
            "https://a.test|https://b.test/file.pdf"
        );

        fireEvent.click(screen.getByText("close-links"));

        await waitFor(() => {
            expect(screen.queryByTestId("links-dialog")).not.toBeInTheDocument();
        });
    });

    it("config-driven mode uses config columns, hides fallback source filter when disabled, and add-student uses config defaults", () => {
  mockApiEntries = {
    "config_students.csv": {
      data: {
        config: {
          describe: false,
          community_filter: true,
          source_filter: false,
          addInfo: {
            enabled: true,
            required_fields: ["Required Field"],
          },
          columns: [
            { name: "Name", display_name: "Student Name", type: "input" },
            { name: "Tags", display_name: "Tags", type: "multi" },
            {
              name: "Extra Field",
              display_name: "Extra Field",
              additional_field: true,
              type: "input",
            },
            {
              name: "Skip Add Only",
              display_name: "Skip",
              add_only: true,
              type: "input",
            },
            {
              name: "Attachment",
              display_name: "Attachment",
              type: "form",
              key: "att",
              additional_field: true,
            },
          ],
        },
      },
    },
  };

  renderComponent([
    {
      id: 1,
      Name: "Alice",
      "First Nation/Community": "Garden River",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: ""
    },
  ]);

  expect(screen.getByTestId("community-action-bar")).toBeInTheDocument();
  expect(screen.queryByTestId("source-filter-bar")).not.toBeInTheDocument();

  const fields = mockLatestAgGridProps.columnDefs.map((c: any) => c.field);

  expect(fields).toContain("add_info");
  expect(fields).toContain("Name");
  expect(fields).toContain("Extra Field");
  expect(fields).toContain("__form__att");
  expect(fields).not.toContain("__describe");

  fireEvent.click(screen.getByText("add-student"));

  const row = JSON.parse(screen.getByTestId("add-info-row").textContent || "{}");
  expect(row.id).toBe("");
  expect(row.Name).toBe("");
  expect(row.Tags).toEqual([]);
  expect(row["Required Field"]).toBe("");
});

    it("passes the request guard props only through the table-opened config form flow", async () => {
  mockApiEntries = {
    "config_students.csv": {
      data: {
        config: {
          describe: false,
          community_filter: false,
          source_filter: false,
          addInfo: {
            firstname: "Name",
            lastname: "Last Name",
          },
          columns: [
            {
              name: "Attachment",
              display_name: "Attachment",
              type: "form",
              key: "att",
              additional_field: true,
            },
          ],
        },
      },
    },
  };

  renderComponent([
    {
      id: 1,
      Name: "Alice",
      "Last Name": "Example",
      "First Nation/Community": "Garden River",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: "",
    },
  ]);

  const ui = renderCell("__form__att", "", mockBaseRows[0]);
  fireEvent.click(ui.getByRole("button", { name: /add\/view/i }));

  await waitFor(() => {
    expect(screen.getByTestId("config-form-modal")).toBeInTheDocument();
  });
  expect(screen.getByTestId("cfg-request-guard-enabled")).toHaveTextContent("true");
  expect(screen.getByTestId("cfg-current-user-email")).toHaveTextContent("owner@nordik.test");
});

  it("config-driven mode uses config columns, hides fallback source filter when disabled, and add-student uses config defaults", async () => {
  mockApiEntries = {
    "config_students.csv": {
      data: {
        config: {
          describe: false,
          community_filter: true,
          source_filter: false,
          addInfo: {
            enabled: true,
            required_fields: ["Required Field"],
          },
          columns: [
            { name: "Name", display_name: "Student Name", type: "input" },
            { name: "Tags", display_name: "Tags", type: "multi" },
            {
              name: "Extra Field",
              display_name: "Extra Field",
              additional_field: true,
              type: "input",
            },
            {
              name: "Skip Add Only",
              display_name: "Skip",
              add_only: true,
              type: "input",
            },
            {
              name: "Attachment",
              display_name: "Attachment",
              type: "form",
              key: "att",
              additional_field: true,
            },
          ],
        },
      },
    },
  };

  renderComponent([
    {
      id: 1,
      Name: "Alice",
      "First Nation/Community": "Garden River",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: "",
    },
  ]);

  expect(screen.getByTestId("community-action-bar")).toBeInTheDocument();
  expect(screen.queryByTestId("source-filter-bar")).not.toBeInTheDocument();

  const fields = mockLatestAgGridProps.columnDefs.map((c: any) => c.field);

  expect(fields).toContain("add_info");
  expect(fields).toContain("Name");
  expect(fields).toContain("Extra Field");
  expect(fields).toContain("__form__att");
  expect(fields).not.toContain("__describe");

  fireEvent.click(screen.getByText("add-student"));

  await waitFor(() => {
    expect(screen.getByTestId("add-info-form")).toBeInTheDocument();
  });
  const row = JSON.parse(screen.getByTestId("add-info-row").textContent || "{}");
  expect(row.id).toBe("");
  expect(row.Name).toBe("");
  expect(row.Tags).toEqual([]);
  expect(row["Required Field"]).toBe("");
});

    it("config photo/doc buttons trigger fetches and real useViewerLoader flow opens both viewer modals", async () => {
  mockApiEntries = {
    "config_students.csv": {
      data: {
        config: {
          describe: false,
          community_filter: false,
          source_filter: false,
          addInfo: { enabled: false, required_fields: [] },
          columns: [
            {
              name: "Photo Btn",
              display_name: "Photo Btn",
              type: "photo_view",
              additional_field: true,
            },
            {
              name: "Doc Btn",
              display_name: "Doc Btn",
              type: "doc_view",
              additional_field: true,
            },
          ],
        },
      },
    },
  };

  mockPhotoFetchState.data = { photos: [{ id: "p1" }, { id: "p2" }] };
  mockDocFetchState.data = { docs: [{ id: "d1" }] };

  renderComponent([
    {
      id: 1,
      Name: "",
      "First Nation/Community": "",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: ""
    },
  ]);

  const photoUI = renderCell("__photo_view__Photo Btn", "", {
      id: 1,
      Name: "",
      "First Nation/Community": "",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: ""
  });

  fireEvent.click(photoUI.getByRole("button", { name: /view photos/i }));

  expect(mockPhotoFetchState.fetchData).toHaveBeenCalledWith(
    undefined,
    undefined,
    false,
    { path: 1 }
  );

  await waitFor(() => {
    expect(screen.getByTestId("photo-viewer")).toBeInTheDocument();
  });

  expect(screen.getByTestId("photo-viewer")).toHaveTextContent("photos:2");

  const docUI = renderCell("__doc_view__Doc Btn", "", {
      id: 1,
      Name: "",
      "First Nation/Community": "",
      Website: "",
      DocLink: "",
      MultiLinks: "",
      Photos: "",
      Documents: ""
  });

  fireEvent.click(docUI.getByRole("button", { name: /view documents/i }));

  expect(mockDocFetchState.fetchData).toHaveBeenCalledWith(
    undefined,
    undefined,
    false,
    { path: 1 }
  );

  await waitFor(() => {
    expect(screen.getByTestId("document-viewer")).toBeInTheDocument();
  });

  expect(screen.getByTestId("document-viewer")).toHaveTextContent("docs:1");
});

    it("shows loader when describe is in flight", () => {
        mockDescribeInFlight = true;

        renderComponent();

        expect(screen.getByTestId("loader")).toHaveTextContent(
            "Generating description..."
        );
    });

    it("uses mobile mode when screen width is small", async () => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 600,
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByTestId("top-is-mobile")).toHaveTextContent("true");
            expect(screen.getByTestId("community-filter-panel")).toHaveTextContent(
                "mobile:true"
            );
        });
    });
});
