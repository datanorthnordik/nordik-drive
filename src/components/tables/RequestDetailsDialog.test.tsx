import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import dayjs from "dayjs";

import RequestDetailsDialog from "./RequestDetailsDialog";
import { guessMimeFromFilename } from "../../lib/fileUtil";

let lastPhotoGridProps: any = null;
let lastDocumentGridProps: any = null;

jest.mock("@mui/material", () => ({
    __esModule: true,
    Box: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick, disabled, startIcon }: any) => (
        <button type="button" onClick={onClick} disabled={disabled}>
            {startIcon}
            {children}
        </button>
    ),
    Chip: ({ label }: any) => <span>{label}</span>,
    CircularProgress: () => (
        <span aria-hidden="true" data-testid="circular-progress">
            loading
        </span>
    ),
    Dialog: ({ open, children }: any) => (open ? <div role="dialog">{children}</div> : null),
    DialogActions: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    Typography: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@mui/icons-material/InfoOutlined", () => ({
    __esModule: true,
    default: () => <span aria-hidden="true">info-icon</span>,
}));

jest.mock("@mui/icons-material/Download", () => ({
    __esModule: true,
    default: () => <span aria-hidden="true">download-icon</span>,
}));

jest.mock("@mui/icons-material/Person", () => ({
    __esModule: true,
    default: () => <span aria-hidden="true">person-icon</span>,
}));

jest.mock("@mui/icons-material/Description", () => ({
    __esModule: true,
    default: () => <span aria-hidden="true">description-icon</span>,
}));

jest.mock("../shared/PhotoGrids", () => ({
    __esModule: true,
    PhotoGrid: (props: any) => {
        lastPhotoGridProps = props;
        const first = props.photos?.[0];

        return (
            <div data-testid="photo-grid">
                <div data-testid="photo-grid-title">{props.title}</div>
                <div data-testid="photo-grid-empty-text">{props.emptyText}</div>
                <div data-testid="photo-grid-loading">{String(props.loading)}</div>
                <div data-testid="photo-grid-count">{String(props.photos?.length ?? 0)}</div>
                {first ? (
                    <>
                        <div data-testid="photo-grid-url">{props.getPhotoUrl(first.id)}</div>
                        <button type="button" onClick={() => props.onOpenViewer(0)}>
                            Open Photo Viewer
                        </button>
                        <button type="button" onClick={() => props.onDownloadSingle(first.id)}>
                            Download Photo
                        </button>
                    </>
                ) : null}
            </div>
        );
    },
}));

jest.mock("../shared/DocumentGrids", () => ({
    __esModule: true,
    DocumentGrid: (props: any) => {
        lastDocumentGridProps = props;
        const first = props.documents?.[0];

        return (
            <div data-testid="document-grid">
                <div data-testid="document-grid-title">{props.title}</div>
                <div data-testid="document-grid-empty-text">{props.emptyText}</div>
                <div data-testid="document-grid-loading">{String(props.loading)}</div>
                <div data-testid="document-grid-count">{String(props.documents?.length ?? 0)}</div>
                <div data-testid="document-grid-view-label">{props.viewLabel}</div>
                {first ? (
                    <>
                        <div data-testid="document-grid-filename">{props.resolveFilename(first)}</div>
                        <div data-testid="document-grid-mime">{String(props.resolveMime(first) ?? "")}</div>
                        <button type="button" onClick={() => props.onOpenViewer(0)}>
                            Open Document Viewer
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                props.onDownloadSingle(
                                    first.id,
                                    props.resolveFilename(first),
                                    props.resolveMime(first)
                                )
                            }
                        >
                            Download Document
                        </button>
                    </>
                ) : null}
            </div>
        );
    },
}));

const mockGuessMimeFromFilename = jest.fn((filename: string) => `guessed/${filename}`);

jest.mock("../../lib/fileUtil", () => ({
    __esModule: true,
    guessMimeFromFilename: (filename: string) => mockGuessMimeFromFilename(filename),
}));

