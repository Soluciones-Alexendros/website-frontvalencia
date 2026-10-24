import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const menuCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/menu' }),
  schema: z
    .object({
      lang: z.enum(['es', 'en']),
      categories: z.array(
        z.object({
          name: z.string(),
          time: z.string().optional(),
          note: z.string().optional(),
          price: z.string().optional(),
          items: z.array(
            z.object({
              number: z.number().optional(),
              name: z.string(),
              description: z.string().optional(),
              price: z.string().optional(),
              allergens: z.array(z.number()).optional(),
              tags: z.array(z.enum(['ecologico', 'sin-gluten', 'vegano', 'vegetariano', 'picante'])).optional(),
              note: z.string().optional(),
            }),
          ),
        }),
      ),
      allergenLegend: z
        .array(
          z.object({
            code: z.number(),
            name: z.string(),
          }),
        )
        .optional(),
      notes: z.array(z.string()).optional(),
    })
    .passthrough(),
})

const siteCollection = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content' }),
  schema: z
    .object({
      name: z.string(),
      tagline: z.string(),
      description: z.string().optional(),
      ogImage: z.string(),
      ogLocale: z.string(),
      contact: z.object({
        phone: z.string(),
        whatsapp: z.string(),
        email: z.string(),
        reservationsEmail: z.string(),
        eventsEmail: z.string(),
      }),
      location: z.object({
        address: z.string(),
        city: z.string(),
        postalCode: z.string(),
        area: z.string().optional(),
        mapsUrl: z.string(),
        transport: z.object({
          bus: z.array(z.string()),
          parking: z.string(),
          bikeParking: z.string(),
        }),
      }),
      hours: z.object({
        weekday: z.string(),
        weekend: z.string(),
        nights: z.string().optional(),
        nightsNote: z.string().optional(),
      }),
      social: z.object({
        instagram: z.string().optional(),
        facebook: z.string().optional(),
      }),
      externalLinks: z.object({
        club: z.string(),
        careers: z.string(),
        reservations: z.object({
          provider: z.string(),
          es: z.string(),
          en: z.string(),
        }),
      }),
      legal: z.object({
        copyright: z.string(),
        legalAdvice: z.string(),
        privacyPolicy: z.string(),
        cookiesPolicy: z.string(),
      }),
      seo: z
        .record(
          z.string(),
          z.object({
            homeTitle: z.string(),
            homeDescription: z.string(),
            menuTitle: z.string().optional(),
            cartaTitle: z.string().optional(),
            espacioTitle: z.string().optional(),
            spaceTitle: z.string().optional(),
            localizacionTitle: z.string().optional(),
            locationTitle: z.string().optional(),
            reservasTitle: z.string().optional(),
            bookTitle: z.string().optional(),
          }),
        )
        .optional(),
    })
    .passthrough(),
})

export const collections = {
  menu: menuCollection,
  site: siteCollection,
}
