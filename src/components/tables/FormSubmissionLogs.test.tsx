import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import FormSubmissionLogs from "./FormSubmissionLogs";

const mockUseFetch = jest.fn();
let lastGridProps: any = null;

jest.mock("@mui/material", () => {
    const React = require("react");

    const sanitize = (label: string) =>
        String(label || "autocomplete")
            .toLowerCase()
            .replace(/\s+/g, "-");

    return {
        __esModule: true,
        Box: ({ children }: any) => <div>{children}</div>,
        Button: ({ children, onClick, disabled }: any) => (
            <button type="button" onClick={onClick} disabled={disabled}>
                {children}
            </button>
        ),
        Chip: ({ label }: any) => <div>{label}</div>,
        Divider: () => <hr />,
        IconButton: ({ children, onClick, title }: any) => (
            <button type="button" onClick={onClick} title={title}>
                {children}
            </button>
        ),
        TextField: ({ label, value, onChange, placeholder = "" }: any) => (
            <label>
                <span>{label}</span>
                <input
                    aria-label={label}
                    value={value ?? ""}
                    placeholder={placeholder}
                    onChange={onChange}
                />
            </label>
        ),
        Autocomplete: (props: any) => {
            const input = props.renderInput ? props.renderInput({}) : null;
            const label = input?.props?.label || "autocomplete";
            const id = sanitize(label);
            const getOptionLabel =
                props.getOptionLabel || ((option: any) => option?.label || option?.key || "");

            const currentValue = props.multiple
                ? (props.value || []).map((v: any) => getOptionLabel(v)).join(", ")
                : props.value
                    ? getOptionLabel(props.value)
                    : "";

            return (
                <div data-testid={`autocomplete-${id}`}>
                    {input}
                    <div data-testid={`autocomplete-${id}-disabled`}>{String(!!props.disabled)}</div>
                    <div data-testid={`autocomplete-${id}-loading`}>{String(!!props.loading)}</div>
                    <div data-testid={`autocomplete-${id}-value`}>{currentValue}</div>

                    {Array.isArray(props.options) && props.options.length > 0 ? (
                        props.options.map((option: any, index: number) => (
                            <button
                                key={`${id}-${index}-${getOptionLabel(option)}`}
                                type="button"
                                disabled={!!props.disabled}
                                data-testid={`autocomplete-${id}-option-${index}`}
                                onClick={() => {
                                    if (props.multiple) {
                                        const prev = Array.isArray(props.value) ? props.value : [];
                                        const exists = prev.some((v: any) =>
                                            props.isOptionEqualToValue
                                                ? props.isOptionEqualToValue(option, v)
                                                : v === option
                                        );
                                        const next = exists
                                            ? prev.filter((v: any) =>
                                                props.isOptionEqualToValue
                                                    ? !props.isOptionEqualToValue(option, v)
                                                    : v !== option
                                            )
                                            : [...prev, option];

                                        props.onChange?.(null, next);
                                    } else {
                                        props.onChange?.(null, option);
                                    }
                                }}
                            >
                                {getOptionLabel(option)}
                            </button>
                        ))
                    ) : (
                        <div data-testid={`autocomplete-${id}-no-options`}>
                            {props.noOptionsText || "No options"}
                        </div>
                    )}

                    <button
                        type="button"
                        data-testid={`autocomplete-${id}-clear`}
                        onClick={() => props.onChange?.(null, props.multiple ? [] : null)}
                    >
                        clear
                    </button>
                </div>
            );
        },
    };
});

jest.mock("@mui/icons-material/ExpandLess", () => ({
    __esModule: true,
    default: () => <span>expand-less-icon</span>,
}));

jest.mock("@mui/icons-material/Tune", () => ({
    __esModule: true,
    default: () => <span>tune-icon</span>,
}));

jest.mock("../../hooks/useFetch", () => ({
    __esModule: true,
    default: (url: string, method: string, immediate: boolean) =>
        mockUseFetch(url, method, immediate),
}));

jest.mock("../Loader", () => ({
    __esModule: true,
    default: ({ loading }: any) => <div data-testid="loader">{String(loading)}</div>,
}));

jest.mock("../../config/api", () => ({
    __esModule: true,
    API_BASE: "/api",
}));

jest.mock("../../domain/forms/statusOptions", () => ({
    __esModule: true,
    FORM_SUBMISSION_STATUS_OPTIONS: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
    ],
}));

