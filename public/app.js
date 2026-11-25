"use strict";

/* ---------- Element references ---------- */
const input = document.getElementById("file-input");
const dropZone = document.getElementById("drop-zone");
const fileArea = document.getElementById("file-area");
const fileList = document.getElementById("file-list");
const fileCount = document.getElementById("file-count");
const runButton = document.getElementById("run-button");
const clearButton = document.getElementById("clear-button");
const statusText = document.getElementById("status");
const optionsArea = document.getElementById("options");
const tabs = [...document.querySelectorAll(".tool-tab")];

/* ---------- State ---------- */
const selectedFiles = [];
let currentTool = "merge";
let busy = false;

document.getElementById("year").textContent = new Date().getFullYear();

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

const PDF_ACCEPT = "application/pdf,.pdf";
const IMAGE_ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";

const config = {
  merge: {
    title: "Merge PDF files",
    desc: "Combine multiple PDFs into one document. Use the arrows to change the order.",
    hint: "Select two or more PDF files",
    accept: PDF_ACCEPT,
    multiple: true,
    minFiles: 2,
    ordered: true,
    button: "Merge PDFs",
    icon: "＋",
  },
  split: {
    title: "Split PDF pages",
    desc: "Save selected pages as a separate PDF. Use ranges such as 1-3, 5, 8-10.",
    hint: "Select one PDF file",
    accept: PDF_ACCEPT,
    multiple: false,
    minFiles: 1,
    ordered: false,
    button: "Split PDF",
    icon: "✂",
  },
  rotate: {
    title: "Rotate PDF pages",
    desc: "Rotate every page in your PDF by 90, 180 or 270 degrees.",
    hint: "Select one PDF file",
    accept: PDF_ACCEPT,
    multiple: false,
    minFiles: 1,
    ordered: false,
    button: "Rotate PDF",
    icon: "↻",
  },
  compress: {
    title: "Compress PDF",
    desc: "Reduce PDF size by rendering pages as compressed images. Visual layout is retained, but text will no longer be selectable or searchable.",
    hint: "Select one PDF file",
    accept: PDF_ACCEPT,
    multiple: false,
    minFiles: 1,
    ordered: false,
    button: "Compress PDF",
    icon: "⇩",
  },
  "to-images": {
    title: "PDF to Images",
    desc: "Convert each PDF page into a PNG image and download them in a ZIP file.",
    hint: "Select one PDF file",
    accept: PDF_ACCEPT,
    multiple: false,
    minFiles: 1,
    ordered: false,
    button: "Convert to Images",
    icon: "▧",
  },
  "from-images": {
    title: "Images to PDF",
    desc: "Combine JPG and PNG images into one PDF document. Use the arrows to change the order.",
    hint: "Select one or more images",
    accept: IMAGE_ACCEPT,
    multiple: true,
    minFiles: 1,
    ordered: true,
    button: "Create PDF",
    icon: "▣",
  },
};

/* ---------- Small helpers ---------- */
function setStatus(message, type = "") {
  statusText.textContent = message;
  statusText.className = type ? "status " + type : "status";
}

