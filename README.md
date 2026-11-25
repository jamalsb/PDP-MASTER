# PDF Master

A browser-based PDF toolkit. Selected files are processed locally in the user's browser and are not uploaded to an application server.

## Available tools

- **Merge PDF:** combine multiple PDF files. Use the arrow buttons to change the order or the ✕ button to remove a file.
- **Split PDF:** extract selected page numbers or ranges, for example `1-3, 5, 8-10`.
- **Rotate PDF:** rotate all pages by 90, 180, or 270 degrees.
- **Compress PDF:** renders every page as a JPEG image and rebuilds the PDF. This can reduce file size a lot, but **text is no longer selectable or searchable, and links, forms and bookmarks are not preserved**. If the result is not smaller, the original file is downloaded unchanged.
- **PDF to Images:** render PDF pages as PNG images and package them into a ZIP file.
- **Images to PDF:** combine one or more JPG and PNG images into a PDF, in the order you choose. JPEG photos are redrawn so their camera (EXIF) rotation is applied.

Password-protected PDFs are not supported; remove the password first.

## Run locally

Open `public/index.html` in a modern browser. An internet connection is required to load the PDF libraries from public CDNs.

## Project layout

- `public/index.html` - page structure and tool navigation
- `public/styles.css` - responsive styling
- `public/app.js` - PDF processing and file conversion logic
- `.github/workflows/deploy.yml` - deployment workflow

## Deploy

Pushes to `main` deploy automatically to Cloudflare Workers via GitHub Actions. Only the `public/` folder is published, so this README and the workflow files are not served on the website.

Add these two repository secrets under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

You can also run the workflow manually from the **Actions** tab.

## Third-party libraries

The app loads [pdf-lib](https://pdf-lib.js.org/) 1.17.1, [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174 and [JSZip](https://stuk.github.io/jszip/) 3.10.1 from public CDNs, pinned to exact versions. The page itself does not send your files anywhere, but a compromised CDN script could, so for stronger guarantees:

1. Download each file and commit it into `public/vendor/` (and point `workerSrc` in `app.js` at the local worker file), **or**
2. Add Subresource Integrity attributes to each `<script>` tag. Generate a hash with:

   ```bash
   curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A
   ```

   and use it as `integrity="sha384-<hash>"`.

## Not available yet

PDF to Word, Word to PDF, user accounts, subscriptions, and payment processing have not been implemented.

## Privacy note

PDF processing runs in the browser. This project does not include server-side file storage or account management.
