import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tlgUsers = sqliteTable('tlg_users', {
  id: integer('id').primaryKey(),
  id2: text('id2').unique(),
  username: text('username'),
  fullName: text('full_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  userId: integer('user_id'),
  name: text('name'),
  mimeType: text('mime_type'),
  size: integer('size'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})