jest.mock("../datatable/config-form-modal.tsx/ConfigFormModal", () => ({
    __esModule: true,
    default: (props: any) => (
        <div data-testid="config-form-modal">
            <div data-testid="cfg-open">{String(props.open)}</div>
            <div data-testid="cfg-row-id">{String(props.row?.id ?? "")}</div>
            <div data-testid="cfg-file-id">{String(props.file?.id ?? "")}</div>
            <div data-testid="cfg-file-name">{String(props.file?.filename ?? "")}</div>
            <div data-testid="cfg-form-key">{String(props.formConfig?.key ?? "")}</div>
            <div data-testid="cfg-fetch-submission-id">{String(props.fetchSubmissionId ?? "")}</div>
            <div data-testid="cfg-editable">{String(props.isEditable)}</div>
            <div data-testid="cfg-addinfo-firstname">
                {String(props.addInfoConfig?.firstname ?? "")}
            </div>
            <button type="button" onClick={props.onClose}>
                Close Modal
            </button>
        </div>
    ),
}));

jest.mock("./FormSubmissionGrid", () => ({
    __esModule: true,
    default: (props: any) => {
        lastGridProps = props;

        return (
            <div data-testid="form-submission-grid">
                <div data-testid="grid-title">{props.title}</div>
                <div data-testid="grid-page">
                    {String(props.currentPage)}/{String(props.totalPages)}
                </div>
                <div data-testid="grid-rows">{String(props.rows?.length ?? 0)}</div>
                <button type="button" onClick={props.onPrev}>
                    Grid Prev
                </button>
                <button type="button" onClick={props.onNext}>
                    Grid Next
                </button>
                <button
                    type="button"
                    onClick={() => props.rows?.[0] && props.onOpenDetails(props.rows[0])}
                >
                    Open First Details
                </button>
            </div>
        );
    },
}));

