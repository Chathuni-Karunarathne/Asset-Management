import { pgTable, serial, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';

// Assets table - simplified version
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('available'),
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: integer('purchase_price'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Remove user and assignment types since we're not using them
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;