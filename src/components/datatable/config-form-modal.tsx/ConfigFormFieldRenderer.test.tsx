import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ConfigFormFieldRenderer from "./ConfigFormFieldRenderer";

const mockAdditionalDocsCard = jest.fn();
const mockPhotoUploadCard = jest.fn();

jest.mock("../../datatable/add-info-dialog/AdditionalDocsCard", () => ({
    __esModule: true,
    default: (props: unknown) => {
        mockAdditionalDocsCard(props);
        return <div data-testid="additional-docs-card" />;
    },
}));

jest.mock("../../datatable/add-info-dialog/PhotoUploadCard", () => ({
    __esModule: true,
    default: (props: unknown) => {
        mockPhotoUploadCard(props);
        return <div data-testid="photo-upload-card" />;
    },
}));

jest.mock("./shared", () => ({
    __esModule: true,
    inputSx: {},
    missingWrapSx: {},
    requiredBadge: "*",
}));

jest.mock("../../../constants/colors", () => ({
    color_error: "red",
    color_focus_ring: "blue",
    color_secondary: "green",
    color_secondary_dark: "darkgreen",
    color_text_primary: "black",
    color_white: "white",
}));

type Props = React.ComponentProps<typeof ConfigFormFieldRenderer>;
type Field = Props["field"];
type AdditionalDoc = Props["additionalDocs"][number];
type Photo = Props["photos"][number];

