/**
 * pdfWorker.ts
 * 
 * Centralized configuration for the PDFJS Global Worker.
 * Using Vite's asset bundling syntax ensures that pdf.worker.min.js is bundled
 * locally into the build folder rather than fetched from an external CDN at runtime.
 */
export const PDF_WORKER_URL = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();
