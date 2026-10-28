/**
 * Copies the pdf.js runtime files out of node_modules into public/pdfjs/.
 *
 * These must be plain static files — see the comment in src/pdf/setup.ts for
 * why they cannot go through the bundler. Running this before every build
 * keeps them in step with the installed pdfjs-dist version.
 */
import { cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'node_modules', 'pdfjs-dist')
const out = join(root, 'public', 'pdfjs')

// Skip license/readme files — they'd only bloat the offline precache.
const skipJunk = (path) => !/[/\\](LICENSE|README)[^/\\]*$/i.test(path)

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

await cp(join(src, 'build', 'pdf.worker.min.mjs'), join(out, 'pdf.worker.min.mjs'))
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  await cp(join(src, dir), join(out, dir), { recursive: true, filter: skipJunk })
}

console.log('pdfjs runtime files synced to public/pdfjs')