describe("boarding_home_tab", () => {
    const makeField = (overrides: Record<string, unknown> = {}): Field =>
        ({
            key: "boarding_home",
            name: "boarding_home",
            display_name: "Boarding Home",
            label: "Boarding home",
            type: "text",
            placeholder: "Enter boarding home",
            description: "Field description",
            consent: "Field level consent",
            disclaimer: "Field level disclaimer",
            docs_count_enabled: true,
            total_upload_size: true,
            individual_upload_size: true,
            document_types: ["pdf", "jpg"],
            values: ["Yes", "No"],
            ...overrides,
        }) as unknown as Field;

    const createDoc = (): AdditionalDoc =>
        ({
            id: "1",
            file_name: "doc1.pdf",
            file: new File(["dummy"], "doc1.pdf", { type: "application/pdf" }),
            document_type: "pdf",
            document_category: "general",
        }) as unknown as AdditionalDoc;

    const createPhoto = (): Photo =>
        ({
            file_name: "photo1.jpg",
        }) as unknown as Photo;

    const getProps = (overrides: Partial<Props> = {}): Props =>
        ({
            field: makeField(),
            formConsentText: undefined,
            editable: true,
            value: "",
            required: false,
            isMissing: false,

            consentGiven: false,
            setConsentGiven: jest.fn() as Props["setConsentGiven"],

            additionalDocs: [createDoc()],
            photos: [createPhoto()],
            totalCombinedMB: 6,

            onSetField: jest.fn() as Props["onSetField"],
            onDocsUpload: jest.fn() as Props["onDocsUpload"],
            onDocRemove: jest.fn() as Props["onDocRemove"],
            onDocCategory: jest.fn() as Props["onDocCategory"],
            onPhotosUpload: jest.fn() as Props["onPhotosUpload"],
            onPhotoRemove: jest.fn() as Props["onPhotoRemove"],
            onPhotosChange: jest.fn() as Props["onPhotosChange"],

            getDocsMB: jest.fn(() => 2) as Props["getDocsMB"],
            renderExistingDocumentsGrid: jest.fn(() => (
                <div data-testid="existing-docs-grid">Existing docs</div>
            )) as Props["renderExistingDocumentsGrid"],
            renderExistingPhotosGrid: jest.fn(() => (
                <div data-testid="existing-photos-grid">Existing photos</div>
            )) as Props["renderExistingPhotosGrid"],

            ...overrides,
        }) as Props;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders doc upload branch with AdditionalDocsCard and passes computed props", () => {
        const props = getProps({
            field: makeField({ type: "doc_upload" }),
            isMissing: true,
            consentGiven: true,
        });

        render(<ConfigFormFieldRenderer {...props} />);

        expect(screen.getByTestId("additional-docs-card")).toBeInTheDocument();
        expect(screen.getByTestId("existing-docs-grid")).toBeInTheDocument();
        expect(screen.getByText("This field is required.")).toBeInTheDocument();

        expect(props.getDocsMB).toHaveBeenCalledWith(props.additionalDocs);
        expect(props.renderExistingDocumentsGrid).toHaveBeenCalledWith("boarding_home");

        const childProps = mockAdditionalDocsCard.mock.calls[0][0] as Record<string, unknown>;

        expect(childProps.additionalDocs).toEqual(props.additionalDocs);
        expect(childProps.totalAdditionalDocsMB).toBe(2);
        expect(childProps.totalCombinedMB).toBe(6);
        expect(childProps.archiveConsent).toBe(true);
        expect(childProps.setArchiveConsent).toBe(props.setConsentGiven);
        expect(childProps.config).toMatchObject({
            name: "boarding_home",
            display_name: "Boarding Home",
            type: "doc_upload",
            description: "Field description",
            consent: "Field level consent",
            disclaimer: "Field level disclaimer",
            docs_count_enabled: true,
            total_upload_size: true,
            individual_upload_size: true,
            document_types: ["pdf", "jpg"],
        });
    });

    it("uses empty consent in doc upload config when formConsentText is provided", () => {
        const props = getProps({
            field: makeField({ type: "doc_upload" }),
            formConsentText: "Use parent consent",
        });

        render(<ConfigFormFieldRenderer {...props} />);

        const childProps = mockAdditionalDocsCard.mock.calls[0][0] as Record<string, any>;
        expect(childProps.config.consent).toBe("");
        expect(childProps.config.disclaimer).toBe("Field level disclaimer");
    });

    it("renders photo upload branch and passes correct props when editable", () => {
        const props = getProps({
            field: makeField({ type: "photo_upload" }),
            editable: true,
            isMissing: true,
            consentGiven: true,
            formConsentText: "Use parent consent",
        });

        render(<ConfigFormFieldRenderer {...props} />);

        expect(screen.getByTestId("photo-upload-card")).toBeInTheDocument();
        expect(screen.getByTestId("existing-photos-grid")).toBeInTheDocument();
        expect(screen.getByText("This field is required.")).toBeInTheDocument();

        expect(props.renderExistingPhotosGrid).toHaveBeenCalledWith("boarding_home");

        const childProps = mockPhotoUploadCard.mock.calls[0][0] as Record<string, unknown>;

        expect(childProps.photos).toEqual(props.photos);
        expect(childProps.setPhotos).toBe(props.onPhotosChange);
        expect(childProps.totalCombinedMB).toBe(6);
        expect(childProps.consent).toBe(true);
        expect(childProps.setConsent).toBe(props.setConsentGiven);
        expect(childProps.disabled).toBe(false);
        expect(childProps.config).toMatchObject({
            name: "boarding_home",
            display_name: "Boarding Home",
            description: "Field description",
            consent: "",
            disclaimer: "Field level disclaimer",
            docs_count_enabled: true,
            total_upload_size: true,
            individual_upload_size: true,
        });
    });

    it("does not render photo upload card when not editable but still shows existing photos", () => {
        const props = getProps({
            field: makeField({ type: "photo_upload" }),
            editable: false,
            isMissing: true,
            consentGiven: true,
            formConsentText: "Use parent consent",
        });

        render(<ConfigFormFieldRenderer {...props} />);

        expect(screen.queryByTestId("photo-upload-card")).not.toBeInTheDocument();
        expect(screen.getByTestId("existing-photos-grid")).toBeInTheDocument();
        expect(screen.getByText("This field is required.")).toBeInTheDocument();

        expect(props.renderExistingPhotosGrid).toHaveBeenCalledWith("boarding_home");
        expect(mockPhotoUploadCard).not.toHaveBeenCalled();
    });

    it("renders checkbox options and calls onSetField when editable", () => {
        const props = getProps({
            field: makeField({
                type: "checkbox",
                values: ["Yes", "No"],
            }),
            required: true,
        });

        render(<ConfigFormFieldRenderer {...props} />);

        expect(
            screen.getByText((_, element) =>
                (element?.textContent || "").replace(/\s+/g, " ").trim() === "Boarding home *"
            )
        ).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Yes" }));

        expect(props.onSetField).toHaveBeenCalledWith("boarding_home", "Yes");
    });

    it("does not update checkbox when not editable and shows validation message", () => {
        const props = getProps({
            field: makeField({
                type: "checkbox",
                values: ["Yes", "No"],
            }),
            editable: false,
            isMissing: true,
        });

        render(<ConfigFormFieldRenderer {...props} />);

        const yesButton = screen.getByRole("button", { name: "Yes" });

        expect(yesButton).toBeDisabled();
        expect(screen.getByText("Please select an option.")).toBeInTheDocument();

        fireEvent.click(yesButton);

        expect(props.onSetField).not.toHaveBeenCalled();
    });

    it("renders normal text input and updates value when editable", () => {
        const props = getProps({
            field: makeField({ type: "text" }),
            value: "Old value",
        });

        render(<ConfigFormFieldRenderer {...props} />);

        const input = screen.getByDisplayValue("Old value");

        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("placeholder", "Enter boarding home");

        fireEvent.change(input, { target: { value: "New value" } });

        expect(props.onSetField).toHaveBeenCalledWith("boarding_home", "New value");
    });

    it("renders textarea as disabled and shows required helper when missing", () => {
        const props = getProps({
            field: makeField({ type: "textarea" }),
            editable: false,
            value: null,
            isMissing: true,
        });

        render(<ConfigFormFieldRenderer {...props} />);

        const textarea = screen.getByRole("textbox");

        expect(textarea).toBeDisabled();
        expect(screen.getByText("This field is required.")).toBeInTheDocument();

        fireEvent.change(textarea, { target: { value: "Should not update" } });

        expect(props.onSetField).not.toHaveBeenCalled();
    });
});
