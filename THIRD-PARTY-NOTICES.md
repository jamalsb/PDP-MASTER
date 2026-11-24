# Third-party notices

## Ghostscript WebAssembly PDF compression engine

PDF Master uses the browser build of Ghostscript supplied by `@wasm-zoo/ghostscript` version `0.7.2` (Ghostscript 10.08.0).

- Package: https://www.npmjs.com/package/@wasm-zoo/ghostscript
- Runtime source and build project: https://github.com/ttomohisa/wasm-zoo
- Exact source bundle and build recipe: https://github.com/ttomohisa/wasm-zoo/releases/download/ghostscript-v0.7.2/ghostscript-sources-10.08.0-zoo-0.7.2.tar.gz
- License: GNU Affero General Public License, version 3 or later (AGPL-3.0-or-later), for the Ghostscript WebAssembly engine and its bundled components. See the package's bundled license and third-party notices for the complete terms.

The engine is loaded from jsDelivr only when a user runs PDF compression. PDF files are passed to Ghostscript's browser WebAssembly runtime and processed locally in the browser; PDF contents are not sent to PDF Master's application server.

Anyone deploying or modifying this network-accessible application should review and comply with the applicable AGPL source-offer and notice requirements. This notice is not legal advice. Artifex offers separate commercial licensing options for Ghostscript.
