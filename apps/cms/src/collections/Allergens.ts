import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isEditorOrAdmin'

export const Allergens: CollectionConfig = {
  slug: 'allergens',
  labels: {
    singular: { es: 'Alérgeno', en: 'Allergen' },
    plural: { es: 'Alérgenos', en: 'Allergens' },
  },
  admin: {
    group: { es: 'Carta', en: 'Menu' },
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'icon'],
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'code',
      type: 'number',
      required: true,
      unique: true,
      admin: { readOnly: true, placeholder: '1-14' },
      min: 1,
      max: 14,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
