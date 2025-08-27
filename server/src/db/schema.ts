import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Enums for car properties
export const transmissionEnum = pgEnum('transmission', ['manual', 'automatic']);
export const fuelTypeEnum = pgEnum('fuel_type', ['gasoline', 'diesel', 'electric', 'hybrid']);

// Cars table
export const carsTable = pgTable('cars', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  image_url: text('image_url').notNull(),
  rental_price_per_day: numeric('rental_price_per_day', { precision: 10, scale: 2 }).notNull(),
  transmission: transmissionEnum('transmission').notNull(),
  fuel_type: fuelTypeEnum('fuel_type').notNull(),
  seats: integer('seats').notNull(),
  description: text('description'), // Nullable by default
  features: text('features'), // JSON string of features array, nullable
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Contact information table
export const contactInfoTable = pgTable('contact_info', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  whatsapp_number: text('whatsapp_number').notNull(),
  facebook_url: text('facebook_url'), // Nullable
  instagram_url: text('instagram_url'), // Nullable
  business_hours: text('business_hours').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Car = typeof carsTable.$inferSelect; // For SELECT operations
export type NewCar = typeof carsTable.$inferInsert; // For INSERT operations

export type ContactInfo = typeof contactInfoTable.$inferSelect; // For SELECT operations
export type NewContactInfo = typeof contactInfoTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  cars: carsTable,
  contactInfo: contactInfoTable
};