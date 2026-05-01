import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import AdditionalDocsCard from "./AdditionalDocsCard";
import {
    ACCEPT_DOCS,
    MAX_ADDITIONAL_DOCS,
    MAX_ADDITIONAL_DOCS_TOTAL_MB,
    MAX_COMBINED_UPLOAD_MB,
} from "./constants";

const makeFile = (name = "sample.pdf", type = "application/pdf") =>
    new File(["file-content"], name, { type });

const getProps = (overrides: Partial<React.ComponentProps<typeof AdditionalDocsCard>> = {}) => ({
    additionalDocs: [],
    totalAdditionalDocsMB: 0,
    totalCombinedMB: 0,
    onUpload: jest.fn(),
    onRemove: jest.fn(),
    onUpdateCategory: jest.fn(),
    archiveConsent: false,
    setArchiveConsent: jest.fn(),
    ...overrides,
});

describe("AdditionalDocsCard", () => {
    it("renders title, description, and upload stats", () => {
        render(
            <AdditionalDocsCard
                {...getProps({
                    additionalDocs: [
                        {
                            id: "1", file: makeFile("one.pdf"), document_category: "death_certificate",
                            document_type: "document"
                        },
                        {
                            id: "2", file: makeFile("two.pdf"), document_category: "death_certificate",
                            document_type: "document"
                        },
                    ],
                    totalAdditionalDocsMB: 1.5,
                    totalCombinedMB: 3.25,
                    config: {
                        display_name: "Extra Files",
                        description: "Upload supporting documents here.",
                    },
                })}
            />
        );

        expect(screen.getByText("Extra Files")).toBeInTheDocument();
        expect(screen.getByText(/Upload supporting documents here\./i)).toBeInTheDocument();
        expect(screen.getByText("Docs:")).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`2/${MAX_ADDITIONAL_DOCS}`))).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`1\\.50 MB / ${MAX_ADDITIONAL_DOCS_TOTAL_MB} MB`))).toBeInTheDocument();
        expect(screen.getByText("Total upload (photos + docs):")).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`3\\.25 MB / ${MAX_COMBINED_UPLOAD_MB} MB`))).toBeInTheDocument();
    });

    it("falls back to default title when config title is missing", () => {
        render(<AdditionalDocsCard {...getProps()} />);

        expect(screen.getByText("Additional Documents")).toBeInTheDocument();
    });

    it("hides docs count and total upload text when disabled in config", () => {
        render(
            <AdditionalDocsCard
                {...getProps({
                    config: {
                        description: "Only description",
                        docs_count_enabled: false,
                        total_upload_size: false,
                    },
                })}
            />
        );

        expect(screen.getByText(/Only description/i)).toBeInTheDocument();
        expect(screen.queryByText("Docs:")).not.toBeInTheDocument();
        expect(screen.queryByText(/Total upload \(photos \+ docs\):/i)).not.toBeInTheDocument();
    });

    it("calls onUpload when files are selected", () => {
        const props = getProps();
        const { container } = render(<AdditionalDocsCard {...props} />);

        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = makeFile();

        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute("accept", ACCEPT_DOCS);
        expect(fileInput).toHaveAttribute("multiple");

        fireEvent.change(fileInput, {
            target: { files: [file] },
        });

        expect(props.onUpload).toHaveBeenCalledTimes(1);
    });

    it("renders text input category field and updates/removes a document", () => {
        const props = getProps({
            additionalDocs: [
                {
                    id: "1", file: makeFile("report.pdf"), document_category: "death_certificate",
                    document_type: "document"
                },
            ],
        });

        render(<AdditionalDocsCard {...props} />);

        expect(screen.getByText("report.pdf")).toBeInTheDocument();

        const categoryInput = screen.getByDisplayValue("death_certificate");
        fireEvent.change(categoryInput, { target: { value: "School" } });

        expect(props.onUpdateCategory).toHaveBeenCalledWith("1", "School");

        fireEvent.click(screen.getByRole("button", { name: /remove/i }));
        expect(props.onRemove).toHaveBeenCalledWith("1");
    });

    it("renders preset category select and updates category from dropdown", async () => {
        const props = getProps({
            additionalDocs: [
                {
                    id: "1",
                    file: makeFile("doc.pdf"),
                    document_category: "death_certificate",
                    document_type: "document",
                },
            ],
            config: {
                document_types: [
                    { value: "legal", label: "Legal" },
                    { value: "", label: "Invalid Option" } as any,
                    { value: "medical", label: "Medical" },
                ],
            },
        });

        render(<AdditionalDocsCard {...props} />);

        const select = screen.getByRole("combobox");
        fireEvent.mouseDown(select);

        const listbox = await screen.findByRole("listbox");
        expect(within(listbox).getByText("Legal")).toBeInTheDocument();
        expect(within(listbox).getByText("Medical")).toBeInTheDocument();
        expect(within(listbox).queryByText("Invalid Option")).not.toBeInTheDocument();

        fireEvent.click(within(listbox).getByText("Medical"));

        expect(props.onUpdateCategory).toHaveBeenCalledWith("1", "medical");
    })

    it("renders consent checkbox and calls setArchiveConsent on change", () => {
        const props = getProps({
            archiveConsent: false,
            config: {
                consent: "I agree to archive these files.",
            },
        });

        render(<AdditionalDocsCard {...props} />);

        expect(screen.getByText("I agree to archive these files.")).toBeInTheDocument();

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        expect(props.setArchiveConsent).toHaveBeenCalledWith(true);
    });

    it("shows the disclaimer only after archive consent is selected", () => {
        const disclaimer =
            "Archived documents may be reviewed by staff as part of the historical record.";

        const { rerender } = render(
            <AdditionalDocsCard
                {...getProps({
                    archiveConsent: false,
                    config: { disclaimer },
                })}
            />
        );

        expect(screen.queryByText("Disclaimer")).not.toBeInTheDocument();
        expect(screen.queryByText(disclaimer)).not.toBeInTheDocument();

        rerender(
            <AdditionalDocsCard
                {...getProps({
                    archiveConsent: true,
                    config: { disclaimer },
                })}
            />
        );

        expect(screen.getByText("Disclaimer")).toBeInTheDocument();
        expect(screen.getByText(disclaimer)).toBeInTheDocument();
        expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("does not render consent checkbox when consent text is empty", () => {
        render(
            <AdditionalDocsCard
                {...getProps({
                    config: {
                        consent: "   ",
                    },
                })}
            />
        );

        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
});
