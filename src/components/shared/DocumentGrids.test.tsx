import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { DocumentGrid } from "./DocumentGrids";
import { categoryLabel, formatBytes, normalizeStatus } from "./types";

type AnyDoc = any;

// ✅ Find a raw status value that normalizeStatus(...) maps to the target
function findStatusInput(target: "approved" | "rejected" | "pending") {
  const candidates: any[] = [
    target,
    target.toUpperCase(),
    target[0].toUpperCase() + target.slice(1),
    ` ${target} `,
    `${target}_status`,
    // common backend patterns
    target === "approved" ? 1 : target === "rejected" ? 2 : 0,
    target === "approved" ? "1" : target === "rejected" ? "2" : "0",
    target === "approved" ? true : target === "rejected" ? false : null,
    undefined,
    "",
    "in_review",
    "under_review",
    "review",
    "pending_review",
    "PENDING_REVIEW",
    "Approved",
    "Rejected",
    "Pending",
    "APPROVED",
    "REJECTED",
    "PENDING",
  ];

  for (const c of candidates) {
    try {
      const out = normalizeStatus(c);
      if (out === target) return c;
    } catch {
      // ignore
    }
  }

  throw new Error(
    `Could not find a status input that normalizeStatus(...) maps to "${target}". ` +
      `Update findStatusInput() candidates based on your normalizeStatus implementation.`
  );
}

// These will work with your actual normalizeStatus()
const STATUS_APPROVED_IN = findStatusInput("approved");
const STATUS_REJECTED_IN = findStatusInput("rejected");
const STATUS_PENDING_IN = findStatusInput("pending");

const baseDocs = (): AnyDoc[] => [
  {
    id: 11,
    status: STATUS_APPROVED_IN,
    document_category: "passport",
    size_bytes: 1024,
    filename: "a.pdf",
    mime_type: "application/pdf",
  },
  {
    id: 22,
    status: STATUS_REJECTED_IN,
    document_category: "photo",
    size_bytes: 2048,
    file_name: "b.png",
    // mime_type missing => fallback ""
  },
  {
    id: 33,
    status: STATUS_PENDING_IN,
    document_category: "other",
    size_bytes: 0,
    // no filename/file_name => fallback document_33
    mime_type: "image/png",
  },
];

