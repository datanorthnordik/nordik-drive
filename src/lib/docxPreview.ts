type DocxPreviewModule = {
  renderAsync: (
    data: Blob | any,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement
  ) => Promise<any>;
};

let docxPreviewModulePromise: Promise<DocxPreviewModule> | null = null;

async function loadDocxPreviewModule(): Promise<DocxPreviewModule> {
  if (!docxPreviewModulePromise) {
    docxPreviewModulePromise = import("../vendor/docx-preview.min.js").then((mod: any) => {
      const resolved = mod?.renderAsync
        ? mod
        : mod?.default?.renderAsync
          ? mod.default
          : null;

      if (!resolved?.renderAsync) {
        throw new Error("Failed to load docx-preview renderer.");
      }

      return resolved as DocxPreviewModule;
    });
  }

  return docxPreviewModulePromise;
}

export async function renderDocxPreview(blob: Blob, container: HTMLElement) {
  const { renderAsync } = await loadDocxPreviewModule();
  container.innerHTML = "";
  await renderAsync(blob, container, container);
}
