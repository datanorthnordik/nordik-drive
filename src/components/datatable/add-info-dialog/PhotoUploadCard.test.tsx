// PhotoUploadCard.test.tsx
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("./constants", () => ({
    MAX_COMBINED_UPLOAD_MB: 50,
    MAX_PHOTOS: 5,
    MAX_PHOTO_MB: 10,
}));

import PhotoUploadCard from "./PhotoUploadCard"; // update path if needed

describe("PhotoUploadCard", () => {
    const createObjectURLMock = jest.fn(() => "blob:mock-url");
    const revokeObjectURLMock = jest.fn();

    const fileA = new File(["abc"], "photo-a.png", { type: "image/png" });
    const fileB = new File(["hello"], "photo-b.png", { type: "image/png" });

    const baseProps = {
        photos: [] as Array<{ id: string; file: File; comment: string }>,
        setPhotos: jest.fn(),
        totalCombinedMB: 12.34,
        onUpload: jest.fn(),
        onRemove: jest.fn(),
        consent: false,
        setConsent: jest.fn(),
        disabled: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        Object.defineProperty(globalThis.URL, "createObjectURL", {
            writable: true,
            value: createObjectURLMock,
        });

        Object.defineProperty(globalThis.URL, "revokeObjectURL", {
            writable: true,
            value: revokeObjectURLMock,
        });
    });

    it("renders default title, description, upload button, and upload totals", () => {
        const { container } = render(<PhotoUploadCard {...baseProps} />);

        expect(screen.getByText("Photos")).toBeInTheDocument();
        expect(container.firstChild).toHaveTextContent("Upload up to 5 images or 10 MB total.");
        expect(container.firstChild).toHaveTextContent(
            "Total upload (photos + docs): 12.34 MB / 50 MB"
        );

        expect(screen.getByRole("button", { name: /select photos/i })).toBeInTheDocument();
        expect(
            screen.getByText(/Upload Limit:\s*0\/5 photos \(0\.00 MB of 10 MB\)/i)
        ).toBeInTheDocument();

        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        expect(screen.queryByText(/You are close to the upload limit/i)).not.toBeInTheDocument();
    });

    it("calls onUpload when files are selected", () => {
        const { container } = render(<PhotoUploadCard {...baseProps} />);

        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).toBeInTheDocument();

        fireEvent.change(input, {
            target: { files: [fileA, fileB] },
        });

        expect(baseProps.onUpload).toHaveBeenCalledTimes(1);
    });

    it("renders preview side-effects, comment field, helper text, and updates comments via setPhotos", async () => {
        const props = {
            ...baseProps,
            photos: [{ id: "1", file: fileA, comment: "hello" }],
        };

        render(<PhotoUploadCard {...props} />);

        await waitFor(() => {
            expect(createObjectURLMock).toHaveBeenCalledWith(fileA);
        });

        expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
        expect(screen.getByText("5/100")).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText("Comment"), {
            target: { value: "updated" },
        });

        expect(props.setPhotos).toHaveBeenCalledTimes(1);
        expect(props.setPhotos).toHaveBeenCalledWith([
            {
                id: "1",
                file: fileA,
                comment: "updated",
            },
        ]);
    });

    it("calls onRemove when remove button is clicked", async () => {
        const props = {
            ...baseProps,
            photos: [{ id: "1", file: fileA, comment: "" }],
        };

        render(<PhotoUploadCard {...props} />);

        await waitFor(() => {
            expect(createObjectURLMock).toHaveBeenCalledWith(fileA);
        });

        fireEvent.click(screen.getByRole("button", { name: "✕" }));

        expect(props.onRemove).toHaveBeenCalledTimes(1);
        expect(props.onRemove).toHaveBeenCalledWith(0);
    });

    it("shows warning at 80% and 100% of the upload count", () => {
        const { rerender } = render(
            <PhotoUploadCard
                {...baseProps}
                photos={[
                    { id: "1", file: fileA, comment: "" },
                    { id: "2", file: fileA, comment: "" },
                    { id: "3", file: fileA, comment: "" },
                    { id: "4", file: fileA, comment: "" },
                ]}
            />
        );

        expect(
            screen.getByText("You are close to the upload limit.")
        ).toBeInTheDocument();

        rerender(
            <PhotoUploadCard
                {...baseProps}
                photos={[
                    { id: "1", file: fileA, comment: "" },
                    { id: "2", file: fileA, comment: "" },
                    { id: "3", file: fileA, comment: "" },
                    { id: "4", file: fileA, comment: "" },
                    { id: "5", file: fileB, comment: "" },
                ]}
            />
        );

        expect(
            screen.getByText("You have reached the upload limit.")
        ).toBeInTheDocument();
    });

    it("renders consent text and toggles consent", () => {
        const props = {
            ...baseProps,
            config: {
                consent: "I confirm I have permission to upload these photos.",
            },
        };

        render(<PhotoUploadCard {...props} />);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeInTheDocument();
        expect(
            screen.getByText("I confirm I have permission to upload these photos.")
        ).toBeInTheDocument();

        fireEvent.click(checkbox);

        expect(props.setConsent).toHaveBeenCalledTimes(1);
        expect(props.setConsent).toHaveBeenCalledWith(true);
    });

    it("supports custom config and hides total/count sections when disabled by config", () => {
        const { container } = render(
            <PhotoUploadCard
                {...baseProps}
                config={{
                    name: "Photos Fallback",
                    display_name: "Custom Photos",
                    description: "Custom description text.",
                    docs_count_enabled: false,
                    total_upload_size: false,
                }}
            />
        );

        expect(screen.getByText("Custom Photos")).toBeInTheDocument();
        expect(container.firstChild).toHaveTextContent("Custom description text.");

        expect(screen.queryByText(/Total upload \(photos \+ docs\):/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Upload Limit:/i)).not.toBeInTheDocument();
    });

    it("respects disabled state and blocks remove/comment/consent interactions", async () => {
        const props = {
            ...baseProps,
            disabled: true,
            photos: [{ id: "1", file: fileA, comment: "abc" }],
            config: { consent: "Consent text" },
        };

        render(<PhotoUploadCard {...props} />);

        await waitFor(() => {
            expect(createObjectURLMock).toHaveBeenCalledWith(fileA);
        });

        const selectBtn = screen.getByRole("button", { name: /select photos/i });
        const removeBtn = screen.getByRole("button", { name: "✕" });
        const commentField = screen.getByLabelText("Comment");
        const checkbox = screen.getByRole("checkbox");

        expect(selectBtn).toHaveAttribute("aria-disabled", "true");
        expect(removeBtn).toBeDisabled();
        expect(commentField).toBeDisabled();
        expect(checkbox).toBeDisabled();

        fireEvent.click(removeBtn);
        fireEvent.click(checkbox);

        expect(props.onRemove).not.toHaveBeenCalled();
        expect(props.setConsent).not.toHaveBeenCalled();
    });

    it("revokes preview object URL on unmount", async () => {
        const { unmount } = render(
            <PhotoUploadCard
                {...baseProps}
                photos={[{ id: "1", file: fileA, comment: "" }]}
            />
        );

        await waitFor(() => {
            expect(createObjectURLMock).toHaveBeenCalledWith(fileA);
        });

        const createdUrl = createObjectURLMock.mock.results[0]?.value;

        unmount();

        expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
        expect(revokeObjectURLMock).toHaveBeenCalledWith(createdUrl);
    });
});