import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access/isEditorOrAdmin'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { es: 'Imagen', en: 'Image' },
    plural: { es: 'Imágenes', en: 'Images' },
  },
  admin: {
    group: { es: 'Multimedia', en: 'Media' },
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  upload: {
    mimeTypes: ['image/*'],
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        fit: 'cover',
        position: 'center',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        fit: 'cover',
        position: 'center',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        fit: 'cover',
        position: 'center',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        fit: 'cover',
        position: 'center',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Texto alternativo (accesibilidad)' },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { placeholder: 'Crédito del fotógrafo (opcional)' },
    },
  ],
}
