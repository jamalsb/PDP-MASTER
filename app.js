const input = document.getElementById("pdf-files");
const dropZone = document.getElementById("drop-zone");
const fileArea = document.getElementById("file-area");
const fileList = document.getElementById("file-list");
const fileCount = document.getElementById("file-count");
const mergeButton = document.getElementById("merge-button");
const clearButton = document.getElementById("clear-button");
const statusText = document.getElementById("status");
const selectedFiles = [];

document.getElementById("year").textContent = new Date().getFullYear();

function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = type ? "status " + type : "status";
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function renderFiles() {
  fileList.replaceChildren();
  selectedFiles.forEach((file) => {
    const item = document.createElement("li");
    item.textContent = file.name + " · " + formatSize(file.size);
    fileList.appendChild(item);
  });
  fileArea.hidden = selectedFiles.length === 0;
  fileCount.textContent = selectedFiles.length + (selectedFiles.length === 1 ? " file" : " files");
  mergeButton.disabled = selectedFiles.length < 2;
  clearButton.disabled = selectedFiles.length === 0;
  if (selectedFiles.length < 2) {
    setStatus(selectedFiles.length === 1 ? "Add one more PDF file to merge." : "Select at least two PDF files to get started.");
  } else {
    setStatus("Ready to merge " + selectedFiles.length + " PDF files.");
  }
}

function addFiles(fileCollection) {
  const incoming = Array.from(fileCollection || []);
  let added = 0;
  let rejected = 0;
  incoming.forEach((file) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      rejected++;
      return;
    }
    if (!selectedFiles.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) {
      selectedFiles.push(file);
      added++;
    }
  });
  renderFiles();
  if (rejected) setStatus("Only PDF files are accepted. " + rejected + " unsupported file(s) were skipped.", "error");
  else if (!added && incoming.length) setStatus("Those files are already in the list.");
}

input.addEventListener("change", (event) => {
  addFiles(event.target.files);
  input.value = "";
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
});
dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

clearButton.addEventListener("click", () => {
  selectedFiles.length = 0;
  renderFiles();
});

mergeButton.addEventListener("click", async () => {
  if (selectedFiles.length < 2) return;
  if (!window.PDFLib) {
    setStatus("The PDF library could not load. Check your internet connection and refresh the page.", "error");
    return;
  }

  mergeButton.disabled = true;
  clearButton.disabled = true;
  setStatus("Merging your PDF files. Please wait…");

  try {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (let index = 0; index < selectedFiles.length; index++) {
      setStatus("Processing file " + (index + 1) + " of " + selectedFiles.length + "…");
      const bytes = await selectedFiles[index].arrayBuffer();
      const sourcePdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "pdf-master-merged.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setStatus("Done! Your merged PDF has been downloaded.", "success");
  } catch (error) {
    console.error("PDF merge failed:", error);
    setStatus("Could not merge these files. One may be damaged, encrypted, or unsupported. Try opening each PDF and selecting it again.", "error");
  } finally {
    mergeButton.disabled = selectedFiles.length < 2;
    clearButton.disabled = selectedFiles.length === 0;
  }
});

renderFiles();