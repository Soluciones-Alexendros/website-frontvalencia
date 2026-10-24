import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isEditorOrAdmin'

const TAGS_OPTIONS = [
  { label: { es: 'Ecológico', en: 'ECO' }, value: 'ecologico' },
  { label: { es: 'Sin Gluten', en: 'Gluten Free' }, value: 'sin-gluten' },
  { label: { es: 'Vegano', en: 'Vegan' }, value: 'vegano' },
  { label: { es: 'Picante', en: 'Spicy' }, value: 'picante' },
]

export const MenuItem: CollectionConfig = {
  slug: 'menu-items',
  labels: {
    singular: { es: 'Plato', en: 'Dish' },
    plural: { es: 'Platos', en: 'Dishes' },
  },
  admin: {
    group: { es: 'Carta', en: 'Menu' },
    useAsTitle: 'name',
    defaultColumns: ['number', 'name', 'category', 'price', 'allergens'],
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'number',
      type: 'number',
      admin: { placeholder: 'Nº de orden en categoría' },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'price',
      type: 'text',
      admin: { placeholder: '12,50€' },
    },
    {
      name: 'allergens',
      type: 'relationship',
      relationTo: 'allergens',
      hasMany: true,
      filterOptions: {},
    },
    {
      name: 'tags',
      type: 'select',
      hasMany: true,
      options: TAGS_OPTIONS,
      admin: { isClearable: true },
    },
    {
      name: 'note',
      type: 'textarea',
      localized: true,
      admin: { placeholder: 'Nota al plato (precio variable, etc.)' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'menu-categories',
      required: true,
    },
  ],
}

export const MenuCategory: CollectionConfig = {
  slug: 'menu-categories',
  labels: {
    singular: { es: 'Categoría', en: 'Category' },
    plural: { es: 'Categorías', en: 'Categories' },
  },
  admin: {
    group: { es: 'Carta', en: 'Menu' },
    useAsTitle: 'name',
    defaultColumns: ['name', 'time', 'order'],
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'time',
      type: 'text',
      localized: true,
      admin: { placeholder: '9:00H / DESDE LAS 13H' },
    },
    {
      name: 'note',
      type: 'textarea',
      localized: true,
      admin: { placeholder: 'Nota general de la categoría' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { placeholder: 'Orden de aparición', step: 1 },
    },
  ],
}