function sizeText(bytes) {
  if (bytes < 1048576) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function isReady() {
  const { minFiles, multiple } = config[currentTool];
  return multiple ? selectedFiles.length >= minFiles : selectedFiles.length === 1;
}

function updateButtons() {
  runButton.disabled = busy || !isReady();
  clearButton.disabled = busy || !selectedFiles.length;
  fileList.inert = busy;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/* ---------- File list UI ---------- */
function iconButton(label, ariaLabel, action, onClick, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.dataset.action = action;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

function createFileItem(file, index) {
  const item = document.createElement("li");
  item.className = "file-item";

  const name = document.createElement("span");
  name.className = "file-name";
  name.textContent = file.name + " · " + sizeText(file.size);

  const controls = document.createElement("span");
  controls.className = "file-controls";
  if (config[currentTool].ordered) {
    controls.append(
      iconButton("↑", "Move " + file.name + " up", "up", () => moveFile(index, -1), index === 0),
      iconButton(
        "↓",
        "Move " + file.name + " down",
        "down",
        () => moveFile(index, 1),
        index === selectedFiles.length - 1
      )
    );
  }
  controls.append(iconButton("✕", "Remove " + file.name, "remove", () => removeFile(index)));

  item.append(name, controls);
  return item;
}

function moveFile(index, offset) {
  const target = index + offset;
  if (target < 0 || target >= selectedFiles.length) return;
  const [file] = selectedFiles.splice(index, 1);
  selectedFiles.splice(target, 0, file);
  renderFiles();
  const action = offset < 0 ? "up" : "down";
  const moved = fileList.children[target];
  const button = moved && moved.querySelector('[data-action="' + action + '"]');
  if (button && !button.disabled) button.focus();
  else if (moved) moved.querySelector('[data-action="remove"]').focus();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFiles();
}

function renderFiles() {
  fileList.replaceChildren();
  selectedFiles.forEach((file, index) => fileList.append(createFileItem(file, index)));
  fileArea.hidden = !selectedFiles.length;
  fileCount.textContent = selectedFiles.length + (selectedFiles.length === 1 ? " file" : " files");

  const { minFiles, multiple } = config[currentTool];
  if (!selectedFiles.length) {
    setStatus(
      multiple && minFiles > 1
        ? "Choose at least " + minFiles + " files."
        : "Choose a file to get started."
    );
  } else if (!isReady()) {
    setStatus("Add at least one more file.");
  } else {
    setStatus("Ready. " + selectedFiles.length + " file(s) selected.");
  }
  updateButtons();
}

/* ---------- Tool options ---------- */
function addSelectOption(labelText, id, values, labels) {
  const wrap = document.createElement("div");
  wrap.className = "option-field";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;

  const select = document.createElement("select");
  select.id = id;
  values.forEach((value, i) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = labels[i];
    select.append(option);
  });

  wrap.append(label, select);
  optionsArea.append(wrap);
}

function renderOptions() {
  optionsArea.replaceChildren();

  if (currentTool === "split") {
    const wrap = document.createElement("div");
    wrap.className = "option-field";
    const label = document.createElement("label");
    label.htmlFor = "page-ranges";
    label.textContent = "Pages to extract (example: 1-3, 5, 8-10)";
    const field = document.createElement("input");
    field.id = "page-ranges";
    field.placeholder = "1-3, 5";
    field.value = "1";
    wrap.append(label, field);
    optionsArea.append(wrap);
  }

  if (currentTool === "rotate") {
    addSelectOption(
      "Rotation angle",
      "rotation-angle",
      ["90", "180", "270"],
      ["90° clockwise", "180°", "270° clockwise"]
    );
  }

  if (currentTool === "to-images") {
    addSelectOption("Image quality", "image-scale", ["1", "1.5", "2"], ["Standard", "High", "Very high"]);
  }

  if (currentTool === "compress") {
    addSelectOption(
      "Compression level",
      "compression-level",
      ["small", "balanced", "clear"],
      ["Smaller file (lower quality)", "Balanced (recommended)", "Clearer pages (larger file)"]
    );
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent =
      "Important: real compression converts each page into a JPEG image. The pages should look similar, but text will no longer be selectable or searchable, and forms, links and bookmarks may not be preserved. If the compressed file is not smaller, the original PDF is downloaded unchanged.";
    optionsArea.append(note);
  }
}

function setTool(tool) {
  currentTool = tool;
  const c = config[tool];
  selectedFiles.length = 0;
  input.value = "";

  tabs.forEach((tab) => {
    const active = tab.dataset.tool === tool;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });

  document.getElementById("tool-title").textContent = c.title;
  document.getElementById("tool-description").textContent = c.desc;
  document.getElementById("tool-number").textContent =
    "PDF TOOL " + String(tabs.findIndex((tab) => tab.dataset.tool === tool) + 1).padStart(2, "0");
  document.getElementById("upload-title").textContent = c.multiple ? "Choose files" : "Choose a file";
  document.getElementById("file-hint").textContent = c.hint;
  document.getElementById("tool-icon").textContent = c.icon;

  input.accept = c.accept;
  input.multiple = c.multiple;
  runButton.textContent = c.button;
  renderOptions();
  renderFiles();
}

function addFiles(list) {
  const incoming = [...(list || [])];
  let added = 0;
  let rejected = 0;

  incoming.forEach((file) => {
    const ok =
      currentTool === "from-images"
        ? file.type === "image/png" || file.type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name)
        : file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!ok) {
      rejected++;
      return;
    }
    if (!config[currentTool].multiple) selectedFiles.length = 0;
    const duplicate = selectedFiles.some(
      (x) => x.name === file.name && x.size === file.size && x.lastModified === file.lastModified
    );
    if (!duplicate) {
      selectedFiles.push(file);
      added++;
    }
  });

  renderFiles();
  if (rejected) {
    setStatus(
      "Unsupported file type. Please choose " +
        (currentTool === "from-images" ? "JPG or PNG images." : "PDF files."),
      "error"
    );
  } else if (!added && incoming.length) {
    setStatus("Those files are already selected.");
  }
}

