# PDF Master

A simple, browser-based PDF toolkit. The first version includes a PDF merge tool.

## Features

- Merge multiple PDF files into one PDF.
- Drag and drop PDF files or select them from your device.
- Files are processed locally in the browser. The app does not upload selected PDFs to an application server.
- Responsive layout for desktop and mobile screens.

## Run locally

Open `index.html` in a modern browser. An internet connection is required to load the PDF processing library from its CDN.

## Deploy

This is a static website and can be deployed using Cloudflare Pages by connecting this GitHub repository. Use the repository root as the build directory. No build command is required.

## Project files

- `index.html` - page structure
- `styles.css` - responsive styling
- `app.js` - PDF merge functionality

## Privacy note

PDF files selected for merging are read and processed in the user's browser. The PDF processing library is loaded from a public CDN. This project does not currently include accounts, payments, analytics, or server-side file storage.
