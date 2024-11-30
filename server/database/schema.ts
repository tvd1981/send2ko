import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tlgUsers = sqliteTable('tlg_users', {
  id: integer('id').primaryKey(),
  id2: text('id2').unique(),
  username: text('username'),
  fullName: text('full_name'),
  languageCode: text('language_code'),
  settings: text('settings', { mode: 'json' }).default('{"web": 20, "opds": 20}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const tlgEbooks = sqliteTable('tlg_ebooks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  normalizedTitle: text('normalized_title').notNull(),
  author: text('author').notNull(),
  normalizedAuthor: text('normalized_author').notNull(),
  cover: text('cover'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const tlgFiles = sqliteTable('files', {
  id: text('id').primaryKey(),
  userId: integer('user_id'),
  ebookId: text('ebook_id'),
  name: text('name'),
  mimeType: text('mime_type'),
  size: integer('size'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