describe("RequestDetailsDialog", () => {
    const makeProps = (overrides: Partial<React.ComponentProps<typeof RequestDetailsDialog>> = {}) => ({
        open: true,
        onClose: jest.fn(),
        apiBase: "/api",
        selectedRequest: {
            request_id: 77,
            requested_by: 900,
            file_name: "evidence.csv",
            created_at: "2026-03-12T14:25:00Z",
        },
        createdByName: "Athul Narayanan",
        detailsLoading: false,
        detailsRows: [
            {
                id: 1,
                field_key: "email",
                old_value: "old@example.com",
                new_value: "new@example.com",
                status: "approved",
                reviewer_comment: "Looks good",
            },
        ],
        photos: [
            {
                id: 11,
                photo_comment: "Front side",
            },
        ] as any,
        onOpenPhotoViewer: jest.fn(),
        documents: [
            {
                id: 22,
                filename: "passport.pdf",
                mime_type: "application/pdf",
            },
        ] as any,
        onOpenDocViewer: jest.fn(),
        detailsZipLoading: false,
        onDownloadAll: jest.fn(),
        onDownloadSingle: jest.fn(),
        primaryBtnSx: { background: "blue" },
        secondaryBtnSx: { background: "gray" },
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        lastPhotoGridProps = null;
        lastDocumentGridProps = null;
    });

    it("renders nothing when dialog is closed", () => {
        render(<RequestDetailsDialog {...makeProps({ open: false })} />);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders no selected request message when selectedRequest is missing", () => {
        render(
            <RequestDetailsDialog
                {...makeProps({
                    selectedRequest: null,
                })}
            />
        );

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("No request selected.")).toBeInTheDocument();
        expect(screen.queryByText("Field Changes")).not.toBeInTheDocument();
        expect(screen.queryByTestId("photo-grid")).not.toBeInTheDocument();
        expect(screen.queryByTestId("document-grid")).not.toBeInTheDocument();
    });

    it("renders header information and request metadata", () => {
        render(<RequestDetailsDialog {...makeProps()} />);

        expect(screen.getByText("Request Details #77")).toBeInTheDocument();
        expect(screen.getByText("Created By")).toBeInTheDocument();
        expect(screen.getByText("Athul Narayanan")).toBeInTheDocument();
        expect(screen.getByText("Requested By ID: 900")).toBeInTheDocument();
        expect(screen.getByText("File")).toBeInTheDocument();
        expect(screen.getByText("evidence.csv")).toBeInTheDocument();
        expect(
            screen.getByText(
                `Created At: ${dayjs("2026-03-12T14:25:00Z").format("DD-MM-YYYY HH:mm")}`
            )
        ).toBeInTheDocument();
    });

    it("falls back to dashes for missing request metadata", () => {
        render(
            <RequestDetailsDialog
                {...makeProps({
                    selectedRequest: {
                        request_id: null,
                        requested_by: null,
                        file_name: "",
                        created_at: "",
                    },
                })}
            />
        );

        expect(screen.getByText("Request Details #-")).toBeInTheDocument();
        expect(screen.getByText("Requested By ID: -")).toBeInTheDocument();
        expect(screen.getByText("Created At: -")).toBeInTheDocument();
    });

    it("calls onDownloadAll when download all is clicked", () => {
        const props = makeProps();

        render(<RequestDetailsDialog {...props} />);

        fireEvent.click(screen.getByRole("button", { name: /Download All/i }));

        expect(props.onDownloadAll).toHaveBeenCalledTimes(1);
    });

    it("disables download all when request id is missing", () => {
        const props = makeProps({
            selectedRequest: {
                request_id: null,
            },
        });

        render(<RequestDetailsDialog {...props} />);

        const button = screen.getByRole("button", { name: /Download All/i });
        expect(button).toBeDisabled();

        fireEvent.click(button);
        expect(props.onDownloadAll).not.toHaveBeenCalled();
    });

    it("shows preparing state and spinner when details zip is loading", () => {
        render(<RequestDetailsDialog {...makeProps({ detailsZipLoading: true })} />);

        expect(screen.getByRole("button", { name: /Preparing/i })).toBeDisabled();
        expect(screen.getByTestId("circular-progress")).toBeInTheDocument();
    });

    it("shows loading text for field changes when details are loading", () => {
        render(<RequestDetailsDialog {...makeProps({ detailsLoading: true })} />);

        expect(screen.getByText("Field Changes")).toBeInTheDocument();
        expect(screen.getByText("Loading changes...")).toBeInTheDocument();
        expect(screen.queryByText("No change rows found.")).not.toBeInTheDocument();
    });

    it("shows empty state when there are no detail rows", () => {
        render(
            <RequestDetailsDialog
                {...makeProps({
                    detailsLoading: false,
                    detailsRows: [],
                })}
            />
        );

        expect(screen.getByText("No change rows found.")).toBeInTheDocument();
    });

    it("renders field changes table rows including empty old and new values", () => {
        render(
            <RequestDetailsDialog
                {...makeProps({
                    detailsRows: [
                        {
                            id: 1,
                            field_key: "email",
                            old_value: "old@example.com",
                            new_value: "new@example.com",
                        },
                        {
                            id: 2,
                            field_name: "phone",
                            old_value: null,
                            new_value: null,
                        },
                    ],
                })}
            />
        );

        expect(screen.getByText("Field")).toBeInTheDocument();
        expect(screen.getByText("Old")).toBeInTheDocument();
        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Reviewer Comment")).toBeInTheDocument();

        expect(screen.getByText("email")).toBeInTheDocument();
        expect(screen.getByText("old@example.com")).toBeInTheDocument();
        expect(screen.getByText("new@example.com")).toBeInTheDocument();
        expect(screen.getAllByText("PENDING")).toHaveLength(2);

        expect(screen.getByText("phone")).toBeInTheDocument();
        expect(screen.getAllByText("(empty)")).toHaveLength(2);
        expect(screen.getAllByText("No review comment")).toHaveLength(2);
    });

    it("renders photo grid and wires photo viewer and download callbacks", () => {
        const props = makeProps();

        render(<RequestDetailsDialog {...props} />);

        expect(screen.getByTestId("photo-grid")).toBeInTheDocument();
        expect(screen.getByTestId("photo-grid-title")).toHaveTextContent("Uploaded Photos");
        expect(screen.getByTestId("photo-grid-empty-text")).toHaveTextContent(
            "No photos submitted."
        );
        expect(screen.getByTestId("photo-grid-loading")).toHaveTextContent("false");
        expect(screen.getByTestId("photo-grid-count")).toHaveTextContent("1");
        expect(screen.getByTestId("photo-grid-url")).toHaveTextContent("/api/file/photo/11");

        fireEvent.click(screen.getByRole("button", { name: "Open Photo Viewer" }));
        fireEvent.click(screen.getByRole("button", { name: "Download Photo" }));

        expect(props.onOpenPhotoViewer).toHaveBeenCalledWith(0);
        expect(props.onDownloadSingle).toHaveBeenCalledWith(11, "photo_11.jpg", "image/jpeg");
        expect(lastPhotoGridProps.primaryBtnSx).toEqual({ background: "blue" });
        expect(lastPhotoGridProps.showDownload).toBe(true);
    });

    it("renders document grid and wires document viewer and download callbacks", () => {
        const props = makeProps();

        render(<RequestDetailsDialog {...props} />);

        expect(screen.getByTestId("document-grid")).toBeInTheDocument();
        expect(screen.getByTestId("document-grid-title")).toHaveTextContent("Uploaded Documents");
        expect(screen.getByTestId("document-grid-empty-text")).toHaveTextContent(
            "No documents submitted."
        );
        expect(screen.getByTestId("document-grid-loading")).toHaveTextContent("false");
        expect(screen.getByTestId("document-grid-count")).toHaveTextContent("1");
        expect(screen.getByTestId("document-grid-view-label")).toHaveTextContent("View");
        expect(screen.getByTestId("document-grid-filename")).toHaveTextContent("passport.pdf");
        expect(screen.getByTestId("document-grid-mime")).toHaveTextContent("application/pdf");

        fireEvent.click(screen.getByRole("button", { name: "Open Document Viewer" }));
        fireEvent.click(screen.getByRole("button", { name: "Download Document" }));

        expect(props.onOpenDocViewer).toHaveBeenCalledWith(0);
        expect(props.onDownloadSingle).toHaveBeenCalledWith(
            22,
            "passport.pdf",
            "application/pdf"
        );
        expect(lastDocumentGridProps.primaryBtnSx).toEqual({ background: "blue" });
        expect(lastDocumentGridProps.showViewButton).toBe(true);
        expect(lastDocumentGridProps.showDownload).toBe(true);
    });

    it("uses fallback filename and guessed mime for documents when values are missing", () => {
        render(
            <RequestDetailsDialog
                {...makeProps({
                    documents: [
                        {
                            id: 55,
                            file_name: "fallback.docx",
                        },
                    ] as any,
                })}
            />
        );

        expect(screen.getByTestId("document-grid-filename")).toHaveTextContent("fallback.docx");
        expect(mockGuessMimeFromFilename).toHaveBeenCalledWith("fallback.docx");
        expect(lastDocumentGridProps.resolveFilename({ id: 55, file_name: "fallback.docx" })).toBe(
            "fallback.docx"
        );
    });

    it("calls onClose from the footer close button", () => {
        const props = makeProps();

        render(<RequestDetailsDialog {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(props.onClose).toHaveBeenCalledTimes(1);
    });
});