/* ---------- Event wiring ---------- */
input.addEventListener("change", (event) => {
  addFiles(event.target.files);
  input.value = "";
});

["dragenter", "dragover"].forEach((name) =>
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  })
);
["dragleave", "drop"].forEach((name) =>
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  })
);
dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));
dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!busy) input.click();
  }
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    if (!busy) setTool(tab.dataset.tool);
  });
  tab.addEventListener("keydown", (event) => {
    if (busy) return;
    let next = null;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (next === null) return;
    event.preventDefault();
    tabs[next].focus();
    setTool(tabs[next].dataset.tool);
  });
});

clearButton.addEventListener("click", () => {
  selectedFiles.length = 0;
  renderFiles();
});

/* ---------- PDF helpers ---------- */
async function readPdf(file) {
  try {
    return await PDFLib.PDFDocument.load(await file.arrayBuffer());
  } catch (err) {
    if (/encrypt/i.test(err.message || "")) {
      throw new Error('"' + file.name + '" is password-protected. Remove the password first, then try again.');
    }
    throw err;
  }
}

async function saveDownload(bytes, name, type = "application/pdf") {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function parseRanges(value, total) {
  const found = new Set();
  for (const raw of value.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Enter page ranges like 1-3, 5, 8-10.");
    const first = Number(match[1]);
    const last = Number(match[2] || match[1]);
    if (first < 1 || last < first || last > total) {
      throw new Error("Page numbers must be between 1 and " + total + ".");
    }
    for (let n = first; n <= last; n++) found.add(n - 1);
  }
  if (!found.size) throw new Error("Enter at least one page number.");
  return [...found].sort((a, b) => a - b);
}

/* ---------- Tools ---------- */
async function mergePdfs() {
  const out = await PDFLib.PDFDocument.create();
  for (let i = 0; i < selectedFiles.length; i++) {
    setStatus("Adding PDF " + (i + 1) + " of " + selectedFiles.length + "…");
    const source = await readPdf(selectedFiles[i]);
    const pages = await out.copyPages(source, source.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  await saveDownload(await out.save(), "pdf-master-merged.pdf");
}

async function splitPdf() {
  const source = await readPdf(selectedFiles[0]);
  const indexes = parseRanges(document.getElementById("page-ranges").value, source.getPageCount());
  const out = await PDFLib.PDFDocument.create();
  const pages = await out.copyPages(source, indexes);
  pages.forEach((page) => out.addPage(page));
  await saveDownload(await out.save(), "pdf-master-split.pdf");
}

async function rotatePdf() {
  const pdf = await readPdf(selectedFiles[0]);
  const degrees = Number(document.getElementById("rotation-angle").value);
  pdf.getPages().forEach((page) => {
    page.setRotation(PDFLib.degrees((page.getRotation().angle + degrees) % 360));
  });
  await saveDownload(await pdf.save(), "pdf-master-rotated.pdf");
}

/*
 * Runs `worker(item, index)` over `items` with at most `limit` jobs in flight.
 * Results keep the original order. Stops early on the first error.
 */
async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  let failed = null;
  async function lane() {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (err) {
        failed = failed || err;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  if (failed) throw failed;
  return results;
}

const MAX_RENDER_PIXELS = 6000000; // keeps very large pages from rendering slowly
const COMPRESS_CONCURRENCY = 3;

async function optimizePdf() {
  if (!window.pdfjsLib) {
    throw new Error("The PDF rendering library did not load. Refresh the page and try again.");
  }
  const started = performance.now();
  const original = selectedFiles[0];
  const level = document.getElementById("compression-level").value;
  const settings =
    {
      small: { scale: 1, quality: 0.55 },
      balanced: { scale: 1.25, quality: 0.7 },
      clear: { scale: 1.5, quality: 0.82 },
    }[level] || { scale: 1.25, quality: 0.7 };

  // disableFontFace: draw glyphs directly instead of waiting for the browser
  // to load each embedded font, which is slow and not needed for a one-off render.
  const pdfjsDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(await original.arrayBuffer()),
    disableFontFace: true,
  }).promise;

  try {
    const total = pdfjsDoc.numPages;
    let done = 0;
    const pageNumbers = Array.from({ length: total }, (_, i) => i + 1);

    const rendered = await mapPool(pageNumbers, COMPRESS_CONCURRENCY, async (n) => {
      const page = await pdfjsDoc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      let scale = settings.scale;
      const pixels = base.width * base.height * scale * scale;
      if (pixels > MAX_RENDER_PIXELS) scale = Math.sqrt(MAX_RENDER_PIXELS / (base.width * base.height));
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not create an image canvas for page " + n + ".");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, background: "rgb(255,255,255)" }).promise;

      const blob = await canvasToBlob(canvas, "image/jpeg", settings.quality);
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
      if (!blob) throw new Error("Could not compress page " + n + ".");

      done++;
      setStatus("Compressed " + done + " of " + total + " page(s)…");
      return { bytes: await blob.arrayBuffer(), width: base.width, height: base.height };
    });

    const out = await PDFLib.PDFDocument.create();
    for (const item of rendered) {
      const image = await out.embedJpg(item.bytes);
      out.addPage([item.width, item.height]).drawImage(image, { x: 0, y: 0, width: item.width, height: item.height });
    }

    const compressed = await out.save({ useObjectStreams: true });
    console.info("Compress: " + total + " page(s) in " + ((performance.now() - started) / 1000).toFixed(1) + " s");

    if (compressed.byteLength >= original.size) {
      await saveDownload(await original.arrayBuffer(), original.name);
      return (
        "Compression did not make the PDF smaller. Your original file (" +
        sizeText(original.size) +
        ") was downloaded unchanged."
      );
    }
    const saved = original.size - compressed.byteLength;
    const percent = ((saved / original.size) * 100).toFixed(1);
    await saveDownload(compressed, "pdf-master-compressed.pdf");
    return (
      "Compression complete: " +
      sizeText(original.size) +
      " reduced to " +
      sizeText(compressed.byteLength) +
      " (saved " +
      sizeText(saved) +
      ", " +
      percent +
      "%). Pages are image-based, so text is not selectable or searchable."
    );
  } finally {
    pdfjsDoc.destroy();
  }
}

async function pdfToImages() {
  if (!window.pdfjsLib || !window.JSZip) {
    throw new Error("A conversion library did not load. Check your internet connection and refresh.");
  }
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await selectedFiles[0].arrayBuffer()) }).promise;
  const zip = new JSZip();
  const scale = Number(document.getElementById("image-scale").value);

  for (let n = 1; n <= doc.numPages; n++) {
    setStatus("Rendering page " + n + " of " + doc.numPages + "…");
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const blob = await canvasToBlob(canvas, "image/png");
    if (!blob) throw new Error("Could not render page " + n + ".");
    zip.file("page-" + String(n).padStart(3, "0") + ".png", blob);
    canvas.width = 1;
    canvas.height = 1;
    page.cleanup();
  }

  await saveDownload(await zip.generateAsync({ type: "uint8array" }), "pdf-master-images.zip", "application/zip");
}

