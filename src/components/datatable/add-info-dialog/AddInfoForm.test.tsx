import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import AddInfoForm from "./AddInfoForm";
import useFetch from "../../../hooks/useFetch";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery } from "@mui/material";
import * as utils from "./utils";
import { MAX_ADDITIONAL_DOCS } from "./constants";

jest.mock("../../../config/api", () => ({
    API_BASE: "http://api.test",
}));

jest.mock("@mui/material", () => {
    const actual = jest.requireActual("@mui/material");
    const React = require("react");

    return {
        ...actual,
        useMediaQuery: jest.fn(),
        Dialog: ({ open, children }: any) => (open ? <div data-testid="mui-dialog">{children}</div> : null),
        DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
        DialogActions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
        Typography: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    };
});

jest.mock("react-redux", () => ({
    ...jest.requireActual("react-redux"),
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));

jest.mock("../../../hooks/useFetch");

jest.mock("react-hot-toast", () => {
    const fn: any = jest.fn();
    fn.success = jest.fn();
    fn.error = jest.fn();
    return { __esModule: true, default: fn };
});

jest.mock("./utils", () => {
    const actual = jest.requireActual("./utils");
    return {
        ...actual,
        uid: jest.fn(),
        convertToBase64: jest.fn(),
        estimateTotalBase64Bytes: jest.fn(),
    };
});

jest.mock("../../Loader", () => ({
    __esModule: true,
    default: ({ loading, text }: any) => (
        <div data-testid="loader">
            {String(loading)}|{text || ""}
        </div>
    ),
}));

jest.mock("./FieldRow", () => ({
    __esModule: true,
    default: ({ label, required, onReset, children }: any) => (
        <div data-testid={`field-row-${label}`}>
            <div data-testid="order-node" data-name={label}>
                {label}
                {required ? " *" : ""}
            </div>
            {onReset ? <button onClick={onReset}>reset-{label}</button> : null}
            {children}
        </div>
    ),
}));

jest.mock("./TextFieldRow", () => ({
    __esModule: true,
    default: ({ value, onChange, disabled, multiline }: any) => (
        <input
            data-testid={multiline ? "textarea-field-row" : "text-field-row"}
            value={value || ""}
            disabled={!!disabled}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

jest.mock("./DateFieldRow", () => ({
    __esModule: true,
    default: ({ value, onChange, disabled }: any) => (
        <input
            data-testid="date-field-row"
            value={value || ""}
            disabled={!!disabled}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}));

jest.mock("./MultiValueRow", () => ({
    __esModule: true,
    default: ({ values, onChange, addLabel, disabled }: any) => (
        <div data-testid="multi-value-row">
            <div data-testid="multi-values">{(values || []).join("|")}</div>
            <button disabled={!!disabled} onClick={() => onChange(["Alpha", "Beta"])}>
                {addLabel}
            </button>
        </div>
    ),
}));

jest.mock("./CommunityMultiRow", () => ({
    __esModule: true,
    default: ({ values, onChange, onAddNewCommunity, disabled }: any) => (
        <div data-testid="community-multi-row">
            <div data-testid="community-values">{(values || []).join("|")}</div>
            <button disabled={!!disabled} onClick={() => onChange(["Garden River", "Batchewana"])}>
                change-community
            </button>
            <button disabled={!!disabled} onClick={() => void onAddNewCommunity("New Community")}>
                add-community
            </button>
        </div>
    ),
}));

jest.mock("./PhotoUploadCard", () => ({
    __esModule: true,
    default: ({ photos, setPhotos, onUpload, onRemove, consent, setConsent, config, totalCombinedMB }: any) => (
        <div data-testid="photo-upload-card">
            <div data-testid="order-node" data-name={config?.display_name || "Photos"} />
            <div data-testid="photo-count">{String((photos || []).length)}</div>
            <div data-testid="photo-consent">{String(!!consent)}</div>
            <div data-testid="photo-total-combined">{String(totalCombinedMB)}</div>

            <input data-testid="photo-input" type="file" multiple onChange={onUpload} />

            <button onClick={() => (photos?.length ? onRemove(0) : null)}>remove-photo</button>
            <button onClick={() => setConsent(!consent)}>toggle-photo-consent</button>

            <button
                onClick={() =>
                    setPhotos(
                        Array.from({ length: 6 }).map((_, i) => ({
                            id: `seed-photo-${i}`,
                            file: new File([new Uint8Array(10)], `seed-${i}.jpg`, { type: "image/jpeg" }),
                            comment: i === 0 ? "x".repeat(120) : "",
                        }))
                    )
                }
            >
                seed-photo-state
            </button>
        </div>
    ),
}));

jest.mock("./AdditionalDocsCard", () => ({
    __esModule: true,
    default: ({
        additionalDocs,
        onUpload,
        onRemove,
        onUpdateCategory,
        archiveConsent,
        setArchiveConsent,
        config,
        totalAdditionalDocsMB,
        totalCombinedMB,
    }: any) => (
        <div data-testid="additional-docs-card">
            <div data-testid="order-node" data-name={config?.display_name || "Additional Documents"} />
            <div data-testid="doc-count">{String((additionalDocs || []).length)}</div>
            <div data-testid="archive-consent">{String(!!archiveConsent)}</div>
            <div data-testid="first-doc-category">{additionalDocs?.[0]?.document_category || ""}</div>
            <div data-testid="docs-total">{String(totalAdditionalDocsMB)}</div>
            <div data-testid="docs-combined">{String(totalCombinedMB)}</div>

            <input data-testid="doc-input" type="file" multiple onChange={onUpload} />

            <button onClick={() => (additionalDocs?.length ? onUpdateCategory(additionalDocs[0].id, "birth_certificate") : null)}>
                update-doc-category
            </button>
            <button onClick={() => (additionalDocs?.length ? onRemove(additionalDocs[0].id) : null)}>remove-doc</button>
            <button onClick={() => setArchiveConsent(!archiveConsent)}>toggle-archive-consent</button>
        </div>
    ),
}));

jest.mock("./ResetAllDialog", () => ({
    __esModule: true,
    default: ({ open, onClose, onConfirm }: any) =>
        open ? (
            <div data-testid="reset-all-dialog">
                <button onClick={onClose}>close-reset</button>
                <button onClick={onConfirm}>confirm-reset</button>
            </div>
        ) : null,
}));

jest.mock("./ReviewDialog", () => ({
    __esModule: true,
    default: ({
        open,
        title,
        items,
        photosCount,
        docs,
        consent,
        archiveConsent,
        totalCombinedMB,
        maxCombinedMB,
        onBack,
        onConfirm,
        confirmLabel,
    }: any) =>
        open ? (
            <div data-testid="review-dialog">
                <div>{title}</div>
                <div data-testid="review-items">{JSON.stringify(items)}</div>
                <div data-testid="review-photos-count">{String(photosCount)}</div>
                <div data-testid="review-docs-count">{String((docs || []).length)}</div>
                <div data-testid="review-consent">{String(!!consent)}</div>
                <div data-testid="review-archive-consent">{String(!!archiveConsent)}</div>
                <div data-testid="review-total-combined">{String(totalCombinedMB)}</div>
                <div data-testid="review-max-combined">{String(maxCombinedMB)}</div>
                <button onClick={onBack}>review-back</button>
                <button onClick={onConfirm}>{confirmLabel}</button>
            </div>
        ) : null,
}));

const mockedUseFetch = useFetch as jest.Mock;
const mockedUseDispatch = useDispatch as unknown as jest.Mock;
const mockedUseSelector = useSelector as unknown as jest.Mock;
const mockedUseMediaQuery = useMediaQuery as jest.Mock;

const mockedToast = toast as any;
const mockedUid = utils.uid as jest.Mock;
const mockedConvertToBase64 = utils.convertToBase64 as jest.Mock;
const mockedEstimateTotalBase64Bytes = utils.estimateTotalBase64Bytes as jest.Mock;

const FILE_NAME = "Shingwauk And Wawanosh Students Master List";
const CONFIG_KEY = `config_${FILE_NAME}`;

const FORM_CONFIG = {
    addInfo: {
        enabled: true,
        headers: ["First Names", "Last Names"],
        lastname: "Last Names",
        firstname: "First Names",
        required_fields: ["Last Names", "First Names"],
    },
    columns: [
        { name: "Last Names", type: "input", editable: true, display_name: "Last Names" },
        { name: "First Names", type: "input", editable: true, display_name: "First Names" },
        { name: "Indigenous Name/Spirit Name", type: "input", editable: true, display_name: "Indigenous Name/Spirit Name" },
        { name: "First Nation/Community", type: "community_multi", editable: true, display_name: "First Nation/Community" },
        { name: "Mapping Location", type: "input", editable: false, display_name: "Mapping Location" },
        { name: "Parents Names", type: "multi", editable: true, display_name: "Parents Names" },
        { name: "Siblings", type: "multi", editable: true, display_name: "Siblings" },
        { name: "Date of Birth", type: "date", editable: true, display_name: "Date of Birth" },
        { name: "Admitted", type: "date", editable: true, display_name: "Admitted" },
        { name: "Age", type: "input", editable: true, display_name: "Age" },
        { name: "Discharged", type: "date", editable: true, display_name: "Discharged" },
        { name: "Student Number", type: "input", editable: true, display_name: "Student Number" },
        { name: "Additional Information", type: "textarea", editable: true, display_name: "Additional Information" },
        {
            name: "Additional Documents",
            type: "doc_upload",
            editable: true,
            display_name: "Additional Documents",
            consent:
                "I consent to the Shingwauk Residential Schools Centre archiving the additional information and documents I submit.",
            description: "Upload Birth/Death certificates or other relevant files.",
            document_types: [
                { label: "Birth Certificate", value: "birth_certificate" },
                { label: "Death Certificate", value: "death_certificate" },
                { label: "Other Document", value: "other_document" },
            ],
            total_upload_size: true,
            docs_count_enabled: true,
        },
        { name: "Notes", type: "textarea", editable: true, display_name: "Notes" },
        { name: "Deceased?", type: "input", editable: true, display_name: "Deceased?" },
        { name: "Death details", type: "input", editable: true, display_name: "Death details" },
        {
            name: "Photos",
            type: "photo_upload",
            editable: true,
            display_name: "Photos",
            consent:
                "I consent to have the pictures I upload shared and/or used for CSAA publications (newsletters, photo gallery, social media).",
            description: "Upload up to 5 images or 5 MB total.",
            total_upload_size: true,
            docs_count_enabled: false,
        },
        { key: "boarding_home", name: "Boarding Home", type: "form", editable: true, display_name: "Boarding Home" },
    ],
};

const EDIT_ROW = {
    id: "row-1",
    "Last Names": "Doe",
    "First Names": "Jane",
    "Indigenous Name/Spirit Name": "Sky Woman",
    "First Nation/Community": "Garden River, Batchewana",
    "Parents Names": "Anna, Bob",
    Siblings: "Mia",
    "Date of Birth": "1999-12-31",
    Admitted: "2020-01-01",
    Age: "12",
    Discharged: "2021-01-01",
    "Student Number": "42",
    "Additional Information": "Some info",
    Notes: "Some notes",
    "Deceased?": "No",
    "Death details": "",
};

const FILE = {
    id: 49,
    filename: FILE_NAME,
};

const makeFile = (name: string, type: string, size: number) =>
    new File([new Uint8Array(size)], name, { type });

const createState = ({
    configData = { config: FORM_CONFIG, updated_at: "2026-03-04T10:00:00Z" },
    communities = [{ name: "Garden River" }, { name: "Batchewana" }],
    userCommunity = ["Uploader Community"],
}: {
    configData?: any;
    communities?: Array<{ name: string }>;
    userCommunity?: string[];
} = {}) => ({
    auth: {
        user: { community: userCommunity },
        token: "token-1",
    },
    api: {
        entries: {
            [CONFIG_KEY]: {
                data: configData,
                loading: false,
                error: null,
                lastFetchedAt: 0,
            },
            communities: {
                data: { communities },
                loading: false,
                error: null,
                lastFetchedAt: 0,
            },
        },
    },
});

describe("AddInfoForm", () => {
    let mockState: any;
    let dispatchMock: jest.Mock;
    let onClose: jest.Mock;

    let submitFetchState: any;
    let addCommunityFetchState: any;

    const renderForm = (row: any = {}, stateOverride?: any) => {
        mockState = stateOverride || createState();

        mockedUseSelector.mockImplementation((selector: any) => selector(mockState));
        mockedUseDispatch.mockReturnValue(dispatchMock);
        mockedUseMediaQuery.mockReturnValue(false);

        return render(<AddInfoForm row={row} file={FILE} onClose={onClose} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();

        dispatchMock = jest.fn();
        onClose = jest.fn();

        submitFetchState = {
            data: null,
            error: null,
            loading: false,
            fetchData: jest.fn(),
        };

        addCommunityFetchState = {
            data: null,
            error: null,
            loading: false,
            fetchData: jest.fn().mockResolvedValue(undefined),
        };

        mockedUseFetch.mockImplementation((url: string) => {
            if (url.includes("/file/edit/request")) return submitFetchState;
            if (url.endsWith("/communities")) return addCommunityFetchState;
            throw new Error(`Unexpected useFetch url: ${url}`);
        });

        mockedUid
            .mockReturnValueOnce("id-1")
            .mockReturnValueOnce("id-2")
            .mockReturnValueOnce("id-3")
            .mockReturnValueOnce("id-4")
            .mockReturnValueOnce("id-5")
            .mockReturnValueOnce("id-6")
            .mockReturnValueOnce("id-7")
            .mockReturnValue("id-x");

        mockedConvertToBase64.mockImplementation(async (file: File) => `b64:${file.name}`);
        mockedEstimateTotalBase64Bytes.mockReturnValue(1024);
    });

    it("dispatches config ensure and communities ensure on mount (with last_modified)", () => {
        renderForm();

        const calls = dispatchMock.mock.calls.map((c) => c[0]);

        expect(calls).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "api/ensure",
                    payload: expect.objectContaining({
                        key: CONFIG_KEY,
                        method: "GET",
                        url: expect.stringContaining(
                            `http://api.test/config?file_name=${encodeURIComponent(FILE_NAME)}&last_modified=`
                        ),
                    }),
                }),
                expect.objectContaining({
                    type: "api/ensure",
                    payload: {
                        key: "communities",
                        url: "http://api.test/communities",
                        method: "GET",
                    },
                }),
            ])
        );
    });

    it("forces a config refetch when api returns not_modified without any cached config", () => {
        const state = createState({
            configData: { not_modified: true },
        });

        renderForm({}, state);

        expect(screen.getByTestId("loader")).toBeInTheDocument();

        const calls = dispatchMock.mock.calls.map((c) => c[0]);

        expect(calls).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: "api/ensure",
                    payload: expect.objectContaining({
                        key: CONFIG_KEY,
                        method: "GET",
                        url: `http://api.test/config?file_name=${encodeURIComponent(FILE_NAME)}`,
                        force: true,
                    }),
                }),
            ])
        );
    });

    it("returns null when addInfo is disabled", () => {
        const state = createState({
            configData: {
                config: {
                    ...FORM_CONFIG,
                    addInfo: { ...FORM_CONFIG.addInfo, enabled: false },
                },
            },
        });

        renderForm({}, state);

        expect(screen.queryByTestId("mui-dialog")).not.toBeInTheDocument();
        expect(screen.queryByText("Add New Student")).not.toBeInTheDocument();
    });

    it("renders editable supported items in config order and skips non-editable / unsupported rows", () => {
        renderForm();

        expect(screen.getByText("Add New Student")).toBeInTheDocument();

        const order = screen.getAllByTestId("order-node").map((el) => el.getAttribute("data-name"));

        expect(order).toEqual([
            "Last Names",
            "First Names",
            "Indigenous Name/Spirit Name",
            "First Nation/Community",
            "Parents Names",
            "Siblings",
            "Date of Birth",
            "Admitted",
            "Age",
            "Discharged",
            "Student Number",
            "Additional Information",
            "Additional Documents",
            "Notes",
            "Deceased?",
            "Death details",
            "Photos",
        ]);

        expect(screen.queryByTestId("field-row-Mapping Location")).not.toBeInTheDocument();
        expect(screen.queryByText("Boarding Home")).not.toBeInTheDocument();
    });

    it("validates required fields for a new entry before opening review", () => {
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(mockedToast.error).toHaveBeenCalledWith("Last Names is required.");
        expect(screen.queryByTestId("review-dialog")).not.toBeInTheDocument();

        const lastNamesInput = within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row");
        fireEvent.change(lastNamesInput, { target: { value: "Doe" } });

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(mockedToast.error).toHaveBeenCalledWith("First Names is required.");

        const firstNamesInput = within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row");
        fireEvent.change(firstNamesInput, { target: { value: "Jane" } });

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(screen.getByTestId("review-dialog")).toBeInTheDocument();
        expect(screen.getByText("Review New Student")).toBeInTheDocument();
        expect(screen.getByText("Add Student")).toBeInTheDocument();

        expect(screen.getByText("Last Names *")).toBeInTheDocument();
        expect(screen.getByText("First Names *")).toBeInTheDocument();
    });

    it("initializes edit values, normalizes data, tracks changes, resets a single field, and closes on save when nothing changed", () => {
        renderForm(EDIT_ROW);

        const dateInput = within(screen.getByTestId("field-row-Date of Birth")).getByTestId("date-field-row");
        expect(dateInput).toHaveValue("31.12.1999");

        const parentsRow = within(screen.getByTestId("field-row-Parents Names"));
        expect(parentsRow.getByTestId("multi-values")).toHaveTextContent("Anna|Bob");

        const lastNamesInput = within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row");
        fireEvent.change(lastNamesInput, { target: { value: "Smith" } });

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.getByTestId("review-dialog")).toBeInTheDocument();
        expect(screen.getByText("Review Changes – Jane Smith")).toBeInTheDocument();
        expect(screen.getByTestId("review-items")).toHaveTextContent("Smith");

        fireEvent.click(screen.getByText("review-back"));

        fireEvent.click(screen.getByText("reset-Last Names"));
        expect(lastNamesInput).toHaveValue("Doe");

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(mockedToast).toHaveBeenCalledWith("No changes made.");
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("falls back to the original row header when header fields are cleared in edit mode", () => {
        renderForm(EDIT_ROW);

        const lastNamesInput = within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row");
        const firstNamesInput = within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row");

        fireEvent.change(lastNamesInput, { target: { value: "" } });
        fireEvent.change(firstNamesInput, { target: { value: "" } });

        expect(screen.getByText("Add Information – Jane Doe")).toBeInTheDocument();
    });

    it("adds a new community and forces communities refetch", async () => {
        renderForm();

        fireEvent.click(screen.getByText("add-community"));

        await waitFor(() => {
            expect(addCommunityFetchState.fetchData).toHaveBeenCalledWith(
                { communities: ["New Community"] },
                {},
                true
            );
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "api/ensure",
                payload: {
                    key: "communities",
                    url: "http://api.test/communities",
                    method: "GET",
                    force: true,
                },
            })
        );
    });

    it("rejects invalid photo uploads and accepts valid ones (including warning above max photos)", () => {
        renderForm();

        const photoInput = screen.getByTestId("photo-input");

        fireEvent.change(photoInput, {
            target: { files: [makeFile("bad.pdf", "application/pdf", 100)] },
        });
        expect(mockedToast.error).toHaveBeenCalledWith("Only image files are allowed for photos.");
        expect(screen.getByTestId("photo-count")).toHaveTextContent("0");

        fireEvent.change(photoInput, {
            target: { files: [makeFile("huge.jpg", "image/jpeg", 6 * 1024 * 1024)] },
        });
        expect(mockedToast.error).toHaveBeenCalledWith("Photo size limit exceeded (5 MB total).");
        expect(screen.getByTestId("photo-count")).toHaveTextContent("0");

        const sixImages = Array.from({ length: 6 }).map((_, i) =>
            makeFile(`img-${i}.jpg`, "image/jpeg", 100)
        );

        fireEvent.change(photoInput, {
            target: { files: sixImages },
        });

        expect(mockedToast.error).toHaveBeenCalledWith(
            "Upload limit reached. Extra photos will be sent to the CSAA Gallery for review."
        );
        expect(screen.getByTestId("photo-count")).toHaveTextContent("6");

        fireEvent.click(screen.getByText("remove-photo"));
        expect(screen.getByTestId("photo-count")).toHaveTextContent("5");
    });

    it("handles document upload validation, category updates, and removal", () => {
        renderForm();

        const docInput = screen.getByTestId("doc-input");

        fireEvent.change(docInput, {
            target: { files: [] },
        });
        expect(screen.getByTestId("doc-count")).toHaveTextContent("0");

        fireEvent.change(docInput, {
            target: { files: [makeFile("bad.txt", "text/plain", 100)] },
        });
        expect(mockedToast.error).toHaveBeenCalledWith(
            "Only PDF, DOC/DOCX, or image files are allowed for documents."
        );
        expect(screen.getByTestId("doc-count")).toHaveTextContent("0");

        const tooManyDocs = Array.from({ length: MAX_ADDITIONAL_DOCS + 1 }).map((_, i) =>
            makeFile(`doc-${i}.pdf`, "application/pdf", 100)
        );

        fireEvent.change(docInput, {
            target: { files: tooManyDocs },
        });
        expect(mockedToast.error).toHaveBeenCalledWith(
            `You can upload up to ${MAX_ADDITIONAL_DOCS} additional documents.`
        );

        fireEvent.change(docInput, {
            target: { files: [makeFile("too-large.pdf", "application/pdf", 11 * 1024 * 1024)] },
        });
        expect(mockedToast.error).toHaveBeenCalledWith(
            "Additional documents total limit exceeded (10 MB)."
        );

        fireEvent.change(docInput, {
            target: { files: [makeFile("proof.pdf", "application/pdf", 100)] },
        });

        expect(screen.getByTestId("doc-count")).toHaveTextContent("1");
        expect(screen.getByTestId("first-doc-category")).toHaveTextContent("other_document");

        fireEvent.click(screen.getByText("update-doc-category"));
        expect(screen.getByTestId("first-doc-category")).toHaveTextContent("birth_certificate");

        fireEvent.click(screen.getByText("remove-doc"));
        expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
    });

    it("reset all clears new-entry values, files, and consents", () => {
        renderForm();

        const lastNamesInput = within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row");
        const firstNamesInput = within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row");

        fireEvent.change(lastNamesInput, { target: { value: "Doe" } });
        fireEvent.change(firstNamesInput, { target: { value: "Jane" } });

        fireEvent.change(screen.getByTestId("photo-input"), {
            target: { files: [makeFile("img.jpg", "image/jpeg", 100)] },
        });
        fireEvent.change(screen.getByTestId("doc-input"), {
            target: { files: [makeFile("proof.pdf", "application/pdf", 100)] },
        });

        fireEvent.click(screen.getByText("toggle-photo-consent"));
        fireEvent.click(screen.getByText("toggle-archive-consent"));

        expect(screen.getByTestId("photo-count")).toHaveTextContent("1");
        expect(screen.getByTestId("doc-count")).toHaveTextContent("1");
        expect(screen.getByTestId("photo-consent")).toHaveTextContent("true");
        expect(screen.getByTestId("archive-consent")).toHaveTextContent("true");

        fireEvent.click(screen.getByRole("button", { name: "Reset All" }));
        expect(screen.getByTestId("reset-all-dialog")).toBeInTheDocument();

        fireEvent.click(screen.getByText("confirm-reset"));

        expect(lastNamesInput).toHaveValue("");
        expect(firstNamesInput).toHaveValue("");
        expect(screen.getByTestId("photo-count")).toHaveTextContent("0");
        expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
        expect(screen.getByTestId("photo-consent")).toHaveTextContent("false");
        expect(screen.getByTestId("archive-consent")).toHaveTextContent("false");
        expect(screen.queryByTestId("reset-all-dialog")).not.toBeInTheDocument();
    });

    it("reset all restores edit values and clears uploads / changes", () => {
        renderForm(EDIT_ROW);

        const lastNamesInput = within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row");
        fireEvent.change(lastNamesInput, { target: { value: "Changed" } });

        fireEvent.change(screen.getByTestId("photo-input"), {
            target: { files: [makeFile("img.jpg", "image/jpeg", 100)] },
        });
        fireEvent.change(screen.getByTestId("doc-input"), {
            target: { files: [makeFile("proof.pdf", "application/pdf", 100)] },
        });

        fireEvent.click(screen.getByText("toggle-photo-consent"));
        fireEvent.click(screen.getByText("toggle-archive-consent"));

        fireEvent.click(screen.getByRole("button", { name: "Reset All" }));
        fireEvent.click(screen.getByText("confirm-reset"));

        expect(lastNamesInput).toHaveValue("Doe");
        expect(screen.getByTestId("photo-count")).toHaveTextContent("0");
        expect(screen.getByTestId("doc-count")).toHaveTextContent("0");
        expect(screen.getByTestId("photo-consent")).toHaveTextContent("false");
        expect(screen.getByTestId("archive-consent")).toHaveTextContent("false");

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(mockedToast).toHaveBeenCalledWith("No changes made.");
        expect(onClose).toHaveBeenCalled();
    });

    it("builds and submits the correct payload for a new entry", async () => {
        renderForm();

        fireEvent.change(
            within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row"),
            { target: { value: "Doe" } }
        );
        fireEvent.change(
            within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row"),
            { target: { value: "Jane" } }
        );
        fireEvent.change(
            within(screen.getByTestId("field-row-Date of Birth")).getByTestId("date-field-row"),
            { target: { value: "31.12.1999" } }
        );

        fireEvent.click(screen.getByText("change-community"));
        fireEvent.click(screen.getByText("seed-photo-state"));

        fireEvent.change(screen.getByTestId("doc-input"), {
            target: { files: [makeFile("proof.pdf", "application/pdf", 100)] },
        });
        fireEvent.click(screen.getByText("update-doc-category"));

        fireEvent.click(screen.getByText("toggle-photo-consent"));
        fireEvent.click(screen.getByText("toggle-archive-consent"));

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(screen.getByTestId("review-dialog")).toBeInTheDocument();
        expect(screen.getByText("Review New Student")).toBeInTheDocument();
        expect(screen.getByTestId("review-photos-count")).toHaveTextContent("6");
        expect(screen.getByTestId("review-docs-count")).toHaveTextContent("1");
        expect(screen.getByTestId("review-consent")).toHaveTextContent("true");
        expect(screen.getByTestId("review-archive-consent")).toHaveTextContent("true");

        fireEvent.click(screen.getByText("Add Student"));

        await waitFor(() => {
            expect(submitFetchState.fetchData).toHaveBeenCalledTimes(1);
        });

        const payload = submitFetchState.fetchData.mock.calls[0][0];

        expect(payload).toEqual(
            expect.objectContaining({
                file_id: 49,
                filename: FILE_NAME,
                is_edited: false,
                row_id: null,
                firstname: "Jane",
                lastname: "Doe",
                consent: true,
                archive_consent: true,
                community: ["Garden River", "Batchewana"],
                uploader_community: ["Uploader Community"],
            })
        );

        expect(payload.photos_in_app).toHaveLength(5);
        expect(payload.photos_for_gallery_review).toHaveLength(1);
        expect(payload.photos_in_app[0].comment).toHaveLength(100);

        expect(payload.documents).toHaveLength(1);
        expect(payload.documents[0]).toEqual(
            expect.objectContaining({
                document_type: "document",
                document_category: "birth_certificate",
                filename: "proof.pdf",
                mime_type: "application/pdf",
                data_base64: "b64:proof.pdf",
            })
        );

        expect(payload.changes.new).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    row_id: null,
                    field_name: "Date of Birth",
                    old_value: "",
                    new_value: "31.12.1999",
                }),
            ])
        );

        expect(screen.queryByTestId("review-dialog")).not.toBeInTheDocument();
    });

    it("builds and submits the correct payload for edits (including multi and invalid date normalization)", async () => {
        renderForm(EDIT_ROW);

        fireEvent.change(
            within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row"),
            { target: { value: "Smith" } }
        );

        fireEvent.click(
            within(screen.getByTestId("field-row-Parents Names")).getByRole("button", { name: "Add Name" })
        );

        fireEvent.change(
            within(screen.getByTestId("field-row-Admitted")).getByTestId("date-field-row"),
            { target: { value: "bad-date" } }
        );

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(screen.getByText("Review Changes – Jane Smith")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Submit Changes"));

        await waitFor(() => {
            expect(submitFetchState.fetchData).toHaveBeenCalledTimes(1);
        });

        const payload = submitFetchState.fetchData.mock.calls[0][0];

        expect(payload).toEqual(
            expect.objectContaining({
                file_id: 49,
                filename: FILE_NAME,
                is_edited: true,
                row_id: "row-1",
                firstname: "Jane",
                lastname: "Doe",
            })
        );

        expect(payload.changes["row-1"]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    row_id: "row-1",
                    field_name: "Last Names",
                    old_value: "Doe",
                    new_value: "Smith",
                }),
                expect.objectContaining({
                    row_id: "row-1",
                    field_name: "Parents Names",
                    old_value: "Anna, Bob",
                    new_value: "Alpha, Beta",
                }),
                expect.objectContaining({
                    row_id: "row-1",
                    field_name: "Admitted",
                    old_value: "2020-01-01",
                    new_value: "",
                }),
            ])
        );

        expect(screen.queryByTestId("review-dialog")).not.toBeInTheDocument();
    });

    it("stops submit when estimated base64 payload is too large", async () => {
        mockedEstimateTotalBase64Bytes.mockReturnValueOnce(26 * 1024 * 1024);

        renderForm();

        fireEvent.change(
            within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row"),
            { target: { value: "Doe" } }
        );
        fireEvent.change(
            within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row"),
            { target: { value: "Jane" } }
        );

        fireEvent.click(screen.getByText("seed-photo-state"));

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        fireEvent.click(screen.getByText("Add Student"));

        expect(mockedToast.error).toHaveBeenCalledWith(
            "Upload too large for a single request. Please reduce file sizes/count."
        );
        expect(submitFetchState.fetchData).not.toHaveBeenCalled();
        expect(screen.getByTestId("review-dialog")).toBeInTheDocument();
    });

    it("shows an error toast when base64 conversion fails during submit", async () => {
        mockedConvertToBase64.mockRejectedValueOnce(new Error("File read error"));

        renderForm();

        fireEvent.change(
            within(screen.getByTestId("field-row-Last Names")).getByTestId("text-field-row"),
            { target: { value: "Doe" } }
        );
        fireEvent.change(
            within(screen.getByTestId("field-row-First Names")).getByTestId("text-field-row"),
            { target: { value: "Jane" } }
        );

        fireEvent.click(screen.getByText("seed-photo-state"));

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        fireEvent.click(screen.getByText("Add Student"));

        await waitFor(() => {
            expect(mockedToast.error).toHaveBeenCalledWith("File read error");
        });

        expect(submitFetchState.fetchData).not.toHaveBeenCalled();
        expect(screen.getByTestId("review-dialog")).toBeInTheDocument();
    });

    it("shows success toast and closes when submit hook returns success for a new entry", () => {
        const view = renderForm();

        submitFetchState.data = { ok: true };
        view.rerender(<AddInfoForm row={{}} file={FILE} onClose={onClose} />);

        expect(mockedToast.success).toHaveBeenCalledWith(
            "Student added successfully and sent for review."
        );
        expect(onClose).toHaveBeenCalled();
    });

    it("shows error toast when submit hook returns an error", () => {
        const view = renderForm(EDIT_ROW);

        submitFetchState.error = "boom";
        view.rerender(<AddInfoForm row={EDIT_ROW} file={FILE} onClose={onClose} />);

        expect(mockedToast.error).toHaveBeenCalledWith("Error submitting data: boom");
    });

    it("renders the edit loading overlay when submit is in progress", () => {
        submitFetchState.loading = true;

        renderForm(EDIT_ROW);

        expect(screen.getByTestId("loader")).toHaveTextContent("true|");
        expect(screen.getByTestId("mui-dialog")).toBeInTheDocument();
    });
});
