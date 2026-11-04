import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull(),
  category: text('category').notNull(),
  species: text('species').notNull(),
  message: text('message').notNull(),
  contact: text('contact').notNull().default(''),
  createdAt: integer('created_at').notNull(),
}, table => [index('feedback_client_created_idx').on(table.clientId, table.createdAt)]);
