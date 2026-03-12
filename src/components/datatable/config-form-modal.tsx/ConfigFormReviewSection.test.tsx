import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import ConfigFormReviewSection, {
    UploadReviewDraft,
} from "./ConfigFormReviewSection";

jest.mock("@mui/material", () => ({
    __esModule: true,
    Box: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick }: any) => (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    ),
    Typography: ({ children }: any) => <div>{children}</div>,
    TextField: ({ label, value, onChange }: any) => (
        <label>
            <span>{label}</span>
            <textarea aria-label={label} value={value} onChange={onChange} />
        </label>
    ),
}));

describe("ConfigFormReviewSection", () => {
    const makeUpload = (
        overrides: Partial<UploadReviewDraft> = {}
    ): UploadReviewDraft => ({
        uploadId: 101,
        kind: "document",
        fieldKey: "passport_doc",
        fileName: "passport.pdf",
        mimeType: "application/pdf",
        fileCategory: "passport",
        fileSizeBytes: 12345,
        originalComment: "",
        reviewStatus: "",
        reviewerComment: "",
        rejectionReason: "",
        ...overrides,
    });

    const makeProps = (overrides?: Partial<React.ComponentProps<typeof ConfigFormReviewSection>>) => ({
        uploads: [
            makeUpload(),
            makeUpload({
                uploadId: 202,
                kind: "photo",
                fieldKey: "profile_photo",
                fileName: "profile.jpg",
                mimeType: "image/jpeg",
            }),
        ],
        submissionComment: "Initial common comment",
        submissionRejectionReason: "Initial common reason",
        onChangeSubmissionComment: jest.fn(),
        onChangeSubmissionRejectionReason: jest.fn(),
        onChangeUpload: jest.fn(),
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the main review section with common inputs", () => {
        render(<ConfigFormReviewSection {...makeProps()} />);

        expect(screen.getByText("Review")).toBeInTheDocument();
        expect(screen.getByLabelText("Common Reviewer Comment")).toHaveValue(
            "Initial common comment"
        );
        expect(screen.getByLabelText("Common Rejection Reason")).toHaveValue(
            "Initial common reason"
        );
    });

    it("calls common submission change handlers", () => {
        const props = makeProps();

        render(<ConfigFormReviewSection {...props} />);

        fireEvent.change(screen.getByLabelText("Common Reviewer Comment"), {
            target: { value: "Updated common comment" },
        });
        fireEvent.change(screen.getByLabelText("Common Rejection Reason"), {
            target: { value: "Updated common reason" },
        });

        expect(props.onChangeSubmissionComment).toHaveBeenCalledWith(
            "Updated common comment"
        );
        expect(props.onChangeSubmissionRejectionReason).toHaveBeenCalledWith(
            "Updated common reason"
        );
    });

    it("renders document and photo groups separately", () => {
        render(<ConfigFormReviewSection {...makeProps()} />);

        expect(screen.getByText("Document Reviews")).toBeInTheDocument();
        expect(screen.getByText("Photo Reviews")).toBeInTheDocument();

        expect(screen.getByText("passport.pdf")).toBeInTheDocument();
        expect(screen.getByText("profile.jpg")).toBeInTheDocument();
        expect(screen.getByText("Upload ID: 101 • Document")).toBeInTheDocument();
        expect(screen.getByText("Upload ID: 202 • Photo")).toBeInTheDocument();
    });

    it("does not render document or photo sections when uploads are empty", () => {
        render(<ConfigFormReviewSection {...makeProps({ uploads: [] })} />);

        expect(screen.queryByText("Document Reviews")).not.toBeInTheDocument();
        expect(screen.queryByText("Photo Reviews")).not.toBeInTheDocument();
    });

    it("renders only document section when only documents exist", () => {
        render(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [
                        makeUpload({ uploadId: 1, kind: "document", fileName: "doc1.pdf" }),
                        makeUpload({ uploadId: 2, kind: "document", fileName: "doc2.pdf" }),
                    ],
                })}
            />
        );

        expect(screen.getByText("Document Reviews")).toBeInTheDocument();
        expect(screen.queryByText("Photo Reviews")).not.toBeInTheDocument();
        expect(screen.getByText("doc1.pdf")).toBeInTheDocument();
        expect(screen.getByText("doc2.pdf")).toBeInTheDocument();
    });

    it("renders only photo section when only photos exist", () => {
        render(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [
                        makeUpload({
                            uploadId: 10,
                            kind: "photo",
                            fileName: "photo1.jpg",
                        }),
                    ],
                })}
            />
        );

        expect(screen.queryByText("Document Reviews")).not.toBeInTheDocument();
        expect(screen.getByText("Photo Reviews")).toBeInTheDocument();
        expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
    });

    it("shows original comment only when it contains non-whitespace text", () => {
        render(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [
                        makeUpload({
                            uploadId: 1,
                            originalComment: "This file is slightly blurry",
                        }),
                        makeUpload({
                            uploadId: 2,
                            kind: "photo",
                            fileName: "photo.jpg",
                            originalComment: "   ",
                        }),
                    ],
                })}
            />
        );

        expect(screen.getByText("Original Comment")).toBeInTheDocument();
        expect(
            screen.getByText("This file is slightly blurry")
        ).toBeInTheDocument();

        expect(screen.getAllByLabelText("Reviewer Comment")).toHaveLength(2);
        expect(screen.queryByText("   ")).not.toBeInTheDocument();
    });

    it("falls back to generated file name when fileName is empty", () => {
        render(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [
                        makeUpload({
                            uploadId: 55,
                            kind: "photo",
                            fileName: "",
                        }),
                    ],
                })}
            />
        );

        expect(screen.getByText("photo #55")).toBeInTheDocument();
    });

    it("calls onChangeUpload with approved status and clears rejection reason", () => {
        const props = makeProps({
            uploads: [makeUpload({ uploadId: 11, reviewStatus: "rejected" })],
        });

        render(<ConfigFormReviewSection {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Approve" }));

        expect(props.onChangeUpload).toHaveBeenCalledWith(11, {
            reviewStatus: "approved",
            rejectionReason: "",
        });
    });

    it("calls onChangeUpload with rejected status", () => {
        const props = makeProps({
            uploads: [makeUpload({ uploadId: 22, reviewStatus: "" })],
        });

        render(<ConfigFormReviewSection {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Reject" }));

        expect(props.onChangeUpload).toHaveBeenCalledWith(22, {
            reviewStatus: "rejected",
        });
    });

    it("calls onChangeUpload with moreInfo status and clears rejection reason", () => {
        const props = makeProps({
            uploads: [makeUpload({ uploadId: 33, reviewStatus: "rejected" })],
        });

        render(<ConfigFormReviewSection {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Need More Info" }));

        expect(props.onChangeUpload).toHaveBeenCalledWith(33, {
            reviewStatus: "moreInfo",
            rejectionReason: "",
        });
    });

    it("calls onChangeUpload when reviewer comment changes", () => {
        const props = makeProps({
            uploads: [makeUpload({ uploadId: 44 })],
        });

        render(<ConfigFormReviewSection {...props} />);

        fireEvent.change(screen.getByLabelText("Reviewer Comment"), {
            target: { value: "Looks good overall" },
        });

        expect(props.onChangeUpload).toHaveBeenCalledWith(44, {
            reviewerComment: "Looks good overall",
        });
    });

    it("shows rejection reason field only for rejected uploads and updates it", () => {
        const props = makeProps({
            uploads: [
                makeUpload({
                    uploadId: 66,
                    reviewStatus: "rejected",
                    rejectionReason: "Missing page",
                }),
            ],
        });

        render(<ConfigFormReviewSection {...props} />);

        const rejectionReason = screen.getByLabelText("Rejection Reason");
        expect(rejectionReason).toBeInTheDocument();
        expect(rejectionReason).toHaveValue("Missing page");

        fireEvent.change(rejectionReason, {
            target: { value: "Unreadable document" },
        });

        expect(props.onChangeUpload).toHaveBeenCalledWith(66, {
            rejectionReason: "Unreadable document",
        });
    });

    it("does not show rejection reason field for approved or moreInfo uploads", () => {
        const { rerender } = render(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [makeUpload({ uploadId: 77, reviewStatus: "approved" })],
                })}
            />
        );

        expect(screen.queryByLabelText("Rejection Reason")).not.toBeInTheDocument();

        rerender(
            <ConfigFormReviewSection
                {...makeProps({
                    uploads: [makeUpload({ uploadId: 88, reviewStatus: "moreInfo" })],
                })}
            />
        );

        expect(screen.queryByLabelText("Rejection Reason")).not.toBeInTheDocument();
    });

    it("handles multiple uploads independently", () => {
        const props = makeProps({
            uploads: [
                makeUpload({
                    uploadId: 1,
                    kind: "document",
                    fileName: "doc-a.pdf",
                }),
                makeUpload({
                    uploadId: 2,
                    kind: "photo",
                    fileName: "photo-b.jpg",
                }),
            ],
        });

        render(<ConfigFormReviewSection {...props} />);

        const rejectButtons = screen.getAllByRole("button", { name: "Reject" });
        const approveButtons = screen.getAllByRole("button", { name: "Approve" });

        fireEvent.click(rejectButtons[0]);
        fireEvent.click(approveButtons[1]);

        expect(props.onChangeUpload).toHaveBeenCalledWith(1, {
            reviewStatus: "rejected",
        });
        expect(props.onChangeUpload).toHaveBeenCalledWith(2, {
            reviewStatus: "approved",
            rejectionReason: "",
        });
    });
});