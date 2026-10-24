/**
 * generate-menu-pdf.mjs
 *
 * Manual regeneration script (NOT run automatically at build time).
 * Generates:
 * 1. A pixel-perfect PDF of the menu using Playwright
 * 2. A QR code PNG pointing to the PDF URL
 *
 * Both files are written to public/ (the committed source of truth) so that
 * Astro copies them into dist/ on every build and they are always served on
 * Vercel WITHOUT requiring Playwright/chromium in the deploy environment.
 *
 * Run locally with `pnpm --filter frontvalencia-web menu:generate` whenever the
 * menu content changes, then commit public/files + public/images.
 */

import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { resolveSafePath } from './safe-path.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const FILES_DIR = join(ROOT, 'public', 'files')
const IMAGES_DIR = join(ROOT, 'public', 'images')

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
const APP_VERSION = packageJson.version || '0.0.0'
const PDF_URL = 'https://website-frontvalencia.vercel.app/files/menu-frontvalencia.pdf'
const PORT = 0 // random available port

// MIME types for static serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
}

function getMimeType(path) {
  const ext = extname(path).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function startServer(distPath) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = resolveSafePath(distPath, req.url ?? '/')
      if (!filePath) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      // Try to serve the file
      if (existsSync(filePath)) {
        const stat = statSync(filePath)
        if (stat.isDirectory()) {
          const dirIndex = resolveSafePath(filePath, 'index.html')
          if (!dirIndex) {
            res.writeHead(403)
            res.end('Forbidden')
            return
          }
          filePath = dirIndex
        }
      }

      try {
        const content = readFileSync(filePath)
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    server.listen(PORT, '127.0.0.1', () => {
      const port = server.address().port
      console.log(`[pdf-gen] Server running on http://127.0.0.1:${port}`)
      resolve({ server, port })
    })
  })
}

async function generateQRCode(url) {
  const QRCode = await import('qrcode')
  const dataUrl = await QRCode.default.toDataURL(url, {
    width: 256,
    margin: 2,
    color: {
      dark: '#0a0a0a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
  // Extract base64 data from data URL
  const base64 = dataUrl.split(',')[1]
  return Buffer.from(base64, 'base64')
}

async function main() {
  console.log('[pdf-gen] Starting PDF generation...')

  // Ensure output directories exist
  mkdirSync(FILES_DIR, { recursive: true })
  mkdirSync(IMAGES_DIR, { recursive: true })

  // Start local server
  const { server, port } = await startServer(DIST)

  let browser
  try {
    // Launch browser
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      locale: 'es-ES',
    })
    const page = await context.newPage()

    // Navigate to the menu page
    console.log(`[pdf-gen] Navigating to http://127.0.0.1:${port}/es/`)
    await page.goto(`http://127.0.0.1:${port}/es/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for menu section to render
    await page.waitForSelector('#carta', { timeout: 10000 })
    await page.waitForTimeout(2000) // Allow animations to complete

    // Expand allergens section for PDF
    const allergenBtn = page.locator('button[aria-expanded]').first()
    if (await allergenBtn.isVisible()) {
      await allergenBtn.click()
      await page.waitForTimeout(500)
    }

    // Generate PDF
    console.log('[pdf-gen] Generating PDF...')
    const pdfPath = join(FILES_DIR, 'menu-frontvalencia.pdf')
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 8px; color: #666; text-align: center; width: 100%; padding: 5px 0;">
          <span>FRONT — La Marina de Valencia</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8px; color: #666; text-align: center; width: 100%; padding: 5px 0;">
          <span>v${APP_VERSION} — website-frontvalencia.vercel.app</span>
        </div>
      `,
    })
    console.log(`[pdf-gen] PDF saved to ${pdfPath}`)

    // Generate QR code
    console.log('[pdf-gen] Generating QR code...')
    const qrBuf = await generateQRCode(PDF_URL)
    const qrPath = join(IMAGES_DIR, 'qr-menu.png')
    writeFileSync(qrPath, qrBuf)
    console.log(`[pdf-gen] QR code saved to ${qrPath}`)

    console.log('[pdf-gen] Done!')
  } catch (error) {
    console.error('[pdf-gen] Error:', error.message)
    // Don't fail the build if PDF generation fails
    // The site can still be deployed without the PDF
    console.warn('[pdf-gen] Continuing build without PDF...')
  } finally {
    if (browser) await browser.close()
    server.close()
  }
}

main()
