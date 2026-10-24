import type { Access, FieldAccess, PayloadRequest } from 'payload'

function userIsAdmin(req: PayloadRequest): boolean {
  if (!req.user) return false
  return Array.isArray(req.user.roles) && req.user.roles.includes('admin')
}

/**
 * Solo admins pueden realizar la operación.
 *
 * Uso en collections:
 * ```ts
 * import { isAdmin } from '../access/isAdmin'
 *
 * export const SomeCollection: CollectionConfig = {
 *   slug: 'some',
 *   access: {
 *     create: isAdmin,
 *     delete: isAdmin,
 *     read: () => true,
 *     update: isAdmin,
 *   },
 *   fields: [...]
 * }
 * ```
 */
export const isAdmin: Access = ({ req }) => userIsAdmin(req)

/** Access booleano para `access.admin` y field-level access (no admiten Where). */
export const isAdminBoolean = ({ req }: { req: PayloadRequest }): boolean => userIsAdmin(req)

export const isAdminField: FieldAccess = ({ req }) => userIsAdmin(req)

/**
 * Helper para admin panel route (no confundir con collection access).
 */
export const isAdminPanel: Access = ({ req }) => userIsAdmin(req)