describe("DocumentGrid (100% coverage)", () => {
  test("renders default title and default emptyText when no documents", () => {
    render(<DocumentGrid documents={[]} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Uploaded Documents")).toBeInTheDocument();
    expect(screen.getByText("No documents submitted.")).toBeInTheDocument();
  });

  test("renders loading state", () => {
    render(<DocumentGrid loading documents={[]} onOpenViewer={jest.fn()} />);
    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
  });

  test("renders documents with default chips/labels and default View button", () => {
    const docs = baseDocs();
    render(<DocumentGrid documents={docs} onOpenViewer={jest.fn()} />);

    // Cards
    expect(screen.getByTestId("doc-card-11")).toBeInTheDocument();
    expect(screen.getByTestId("doc-card-22")).toBeInTheDocument();
    expect(screen.getByTestId("doc-card-33")).toBeInTheDocument();

    // Category + Size chips (use real helpers for expected text)
    expect(screen.getByText(categoryLabel(docs[0].document_category))).toBeInTheDocument();
    expect(screen.getByText(formatBytes(docs[0].size_bytes))).toBeInTheDocument();

    // Status labels default: st.toUpperCase()
    const st11 = normalizeStatus(docs[0].status);
    const st22 = normalizeStatus(docs[1].status);
    const st33 = normalizeStatus(docs[2].status);

    expect(screen.getByTestId("doc-status-11")).toHaveTextContent(st11.toUpperCase());
    expect(screen.getByTestId("doc-status-22")).toHaveTextContent(st22.toUpperCase());
    expect(screen.getByTestId("doc-status-33")).toHaveTextContent(st33.toUpperCase());

    // Filename resolution: filename, file_name, fallback document_{id}
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("b.png")).toBeInTheDocument();
    expect(screen.getByText("document_33")).toBeInTheDocument();

    // Default View button
    expect(screen.getByTestId("doc-view-11")).toHaveTextContent("View");
  });

  test("clicking a card calls onOpenViewer with correct index", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(<DocumentGrid documents={baseDocs()} onOpenViewer={onOpenViewer} />);

    await user.click(screen.getByTestId("doc-card-22"));
    expect(onOpenViewer).toHaveBeenCalledTimes(1);
    expect(onOpenViewer).toHaveBeenCalledWith(1);
  });

  test("clicking View button calls onOpenViewer once (stopPropagation prevents double call)", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(<DocumentGrid documents={baseDocs()} onOpenViewer={onOpenViewer} />);

    const card = screen.getByTestId("doc-card-11");
    await user.click(within(card).getByTestId("doc-view-11"));

    // If stopPropagation failed -> 2 calls (button + card)
    expect(onOpenViewer).toHaveBeenCalledTimes(1);
    expect(onOpenViewer).toHaveBeenCalledWith(0);
  });

  test("custom statusLabel + statusChipSx + viewLabel + viewBtnSx branches", () => {
    const statusLabel = jest.fn((st: any) => `LBL:${String(st)}`);
    const statusChipSx = jest.fn((_st: any) => ({ height: 99 }));
    const viewBtnSx = { border: "2px solid red" } as any;

    render(
      <DocumentGrid
        documents={baseDocs()}
        onOpenViewer={jest.fn()}
        statusLabel={statusLabel}
        statusChipSx={statusChipSx}
        viewLabel="Open"
        viewBtnSx={viewBtnSx}
      />
    );

    // labelOf() uses statusLabel(st)
    expect(screen.getByTestId("doc-status-11")).toHaveTextContent("LBL:");
    expect(screen.getByTestId("doc-status-22")).toHaveTextContent("LBL:");
    expect(screen.getByTestId("doc-status-33")).toHaveTextContent("LBL:");

    expect(statusLabel).toHaveBeenCalled();
    expect(statusChipSx).toHaveBeenCalledTimes(3);

    // custom viewLabel
    expect(screen.getByTestId("doc-view-11")).toHaveTextContent("Open");
  });

  test("download button when onDownloadSingle provided; covers resolveFilename/resolveMime fallbacks; does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();
    const onDownloadSingle = jest.fn();

    // add doc44 to force doc.filename fallback
    const docs = [
      ...baseDocs(),
      {
        id: 44,
        status: STATUS_PENDING_IN,
        document_category: "x",
        size_bytes: 10,
        filename: "from_filename.txt",
        mime_type: "text/plain",
      },
    ];

    const resolveFilename = jest.fn((doc: AnyDoc) => {
      if (doc.id === 11) return "RES_11.pdf"; // truthy resolver used
      if (doc.id === 44) return ""; // falsy => fallback to doc.filename
      return ""; // doc22 => file_name ; doc33 => document_{id}
    });

    const resolveMime = jest.fn((doc: AnyDoc) => {
      if (doc.id === 11) return "application/x-res"; // truthy resolver used
      return ""; // others fall back to doc.mime_type or ""
    });

    render(
      <DocumentGrid
        documents={docs}
        onOpenViewer={onOpenViewer}
        onDownloadSingle={onDownloadSingle}
        resolveFilename={resolveFilename}
        resolveMime={resolveMime}
        primaryBtnSx={{ fontWeight: 900 }}
      />
    );

    // 11: resolver filename + resolver mime
    await user.click(within(screen.getByTestId("doc-card-11")).getByRole("button", { name: /^download$/i }));
    expect(onDownloadSingle).toHaveBeenCalledWith(11, "RES_11.pdf", "application/x-res");

    // 22: fallback file_name + fallback "" (no mime_type)
    await user.click(within(screen.getByTestId("doc-card-22")).getByRole("button", { name: /^download$/i }));
    expect(onDownloadSingle).toHaveBeenCalledWith(22, "b.png", "");

    // 33: fallback document_{id} + fallback doc.mime_type
    await user.click(within(screen.getByTestId("doc-card-33")).getByRole("button", { name: /^download$/i }));
    expect(onDownloadSingle).toHaveBeenCalledWith(33, "document_33", "image/png");

    // 44: resolver falsy => doc.filename + fallback doc.mime_type
    await user.click(within(screen.getByTestId("doc-card-44")).getByRole("button", { name: /^download$/i }));
    expect(onDownloadSingle).toHaveBeenCalledWith(44, "from_filename.txt", "text/plain");

    // stopPropagation prevents viewer open
    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("download button renders when showDownload=true even if onDownloadSingle undefined; clicking does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(<DocumentGrid documents={baseDocs()} onOpenViewer={onOpenViewer} showDownload />);

    await user.click(within(screen.getByTestId("doc-card-11")).getByRole("button", { name: /^download$/i }));
    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("approve/reject buttons call handlers and do not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();
    const onApprove = jest.fn();
    const onReject = jest.fn();

    render(
      <DocumentGrid
        documents={baseDocs()}
        onOpenViewer={onOpenViewer}
        showApproveReject
        onApprove={onApprove}
        onReject={onReject}
        approveBtnSx={{}}
        rejectBtnSx={{}}
      />
    );

    const card = screen.getByTestId("doc-card-22");

    await user.click(within(card).getByTestId("doc-approve-22"));
    expect(onApprove).toHaveBeenCalledWith(22);

    await user.click(within(card).getByTestId("doc-reject-22"));
    expect(onReject).toHaveBeenCalledWith(22);

    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("approve/reject buttons render even if handlers undefined; clicking does not open viewer", async () => {
    const user = userEvent.setup();
    const onOpenViewer = jest.fn();

    render(<DocumentGrid documents={baseDocs()} onOpenViewer={onOpenViewer} showApproveReject />);

    const card = screen.getByTestId("doc-card-11");
    await user.click(within(card).getByTestId("doc-approve-11"));
    await user.click(within(card).getByTestId("doc-reject-11"));

    expect(onOpenViewer).not.toHaveBeenCalled();
  });

  test("can hide category chip, size chip, and view button (covers false branches)", () => {
    render(
      <DocumentGrid
        documents={baseDocs()}
        onOpenViewer={jest.fn()}
        showCategoryChip={false}
        showSizeChip={false}
        showViewButton={false}
      />
    );

    // When hidden, they shouldn't be in DOM
    expect(screen.queryByText(categoryLabel(baseDocs()[0].document_category))).not.toBeInTheDocument();
    expect(screen.queryByText(formatBytes(baseDocs()[0].size_bytes))).not.toBeInTheDocument();

    expect(screen.queryByTestId("doc-view-11")).not.toBeInTheDocument();
    expect(screen.queryByTestId("doc-view-22")).not.toBeInTheDocument();
    expect(screen.queryByTestId("doc-view-33")).not.toBeInTheDocument();

    // Status still present
    expect(screen.getByTestId("doc-status-11")).toBeInTheDocument();
  });
});