/*
 * Phone photos often store their rotation in EXIF metadata, which pdf-lib
 * ignores. Redrawing through a canvas applies that rotation, so the image
 * lands upright in the PDF. If the browser can't do this, fall back to
 * embedding the original JPEG bytes.
 */
async function embedJpegUpright(out, file, buffer) {
  if (window.createImageBitmap) {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
      canvas.width = 1;
      canvas.height = 1;
      if (blob) return await out.embedJpg(await blob.arrayBuffer());
    } catch (err) {
      console.warn("Could not apply EXIF orientation, using original JPEG.", err);
    }
  }
  return out.embedJpg(buffer);
}

async function imagesToPdf() {
  const out = await PDFLib.PDFDocument.create();
  for (let i = 0; i < selectedFiles.length; i++) {
    setStatus("Adding image " + (i + 1) + " of " + selectedFiles.length + "…");
    const file = selectedFiles[i];
    const buffer = await file.arrayBuffer();
    const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
    const image = isPng ? await out.embedPng(buffer) : await embedJpegUpright(out, file, buffer);
    out.addPage([image.width, image.height]).drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  await saveDownload(await out.save(), "pdf-master-from-images.pdf");
}

/* ---------- Run ---------- */
runButton.addEventListener("click", async () => {
  if (!window.PDFLib) {
    setStatus("PDF library failed to load. Check internet and refresh.", "error");
    return;
  }
  if (!selectedFiles.length || busy) return;

  busy = true;
  updateButtons();
  setStatus("Processing your files…");

  try {
    let completionMessage = "";
    if (currentTool === "merge") await mergePdfs();
    else if (currentTool === "split") await splitPdf();
    else if (currentTool === "rotate") await rotatePdf();
    else if (currentTool === "compress") completionMessage = await optimizePdf();
    else if (currentTool === "to-images") await pdfToImages();
    else await imagesToPdf();
    setStatus(completionMessage || "Done! Your file has been prepared and downloaded.", "success");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Could not process this file. It may be damaged or unsupported.", "error");
  } finally {
    busy = false;
    updateButtons();
  }
});

setTool("merge");
