import { relative, resolve, sep } from 'path'

/**
 * Resolve a request URL against a document root and reject path traversal.
 * Returns null when the resolved path escapes the root (covers `../`,
 * encoded `%2e%2e`, absolute paths, and the `root`/`root/` startsWith bypass).
 *
 * @param {string} rootDir Absolute directory that must contain the file
 * @param {string} requestUrl Raw URL path from the HTTP request (may include query)
 * @returns {string | null} Absolute path inside root, or null if unsafe
 */
export function resolveSafePath(rootDir, requestUrl) {
  const root = resolve(rootDir)
  const raw = String(requestUrl ?? '/')
    .split('?')[0]
    .split('#')[0]

  let decoded
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }

  const pathname = decoded === '/' || decoded === '' ? 'index.html' : decoded.replace(/^\/+/, '')
  // Reject absolute request paths before join (would ignore root on POSIX)
  if (pathname.startsWith('/') || /^[A-Za-z]:[\\/]/.test(pathname)) {
    return null
  }

  const resolved = resolve(root, pathname)
  const rel = relative(root, resolved)

  if (rel.startsWith('..') || rel.startsWith(`..${sep}`)) {
    return null
  }
  // Absolute `relative` means the path left the root (e.g. different drive)
  if (rel !== '' && resolve(rel) === rel) {
    return null
  }

  const rootPrefix = root.endsWith(sep) ? root : root + sep
  if (resolved !== root && !resolved.startsWith(rootPrefix)) {
    return null
  }

  return resolved
}
