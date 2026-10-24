import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

// Collections
import { Users, MenuItem, MenuCategory, Allergens, Space, Events, Media } from './collections'

// Globals
import { SiteConfig } from './globals/SiteConfig'

// Plugins
import { r2Storage } from './plugins/r2-storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
if (!secret || secret.length < 32) {
  throw new Error('PAYLOAD_SECRET must be at least 32 characters. Use: openssl rand -base64 32')
}

export default buildConfig({
  secret,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — FRONT CMS' },
    livePreview: {
      url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4321',
      collections: ['menu-items', 'menu-categories', 'spaces', 'events'],
      globals: ['site-config'],
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
    push: true,
  }),
  collections: [Users, Allergens, MenuCategory, MenuItem, Space, Events, Media],
  globals: [SiteConfig],
  plugins: [
    r2Storage,
    seoPlugin({
      collections: ['menu-items', 'spaces', 'events'],
      fields: ({ defaultFields }) => defaultFields,
    }),
    redirectsPlugin({
      collections: ['pages'],
      overrides: {
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'locale',
            type: 'select',
            options: [
              { label: 'Español', value: 'es' },
              { label: 'English', value: 'en' },
            ],
          },
        ],
      },
    }),
  ],
  localization: {
    locales: [
      { code: 'es', label: 'Español' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  defaultDepth: 2,
  maxDepth: 5,
  jobs: {
    autoRun: [{ cron: '* * * * *', queue: 'default' }],
  },
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    declare: false,
  },
  cors: [process.env.NEXT_PUBLIC_SITE_URL ?? '', 'http://localhost:4321', 'http://localhost:3001'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SITE_URL ?? '', 'http://localhost:4321', 'http://localhost:3001'].filter(Boolean),
})