describe("FormSubmissionLogs", () => {
    let hookState: any;

    const searchItems = [
        {
            id: 1,
            file_id: 501,
            row_id: 9001,
            file_name: "z-file.csv",
            form_key: "boarding_form",
            form_label: "Boarding Form",
            first_name: "Athul",
            last_name: "Narayanan",
            created_by: "creator@example.com",
            edited_by: "editor@example.com",
            reviewed_by: "reviewer@example.com",
            status: "pending",
            created_at: "2026-03-12T10:00:00Z",
            updated_at: "2026-03-12T12:00:00Z",
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        lastGridProps = null;

        hookState = {
            search: {
                loading: false,
                data: null,
                fetchData: jest.fn(),
            },
            files: {
                loading: false,
                data: null,
                fetchData: jest.fn(),
            },
            forms: {
                loading: false,
                data: null,
                fetchData: jest.fn(),
            },
            config: {
                loading: false,
                data: null,
                fetchData: jest.fn(),
            },
        };

        mockUseFetch.mockImplementation((url: string, method: string) => {
            if (method === "POST" && url === "/api/form/search") return hookState.search;
            if (method === "GET" && url === "/api/file") return hookState.files;
            if (method === "GET" && url.startsWith("/api/form")) return hookState.forms;
            if (method === "GET" && url.startsWith("/api/config")) return hookState.config;

            throw new Error(`Unexpected useFetch call: ${method} ${url}`);
        });
    });

    it("fetches files and initial submissions on mount and shows loader when any request is loading", async () => {
        hookState.search.loading = true;

        render(<FormSubmissionLogs />);

        expect(screen.getByTestId("loader")).toHaveTextContent("true");

        await waitFor(() => {
            expect(hookState.files.fetchData).toHaveBeenCalledTimes(1);
            expect(hookState.search.fetchData).toHaveBeenCalledWith({
                page: 1,
                page_size: 20,
            });
        });

        expect(screen.getByTestId("grid-title")).toHaveTextContent("Form Submission Logs");
    });

    it("uses initial search response to populate grid and collapses filters after the first search", async () => {
        hookState.search.data = {
            page: 2,
            page_size: 20,
            total_items: 1,
            total_pages: 4,
            items: searchItems,
        };

        render(<FormSubmissionLogs />);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Edit search" })).toBeInTheDocument();
        });

        expect(screen.getByText("Search (0 filters)")).toBeInTheDocument();
        expect(screen.getByTestId("grid-page")).toHaveTextContent("2/4");
        expect(screen.getByTestId("grid-rows")).toHaveTextContent("1");

        fireEvent.click(screen.getByRole("button", { name: "Edit search" }));

        expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
        expect(screen.getByTitle("Collapse filters")).toBeInTheDocument();
    });

    it("sorts file options, fetches forms when a file is selected, and maps form options from API in sorted order", async () => {
        hookState.files.data = {
            files: [
                { id: 2, filename: "z-file.csv" },
                { id: 1, filename: "a-file.csv" },
            ],
        };

        const view = render(<FormSubmissionLogs />);

        expect(screen.getByTestId("autocomplete-file-option-0")).toHaveTextContent("a-file.csv");
        expect(screen.getByTestId("autocomplete-file-option-1")).toHaveTextContent("z-file.csv");

        fireEvent.click(screen.getByTestId("autocomplete-file-option-1"));

        await waitFor(() => {
            expect(hookState.forms.fetchData).toHaveBeenCalledTimes(1);
        });

        expect(mockUseFetch).toHaveBeenCalledWith("/api/form?file_id=2", "GET", false);

        act(() => {
            hookState.forms.data = [
                {
                    id: 1,
                    file_name: "z-file.csv",
                    file_id: 2,
                    form_key: "z_form",
                    form_name: "Z Form",
                },
                {
                    id: 2,
                    file_name: "z-file.csv",
                    file_id: 2,
                    form_key: "a_form",
                    form_name: "A Form",
                },
            ];
            view.rerender(<FormSubmissionLogs />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("autocomplete-form-type-option-0")).toHaveTextContent("A Form");
            expect(screen.getByTestId("autocomplete-form-type-option-1")).toHaveTextContent("Z Form");
        });
    });

 it("applies all filters, collapses filters, and shows summary chips including +more", async () => {
        hookState.files.data = {
            files: [{ id: 9, filename: "students.csv" }],
        };

        const view = render(<FormSubmissionLogs />);

        fireEvent.click(screen.getByTestId("autocomplete-file-option-0"));

        await waitFor(() => {
            expect(hookState.forms.fetchData).toHaveBeenCalledTimes(1);
        });

        act(() => {
            hookState.forms.data = [
                {
                    id: 1,
                    file_name: "students.csv",
                    file_id: 9,
                    form_key: "boarding_form",
                    form_name: "Boarding Form",
                },
            ];
            view.rerender(<FormSubmissionLogs />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("autocomplete-form-type-option-0")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("autocomplete-form-type-option-0"));

        fireEvent.change(screen.getByLabelText("First Name"), {
            target: { value: " Athul " },
        });
        fireEvent.change(screen.getByLabelText("Last Name"), {
            target: { value: " Narayanan " },
        });

        fireEvent.click(screen.getByTestId("autocomplete-status-option-0"));
        fireEvent.click(screen.getByTestId("autocomplete-status-option-1"));
        fireEvent.click(screen.getByTestId("autocomplete-status-option-2"));

        fireEvent.click(screen.getByRole("button", { name: "Apply" }));

        await waitFor(() => {
            expect(hookState.search.fetchData).toHaveBeenLastCalledWith({
                page: 1,
                page_size: 20,
                file_id: 9,
                form_key: "boarding_form",
                first_name: "Athul",
                last_name: "Narayanan",
                status: ["pending", "approved", "rejected"],
            });
        });

        expect(screen.getByText("Search (5 filters)")).toBeInTheDocument();
        expect(screen.getByText("File: students.csv")).toBeInTheDocument();
        expect(screen.getByText("Form type: Boarding Form")).toBeInTheDocument();
        expect(screen.getByText("+3 more")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Edit search" })).toBeInTheDocument();
    });

    it("shows singular wording when exactly one filter is applied", async () => {
        hookState.files.data = {
            files: [{ id: 7, filename: "one-file.csv" }],
        };

        render(<FormSubmissionLogs />);

        fireEvent.click(screen.getByTestId("autocomplete-file-option-0"));
        fireEvent.click(screen.getByRole("button", { name: "Apply" }));

        await waitFor(() => {
            expect(hookState.search.fetchData).toHaveBeenLastCalledWith({
                page: 1,
                page_size: 20,
                file_id: 7,
            });
        });

        expect(screen.getByText("Search (1 filter)")).toBeInTheDocument();
        expect(screen.getByText("File: one-file.csv")).toBeInTheDocument();
    });

    it("resets filters, clears dependent selections, and fetches the first page again", async () => {
        hookState.files.data = {
            files: [{ id: 9, filename: "students.csv" }],
        };

        const view = render(<FormSubmissionLogs />);

        fireEvent.click(screen.getByTestId("autocomplete-file-option-0"));

        await waitFor(() => {
            expect(hookState.forms.fetchData).toHaveBeenCalledTimes(1);
        });

        act(() => {
            hookState.forms.data = [
                {
                    id: 1,
                    file_name: "students.csv",
                    file_id: 9,
                    form_key: "boarding_form",
                    form_name: "Boarding Form",
                },
            ];
            view.rerender(<FormSubmissionLogs />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("autocomplete-form-type-option-0")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId("autocomplete-form-type-option-0"));
        fireEvent.change(screen.getByLabelText("First Name"), {
            target: { value: "Athul" },
        });
        fireEvent.change(screen.getByLabelText("Last Name"), {
            target: { value: "Narayanan" },
        });
        fireEvent.click(screen.getByTestId("autocomplete-status-option-0"));

        expect(screen.getByTestId("autocomplete-file-value")).toHaveTextContent("students.csv");
        expect(screen.getByTestId("autocomplete-form-type-value")).toHaveTextContent("Boarding Form");
        expect(screen.getByTestId("autocomplete-status-value")).toHaveTextContent("Pending");

        fireEvent.click(screen.getByRole("button", { name: "Reset" }));

        await waitFor(() => {
            expect(hookState.search.fetchData).toHaveBeenLastCalledWith({
                page: 1,
                page_size: 20,
            });
        });

        expect(screen.getByLabelText("First Name")).toHaveValue("");
        expect(screen.getByLabelText("Last Name")).toHaveValue("");
        expect(screen.getByTestId("autocomplete-file-value")).toHaveTextContent("");
        expect(screen.getByTestId("autocomplete-form-type-value")).toHaveTextContent("");
        expect(screen.getByTestId("autocomplete-status-value")).toHaveTextContent("");
        expect(screen.getByTestId("autocomplete-form-type-no-options")).toHaveTextContent(
            "Select file first"
        );
    });

    it("collapses filters with the icon button", () => {
        render(<FormSubmissionLogs />);

        expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Collapse filters"));

        expect(screen.getByRole("button", { name: "Edit search" })).toBeInTheDocument();
    });

    it("uses grid pagination callbacks to fetch previous and next pages", async () => {
        hookState.search.data = {
            page: 2,
            page_size: 20,
            total_items: 1,
            total_pages: 3,
            items: searchItems,
        };

        render(<FormSubmissionLogs />);

        await waitFor(() => {
            expect(screen.getByTestId("grid-page")).toHaveTextContent("2/3");
        });

        hookState.search.fetchData.mockClear();

        fireEvent.click(screen.getByRole("button", { name: "Grid Prev" }));
        fireEvent.click(screen.getByRole("button", { name: "Grid Next" }));

        expect(hookState.search.fetchData).toHaveBeenNthCalledWith(1, {
            page: 1,
            page_size: 20,
        });
        expect(hookState.search.fetchData).toHaveBeenNthCalledWith(2, {
            page: 3,
            page_size: 20,
        });
    });

    it("opens details modal when config contains a matching form config and closes it", async () => {
        hookState.search.data = {
            page: 1,
            page_size: 20,
            total_items: 1,
            total_pages: 1,
            items: searchItems,
        };

        const view = render(<FormSubmissionLogs />);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Open First Details" })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Open First Details" }));

        await waitFor(() => {
            expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
        });

        expect(mockUseFetch).toHaveBeenCalledWith(
            "/api/config?file_name=z-file.csv",
            "GET",
            false
        );

        act(() => {
            hookState.config.data = {
                config: {
                    addInfo: {
                        firstname: "first_name",
                        lastname: "last_name",
                    },
                    columns: [
                        {
                            type: "form",
                            key: "boarding_form",
                            display_name: "Boarding Form",
                        },
                    ],
                },
            };
            view.rerender(<FormSubmissionLogs />);
        });

        await waitFor(() => {
            expect(screen.getByTestId("config-form-modal")).toBeInTheDocument();
        });

        expect(screen.getByTestId("cfg-open")).toHaveTextContent("true");
        expect(screen.getByTestId("cfg-row-id")).toHaveTextContent("9001");
        expect(screen.getByTestId("cfg-file-id")).toHaveTextContent("501");
        expect(screen.getByTestId("cfg-file-name")).toHaveTextContent("z-file.csv");
        expect(screen.getByTestId("cfg-form-key")).toHaveTextContent("boarding_form");
        expect(screen.getByTestId("cfg-fetch-submission-id")).toHaveTextContent("1");
        expect(screen.getByTestId("cfg-editable")).toHaveTextContent("false");
        expect(screen.getByTestId("cfg-addinfo-firstname")).toHaveTextContent("first_name");

        fireEvent.click(screen.getByRole("button", { name: "Close Modal" }));

        expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();
    });

    it("logs an error and does not open the modal when matching config is missing", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        hookState.search.data = {
            page: 1,
            page_size: 20,
            total_items: 1,
            total_pages: 1,
            items: searchItems,
        };

        const view = render(<FormSubmissionLogs />);

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Open First Details" })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: "Open First Details" }));

        await waitFor(() => {
            expect(hookState.config.fetchData).toHaveBeenCalledTimes(1);
        });

        act(() => {
            hookState.config.data = {
                config: {
                    addInfo: { firstname: "first_name" },
                    columns: [
                        {
                            type: "form",
                            key: "some_other_form",
                            display_name: "Other Form",
                        },
                    ],
                },
            };
            view.rerender(<FormSubmissionLogs />);
        });

        await waitFor(() => {
            expect(errorSpy).toHaveBeenCalledWith(
                "No matching form config found for form_key:",
                "boarding_form"
            );
        });

        expect(screen.queryByTestId("config-form-modal")).not.toBeInTheDocument();

        errorSpy.mockRestore();
    });
});
