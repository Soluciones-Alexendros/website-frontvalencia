import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { resolveSafePath } from '../scripts/safe-path.mjs'

const ROOT = '/var/www/dist'

describe('resolveSafePath', () => {
  it('resolves a normal relative path under the root', () => {
    expect(resolveSafePath(ROOT, '/es/index.html')).toBe(join(ROOT, 'es/index.html'))
  })

  it('maps / to index.html inside the root', () => {
    expect(resolveSafePath(ROOT, '/')).toBe(join(ROOT, 'index.html'))
  })

  it('strips query strings before resolving', () => {
    expect(resolveSafePath(ROOT, '/es/?v=1')).toBe(join(ROOT, 'es'))
  })

  it('rejects ../ traversal', () => {
    expect(resolveSafePath(ROOT, '/../etc/passwd')).toBeNull()
    expect(resolveSafePath(ROOT, '/es/../../etc/passwd')).toBeNull()
  })

  it('rejects encoded %2e%2e traversal', () => {
    expect(resolveSafePath(ROOT, '/%2e%2e/etc/passwd')).toBeNull()
    expect(resolveSafePath(ROOT, '/es/%2e%2e/%2e%2e/etc/passwd')).toBeNull()
  })

  it('keeps leading-slash URLs inside the document root', () => {
    // /etc/passwd is served as <root>/etc/passwd, never as the host /etc/passwd
    expect(resolveSafePath(ROOT, '/etc/passwd')).toBe(join(ROOT, 'etc/passwd'))
  })

  it('rejects malformed percent-encoding', () => {
    expect(resolveSafePath(ROOT, '/%E0%A4%A')).toBeNull()
  })
})
