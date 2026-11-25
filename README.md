# PDF Master

A browser-based PDF toolkit. Selected files are processed locally in the user's browser and are not uploaded to an application server.

## Available tools

- **Merge PDF:** combine multiple PDF files in their selected order.
- **Split PDF:** extract selected page numbers or ranges, for example `1-3, 5, 8-10`.
- **Rotate PDF:** rotate all pages by 90, 180, or 270 degrees.
- **Compress / Optimize PDF:** re-save the document using PDF object streams. This is basic optimization, not guaranteed image compression, so the resulting file may not always be smaller.
- **PDF to Images:** render PDF pages as PNG images and package them into a ZIP file.
- **Images to PDF:** combine JPG and PNG images into a PDF.

## Run locally

Open `index.html` in a modern browser. An internet connection is required to load the PDF libraries from their public CDNs.

## Deploy

This is a static website and can be deployed using Cloudflare Pages by connecting this GitHub repository. Use the repository root as the build directory. No build command is required.

## Project files

- `index.html` - page structure and tool navigation
- `styles.css` - responsive styling
- `app.js` - PDF processing and file conversion logic

## Not available yet

PDF to Word, Word to PDF, OCR, encrypted PDF password protection, user accounts, subscriptions, and payment processing have not been implemented.

## Privacy note

PDF processing runs in the browser. The app loads its JavaScript libraries from public CDNs, so an internet connection is needed. This project does not currently include server-side file storage or account management.
