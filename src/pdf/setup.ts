/**
 * Single place where pdf.js is wired up for the whole app.
 *
 * Everything pdf.js needs at runtime (the worker, CMaps for CJK/encoded text,
 * the 14 standard fonts, the JPEG2000/colour WASM modules and the ICC profile)
 * is served from `public/pdfjs/` as plain static files. They are copied there
 * from `node_modules/pdfjs-dist` by `scripts/sync-pdfjs.mjs`, which runs
 * automatically before every build.
 *
 * Why not import them through Vite? `import '...pdf.worker.min.mjs?url'` gets
 * treated as a JS module by the bundler: the worker ends up code-split against
 * the app's main chunk (`import {...} from './index-xxxx.js'`). Loading that as
 * a Worker throws immediately and every PDF silently fails to render — online
 * and offline. Plain files in `public/` are copied verbatim and can never be
 * rewritten by the bundler.
 *
 * Because they are ordinary files under the app scope, the service worker
 * precaches them like any other asset, so PDFs render fully offline.
 */
import { pdfjs } from 'react-pdf'

// Trailing slash matters: pdf.js appends file names to these.
const base = `${import.meta.env.BASE_URL}pdfjs/`

pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`

/** Pass to every <Document options={...}> so all viewers behave identically. */
export const pdfOptions = {
  cMapUrl: `${base}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${base}standard_fonts/`,
  wasmUrl: `${base}wasm/`,
  iccUrl: `${base}iccs/`,
  // Fetch the whole file in one request instead of HTTP range requests.
  // Range requests are a poor fit here: the service worker serves these PDFs
  // from the precache as complete 200 responses, and the brochures are local
  // assets anyway, so streaming buys nothing and only adds failure modes.
  disableRange: true,
  disableStream: true,
} as const
